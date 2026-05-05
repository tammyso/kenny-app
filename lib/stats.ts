import type { InquiryRowData } from "@/app/inquiry-row";

// Inquiries don't currently track a paid_at timestamp (paid status comes via
// Stripe refresh). Use invoice_sent_at as a near-enough proxy for when the
// money landed — most invoices get paid within days/weeks of being sent.

export type RevenueBucket = { label: string; revenueCents: number };

export type DashboardStats = {
  thisMonth: { bookings: number; revenueCents: number };
  thisYear: { bookings: number; revenueCents: number };
  totalRevenueCents: number;
  // Three pre-bucketed series so the chart can switch ranges without
  // re-querying.
  monthlyRevenue6m: RevenueBucket[];
  monthlyRevenue12m: RevenueBucket[];
  yearlyRevenueAllTime: RevenueBucket[];
  projectTypeBreakdown: { type: string; count: number }[];
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
};

const formatMonthYearLabel = (key: string) => {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
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

  // Pre-seed empty months/years so the chart still renders gridlines
  // when revenue's zero in some periods.
  const monthly6 = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly6.set(monthKey(d), 0);
  }
  const monthly12 = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly12.set(monthKey(d), 0);
  }
  const yearly = new Map<string, number>();

  const projectTypeCounts = new Map<string, number>();

  for (const inquiry of paid) {
    const amount = inquiry.invoice_amount_cents ?? 0;
    totalRevenue += amount;

    const referenceDate = inquiry.invoice_sent_at
      ? new Date(inquiry.invoice_sent_at)
      : null;
    if (!referenceDate || isNaN(referenceDate.getTime())) continue;

    const mKey = monthKey(referenceDate);
    if (monthly6.has(mKey)) {
      monthly6.set(mKey, (monthly6.get(mKey) ?? 0) + amount);
    }
    if (monthly12.has(mKey)) {
      monthly12.set(mKey, (monthly12.get(mKey) ?? 0) + amount);
    }
    const yKey = String(referenceDate.getFullYear());
    yearly.set(yKey, (yearly.get(yKey) ?? 0) + amount);

    if (mKey === currentMonthKey) {
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

  // Make sure the all-time yearly series spans every year between the first
  // and current, even years with zero revenue.
  if (yearly.size > 0) {
    const firstYear = Math.min(...Array.from(yearly.keys()).map(Number));
    for (let y = firstYear; y <= currentYear; y++) {
      if (!yearly.has(String(y))) yearly.set(String(y), 0);
    }
  }

  const sortByKey = (a: [string, number], b: [string, number]) =>
    a[0] < b[0] ? -1 : 1;

  const monthlyRevenue6m = Array.from(monthly6.entries())
    .sort(sortByKey)
    .map(([key, revenueCents]) => ({
      label: formatMonthLabel(key),
      revenueCents,
    }));
  const monthlyRevenue12m = Array.from(monthly12.entries())
    .sort(sortByKey)
    .map(([key, revenueCents]) => ({
      label: formatMonthYearLabel(key),
      revenueCents,
    }));
  const yearlyRevenueAllTime = Array.from(yearly.entries())
    .sort(sortByKey)
    .map(([key, revenueCents]) => ({ label: key, revenueCents }));

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
    monthlyRevenue6m,
    monthlyRevenue12m,
    yearlyRevenueAllTime,
    projectTypeBreakdown,
  };
}
