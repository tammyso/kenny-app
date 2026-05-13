import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return NextResponse.json(
      { error: "Missing webhook secret or signature" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentLinkId = session.payment_link as string | null;
    if (!paymentLinkId) return NextResponse.json({ received: true });

    const supabase = createSupabaseAdminClient();

    // Check if this is a retainer payment
    const { data: retainerInvoice } = await supabase
      .from("invoices")
      .select("id, payment_type, status")
      .eq("stripe_retainer_link_id", paymentLinkId)
      .maybeSingle();

    if (retainerInvoice) {
      const newStatus =
        retainerInvoice.payment_type === "full" ? "paid_in_full" : "retainer_paid";
      await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", retainerInvoice.id);
      return NextResponse.json({ received: true });
    }

    // Check if this is a balance payment
    const { data: balanceInvoice } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("stripe_balance_link_id", paymentLinkId)
      .maybeSingle();

    if (balanceInvoice) {
      await supabase
        .from("invoices")
        .update({ status: "paid_in_full" })
        .eq("id", balanceInvoice.id);
    }
  }

  return NextResponse.json({ received: true });
}
