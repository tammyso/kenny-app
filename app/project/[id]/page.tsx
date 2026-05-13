import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getVideoEmbedUrl } from "@/lib/video-embed";
import ProjectComment from "./project-comment";
import ProjectMessages from "./project-messages";

type ProjectRoomData = {
  id: string;
  client_name: string;
  project_type: string | null;
  event_date: string | null;
  status: string | null;
  deliverable_url: string | null;
  pre_shoot_completed_at: string | null;
};

type InvoiceData = {
  id: string;
  total: number;
  retainer_amount: number;
  payment_type: string;
  status: string;
  stripe_retainer_url: string | null;
  stripe_balance_url: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return value;
};

export default async function ProjectRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select(
      "id, client_name, project_type, event_date, status, deliverable_url, pre_shoot_completed_at",
    )
    .eq("id", id)
    .maybeSingle<ProjectRoomData>();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total, retainer_amount, payment_type, status, stripe_retainer_url, stripe_balance_url")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<InvoiceData>();

  const { data: messages } = await supabase
    .from("project_messages")
    .select("id, sender_name, message, created_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  // Only expose booked projects via the public link, and never anything that
  // hasn't been booked yet (drafts, etc. shouldn't leak through this page).
  if (!inquiry || inquiry.status !== "booked") {
    notFound();
  }

  const eventLabel = formatDate(inquiry.event_date);
  const projectLabel = inquiry.project_type ?? "Shoot";

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-12">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Project room
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
          {inquiry.client_name}
        </h1>
        <p className="mt-3 text-base text-zinc-700">
          Your {projectLabel.toLowerCase()} with Kenny is booked
          {eventLabel ? ` for ${eventLabel}` : ""}. This page is the live status
          for the project — bookmark it to check back any time.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Booking
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Project</dt>
              <dd className="font-medium text-zinc-900">{projectLabel}</dd>
            </div>
            {eventLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Date</dt>
                <dd className="font-medium text-zinc-900">{eventLabel}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Status</dt>
              <dd className="font-medium text-emerald-700">Confirmed</dd>
            </div>
          </dl>
        </section>

        {invoice && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Invoice
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Total</p>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {(invoice.total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500">Status</p>
                  <p className="font-medium capitalize text-zinc-900">{invoice.status}</p>
                </div>
              </div>
              {invoice.status !== "paid_in_full" && invoice.payment_type === "retainer" && invoice.stripe_retainer_url && invoice.status === "sent" && (
                <a
                  href={invoice.stripe_retainer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Pay retainer ({(invoice.retainer_amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })})
                </a>
              )}
              {invoice.status !== "paid_in_full" && invoice.payment_type === "retainer" && invoice.stripe_balance_url && invoice.status === "retainer_paid" && (
                <a
                  href={invoice.stripe_balance_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Pay remaining balance ({((invoice.total - invoice.retainer_amount) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })})
                </a>
              )}
              {invoice.status !== "paid_in_full" && invoice.payment_type === "full" && invoice.stripe_retainer_url && (
                <a
                  href={invoice.stripe_retainer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Pay in full ({(invoice.total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })})
                </a>
              )}
              <a
                href={`/invoices/${invoice.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                View full invoice
              </a>
            </div>
          </section>
        )}

        {!inquiry.pre_shoot_completed_at && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-800">
              Action needed
            </p>
            <p className="mt-2 text-sm text-amber-900">
              Pre-shoot details aren&apos;t filled out yet. Takes about 3
              minutes and helps the day run smoothly.
            </p>
            <a
              href={`/questionnaire/${inquiry.id}`}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-amber-900 px-4 text-sm font-medium text-amber-50 transition hover:bg-amber-800"
            >
              Fill out pre-shoot details
            </a>
          </section>
        )}

        {inquiry.deliverable_url ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Final delivery
            </p>
            {(() => {
              const embed = getVideoEmbedUrl(inquiry.deliverable_url);
              if (embed) {
                return (
                  <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
                    <iframe
                      src={embed}
                      title="Final video"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                      className="aspect-video w-full"
                    />
                  </div>
                );
              }
              return (
                <a
                  href={inquiry.deliverable_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Open delivery link
                </a>
              );
            })()}
            <ProjectComment inquiryId={inquiry.id} />
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center text-sm text-zinc-500">
            The final video will land here once the shoot is in the can.
          </section>
        )}
      </div>

      <ProjectMessages inquiryId={id} messages={messages ?? []} />
    </main>
  );
}
