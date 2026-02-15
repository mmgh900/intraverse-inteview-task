"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useDailyStats } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export function DailyChart() {
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const { data, isLoading, isError } = useDailyStats(from, to);

  return (
    <div className="glass p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          Daily Transactions
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-xs text-zinc-300 focus:border-white/[0.12] focus:outline-none transition-colors"
          />
          <span className="text-zinc-600 text-xs">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-xs text-zinc-300 focus:border-white/[0.12] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full bg-white/[0.03] rounded-lg" />
      ) : isError ? (
        <div className="h-64 flex items-center justify-center text-red-400/70 text-sm">
          Failed to load chart data
        </div>
      ) : !data?.data.length ? (
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
          No data for selected period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.data}>
            <defs>
              <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.15)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20, 20, 20, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "#e4e4e7",
                fontSize: "13px",
                backdropFilter: "blur(8px)",
              }}
            />
            <Area
              type="monotone"
              dataKey="txCount"
              name="Transactions"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              fill="url(#txGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#fff", stroke: "rgba(255,255,255,0.3)", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
