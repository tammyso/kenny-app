import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";
import { FROM_ADDRESS } from "@/lib/email";

type DigestInquiry = {
  id: string;
  client_name: string;
  project_type: string | null;
  event_date: string | null;
  draft_status: string | null;
  status: string | null;
  invoice_status: string | null;
  sent_at: string | null;
  created_at: string;
};

// Vercel hits this on the schedule in vercel.json. Manual GET (no auth) works
// too in dev / for one-off testing — when CRON_SECRET is set in production,
// the bearer-token check rejects unauthenticated calls.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.OWNER_NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "missing env vars" });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id, client_name, project_type, event_date, draft_status, status, invoice_status, sent_at, created_at",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []) as DigestInquiry[];
  const newInquiries = list.filter((i) => !i.draft_status);
  const draftsReady = list.filter((i) => i.draft_status === "ready_to_send");
  const sentNoBooking = list.filter(
    (i) => i.draft_status === "sent" && i.status !== "booked",
  );
  const bookedNoInvoice = list.filter(
    (i) => i.status === "booked" && !i.invoice_status,
  );
  const invoicedUnpaid = list.filter(
    (i) => i.invoice_status && i.invoice_status !== "paid",
  );

  const lines = [
    "Your week in inquiries",
    "",
    `${newInquiries.length} new — awaiting your review`,
    `${draftsReady.length} draft${draftsReady.length === 1 ? "" : "s"} ready to send`,
    `${sentNoBooking.length} sent, awaiting client response`,
    `${bookedNoInvoice.length} booked but not yet invoiced`,
    `${invoicedUnpaid.length} invoiced but unpaid`,
  ];

  const actionable: string[] = [];
  draftsReady
    .slice(0, 5)
    .forEach((i) => actionable.push(`- Send draft to ${i.client_name}`));
  bookedNoInvoice
    .slice(0, 5)
    .forEach((i) =>
      actionable.push(
        `- Send invoice for ${i.client_name}'s ${i.project_type ?? "shoot"}`,
      ),
    );
  invoicedUnpaid
    .slice(0, 5)
    .forEach((i) =>
      actionable.push(`- Follow up on unpaid invoice for ${i.client_name}`),
    );

  if (actionable.length) {
    lines.push("", "Top action items:", ...actionable);
  } else {
    lines.push("", "Nothing on your plate this week — clean inbox.");
  }

  lines.push("", `Open the dashboard: ${getSiteUrl()}/`);

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: process.env.OWNER_NOTIFICATION_EMAIL,
      subject: "Weekly digest — pending actions",
      text: lines.join("\n"),
    });
  } catch (sendErr) {
    return NextResponse.json(
      {
        error:
          sendErr instanceof Error ? sendErr.message : "Failed to send digest",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    counts: {
      newInquiries: newInquiries.length,
      draftsReady: draftsReady.length,
      sentNoBooking: sentNoBooking.length,
      bookedNoInvoice: bookedNoInvoice.length,
      invoicedUnpaid: invoicedUnpaid.length,
    },
  });
}
