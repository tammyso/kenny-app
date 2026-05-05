"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats, RevenueBucket } from "@/lib/stats";

type RangeKey = "6m" | "12m" | "all";

const RANGE_LABELS: Record<RangeKey, string> = {
  "6m": "6 months",
  "12m": "1 year",
  all: "All time",
};

const formatDollars = (cents: number) =>
  cents === 0
    ? "$0"
    : `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4"];

export default function DashboardStatsPanel({
  stats,
}: {
  stats: DashboardStats;
}) {
  const hasAnyRevenue = stats.totalRevenueCents > 0;
  const [range, setRange] = useState<RangeKey>("6m");

  const buckets: RevenueBucket[] =
    range === "6m"
      ? stats.monthlyRevenue6m
      : range === "12m"
        ? stats.monthlyRevenue12m
        : stats.yearlyRevenueAllTime;

  return (
    <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Reporting
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="This month" value={formatDollars(stats.thisMonth.revenueCents)} sub={`${stats.thisMonth.bookings} ${stats.thisMonth.bookings === 1 ? "booking" : "bookings"}`} />
        <Stat label="This year" value={formatDollars(stats.thisYear.revenueCents)} sub={`${stats.thisYear.bookings} ${stats.thisYear.bookings === 1 ? "booking" : "bookings"}`} />
        <Stat label="All-time" value={formatDollars(stats.totalRevenueCents)} sub={hasAnyRevenue ? "across paid invoices" : "no paid invoices yet"} />
      </div>

      {hasAnyRevenue ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Revenue
              </p>
              <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white p-0.5 text-xs font-medium">
                {(["6m", "12m", "all"] as RangeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRange(key)}
                    className={`rounded px-2.5 py-1 transition ${
                      range === key
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {RANGE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buckets.map((m) => ({
                    label: m.label,
                    revenue: m.revenueCents / 100,
                  }))}
                  margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                >
                  <XAxis
                    dataKey="label"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f4f4f5" }}
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e4e4e7",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#18181b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {stats.projectTypeBreakdown.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Paid by project type
              </p>
              <div className="flex h-48 items-center gap-4">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.projectTypeBreakdown}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={36}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {stats.projectTypeBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 space-y-1 text-xs text-zinc-700">
                  {stats.projectTypeBreakdown.map((item, i) => (
                    <li key={item.type} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                        aria-hidden
                      />
                      <span className="flex-1">{item.type}</span>
                      <span className="font-medium text-zinc-900">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
          Charts will fill in once you start collecting paid invoices.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}
