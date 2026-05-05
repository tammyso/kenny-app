import type { InquiryRowData } from "@/app/inquiry-row";

// Inquiries don't currently track a paid_at timestamp (paid status comes via
// Stripe refresh). Use invoice_sent_at as a near-enough proxy for when the
// money landed — most invoices get paid within days/weeks of being sent.

export type DashboardStats = {
  thisMonth: { bookings: number; revenueCents: number };
  thisYear: { bookings: number; revenueCents: number };
  totalRevenueCents: number;
  monthlyRevenue: { month: string; revenueCents: number }[];
  projectTypeBreakdown: { type: string; count: number }[];
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
};

export function computeDashboardStats(
  inquiries: InquiryRowData[],
): DashboardStats {
  const now = new Date();
  const currentMonthKey = monthKey(now);
  const currentYear = now.getFullYear();

  const paid = inquiries.filter(
    (i) => i.invoice_status === "paid" && i.invoice_amount_cents,
  );

  let thisMonthBookings = 0;
  let thisMonthRevenue = 0;
  let thisYearBookings = 0;
  let thisYearRevenue = 0;
  let totalRevenue = 0;

  // Build a 6-month rolling window keyed by YYYY-MM, initialized to 0 so
  // months with no revenue still show in the chart.
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(monthKey(d), 0);
  }

  const projectTypeCounts = new Map<string, number>();

  for (const inquiry of paid) {
    const amount = inquiry.invoice_amount_cents ?? 0;
    totalRevenue += amount;

    const referenceDate = inquiry.invoice_sent_at
      ? new Date(inquiry.invoice_sent_at)
      : null;
    if (!referenceDate || isNaN(referenceDate.getTime())) continue;

    const inquiryMonthKey = monthKey(referenceDate);
    if (monthlyMap.has(inquiryMonthKey)) {
      monthlyMap.set(
        inquiryMonthKey,
        (monthlyMap.get(inquiryMonthKey) ?? 0) + amount,
      );
    }

    if (inquiryMonthKey === currentMonthKey) {
      thisMonthBookings += 1;
      thisMonthRevenue += amount;
    }
    if (referenceDate.getFullYear() === currentYear) {
      thisYearBookings += 1;
      thisYearRevenue += amount;
    }

    const type = inquiry.project_type ?? "Other";
    projectTypeCounts.set(type, (projectTypeCounts.get(type) ?? 0) + 1);
  }

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(
    ([key, revenueCents]) => ({
      month: formatMonthLabel(key),
      revenueCents,
    }),
  );

  const projectTypeBreakdown = Array.from(projectTypeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    thisMonth: {
      bookings: thisMonthBookings,
      revenueCents: thisMonthRevenue,
    },
    thisYear: {
      bookings: thisYearBookings,
      revenueCents: thisYearRevenue,
    },
    totalRevenueCents: totalRevenue,
    monthlyRevenue,
    projectTypeBreakdown,
  };
}
