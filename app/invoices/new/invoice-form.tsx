"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { createInvoice, sendInvoiceEmail } from "../actions";
import type { LineItem } from "../actions";

type LineItemUI = LineItem & { id: string };

const PRESETS: { group: string; label: string; price: number }[] = [
  { group: "Events", label: "Event Highlight Package", price: 850 },
  { group: "Events", label: "Extended Film Package", price: 1400 },
  { group: "Events", label: "Photography Add-on + Film Package", price: 1850 },
  { group: "Weddings — Full Day", label: "Essential Film Package", price: 2200 },
  { group: "Weddings — Full Day", label: "Signature Film Package", price: 3200 },
  { group: "Weddings — Full Day", label: "Legacy Film Package", price: 4500 },
  { group: "Weddings — Full Day", label: "Signature Photo & Film Package", price: 5900 },
  { group: "Weddings — Focused", label: "Ceremony Film Package", price: 1600 },
  { group: "Weddings — Focused", label: "Reception Film Package", price: 1900 },
  { group: "Weddings — Focused", label: "Ceremony Photo & Film Package", price: 2300 },
  { group: "Weddings — Focused", label: "Reception Photo & Film Package", price: 2600 },
  { group: "Weddings — Focused", label: "Heirloom Film Package", price: 4500 },
  { group: "Add-ons", label: "Extra Coverage Hour (Wedding)", price: 250 },
  { group: "Add-ons", label: "Extra Coverage Hour (Event)", price: 200 },
  { group: "Add-ons", label: "Drone Footage (Wedding)", price: 300 },
  { group: "Add-ons", label: "Drone Footage (Event)", price: 250 },
  { group: "Add-ons", label: "Raw Footage (Wedding)", price: 400 },
  { group: "Add-ons", label: "Raw Footage (Event)", price: 300 },
  { group: "Add-ons", label: "Rush Delivery (Wedding)", price: 500 },
  { group: "Add-ons", label: "Rush Delivery (Event)", price: 400 },
  { group: "Add-ons", label: "Social Media Edits — Vertical (Wedding)", price: 300 },
  { group: "Add-ons", label: "Social Media Edits — Vertical (Event)", price: 250 },
  { group: "Add-ons", label: "Same-Day Edit", price: 1200 },
  { group: "Add-ons", label: "Overtime per hour (Wedding)", price: 250 },
  { group: "Add-ons", label: "Overtime per hour (Event)", price: 200 },
];

const PRESET_GROUPS = Array.from(new Set(PRESETS.map((p) => p.group)));

let idCounter = 0;
const newId = () => `item-${++idCounter}-${Math.random().toString(36).slice(2)}`;

const fmt = (dollars: number) =>
  dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400/20 transition focus:ring-2";

const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

export default function InvoiceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Client info
  const [clientName, setClientName] = useState(params.get("client_name") ?? "");
  const [clientEmail, setClientEmail] = useState(params.get("client_email") ?? "");
  const [clientPhone, setClientPhone] = useState("");

  // Event details
  const initialEventDate = params.get("event_date") ?? "";
  const [eventDate, setEventDate] = useState(initialEventDate);
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItemUI[]>([
    { id: newId(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [selectedPreset, setSelectedPreset] = useState("");

  // Pricing
  const [discountDollars, setDiscountDollars] = useState(0);
  const [paymentType, setPaymentType] = useState<"retainer" | "full">(
    "retainer",
  );
  const [retainerDueDate, setRetainerDueDate] = useState("");
  const [balanceDueDate, setBalanceDueDate] = useState(
    initialEventDate ? addDays(initialEventDate, -14) : "",
  );

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = Math.max(0, subtotal - discountDollars);
  const retainerAmount = total * 0.3;
  const balanceAmount = total - retainerAmount;

  const handleEventDateChange = (val: string) => {
    setEventDate(val);
    if (val) {
      setBalanceDueDate(addDays(val, -14));
    }
  };

  const addPreset = () => {
    const preset = PRESETS.find((p) => p.label === selectedPreset);
    if (!preset) return;
    setLineItems((prev) => [
      ...prev,
      { id: newId(), description: preset.label, quantity: 1, unitPrice: preset.price },
    ]);
    setSelectedPreset("");
  };

  const addCustomRow = () => {
    setLineItems((prev) => [
      ...prev,
      { id: newId(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "quantity" || field === "unitPrice") {
          return { ...item, [field]: parseFloat(value) || 0 };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getArgs = () => ({
    clientName: clientName.trim(),
    clientEmail: clientEmail.trim(),
    clientPhone: clientPhone.trim() || undefined,
    eventDate: eventDate || undefined,
    eventLocation: eventLocation.trim() || undefined,
    eventTime: eventTime.trim() || undefined,
    lineItems: lineItems
      .filter((item) => item.description.trim())
      .map(({ description, quantity, unitPrice }) => ({
        description,
        quantity,
        unitPrice,
      })),
    discountDollars,
    paymentType,
    retainerDueDate: retainerDueDate || undefined,
    balanceDueDate: balanceDueDate || undefined,
  });

  const validate = () => {
    if (!clientName.trim()) return "Client name is required.";
    if (!clientEmail.trim()) return "Client email is required.";
    const items = lineItems.filter((i) => i.description.trim());
    if (items.length === 0) return "Add at least one line item.";
    if (total <= 0) return "Invoice total must be greater than zero.";
    return null;
  };

  const handleSaveDraft = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    startTransition(async () => {
      const result = await createInvoice(getArgs());
      if (!result.ok) { setError(result.error); return; }
      router.push(`/invoices/${result.id}`);
    });
  };

  const handleSendNow = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    startTransition(async () => {
      const result = await createInvoice(getArgs());
      if (!result.ok) { setError(result.error); return; }
      await sendInvoiceEmail(result.id);
      router.push(`/invoices/${result.id}`);
    });
  };

  return (
    <div className="space-y-8">
      {/* Client info */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Client</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={inputClass}
              placeholder="Deneil Norwood"
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={inputClass}
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className={inputClass}
              placeholder="631-555-0100"
            />
          </div>
        </div>
      </section>

      {/* Event details */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">
          Event Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => handleEventDateChange(e.target.value)}
              style={{ colorScheme: "light" }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input
              type="text"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className={inputClass}
              placeholder="5:30pm – 8:30pm"
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className={inputClass}
              placeholder="14 East Main St, Patchogue, NY"
            />
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Line Items</h2>

        {/* Preset selector */}
        <div className="mb-4 flex gap-2">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400/20"
          >
            <option value="">Add from package presets…</option>
            {PRESET_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {PRESETS.filter((p) => p.group === group).map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label} — {fmt(p.price)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={addPreset}
            disabled={!selectedPreset}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {/* Items table */}
        <div className="mb-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-400">
                <th className="pb-2 pr-3">Description</th>
                <th className="w-20 pb-2 pr-3">Qty</th>
                <th className="w-28 pb-2 pr-3">Unit Price</th>
                <th className="w-24 pb-2 pr-3 text-right">Total</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Service description"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, "unitPrice", e.target.value)
                        }
                        className={`${inputClass} pl-6`}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-zinc-700">
                    {fmt(item.quantity * item.unitPrice)}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addCustomRow}
          className="text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-700 hover:underline"
        >
          + Add custom line
        </button>
      </section>

      {/* Discount + payment type */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Payment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Discount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountDollars}
                onChange={(e) =>
                  setDiscountDollars(parseFloat(e.target.value) || 0)
                }
                className={`${inputClass} pl-6`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Payment type</label>
            <div className="flex gap-2">
              {(["retainer", "full"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentType(type)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    paymentType === type
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {type === "retainer" ? "30% Retainer" : "Pay in Full"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {paymentType === "retainer" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Retainer due date</label>
              <input
                type="date"
                value={retainerDueDate}
                onChange={(e) => setRetainerDueDate(e.target.value)}
                style={{ colorScheme: "light" }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Balance due date
                {eventDate && (
                  <span className="ml-1 text-zinc-400">
                    (auto-set 14 days before event)
                  </span>
                )}
              </label>
              <input
                type="date"
                value={balanceDueDate}
                onChange={(e) => setBalanceDueDate(e.target.value)}
                style={{ colorScheme: "light" }}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Totals summary */}
        <div className="mt-6 space-y-2 border-t border-zinc-100 pt-4 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountDollars > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>Discount</span>
              <span>−{fmt(discountDollars)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-zinc-900">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
          {paymentType === "retainer" && total > 0 && (
            <>
              <div className="flex justify-between text-zinc-500">
                <span>30% Retainer due now</span>
                <span>{fmt(retainerAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Remaining balance</span>
                <span>{fmt(balanceAmount)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={handleSendNow}
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Save & Send to Client"}
        </button>
      </div>
    </div>
  );
}
