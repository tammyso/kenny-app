import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../../app-shell";
import InvoiceForm from "./invoice-form";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const calendarConnected = await isCalendarConnected();

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900">New Invoice</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Build the invoice, then save as a draft or send immediately.
          </p>
        </div>
        <Suspense fallback={null}>
          <InvoiceForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
