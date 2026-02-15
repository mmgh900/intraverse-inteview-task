"use client";

import { Loader2 } from "lucide-react";
import { KPICards } from "@/components/analytics/KPICards";
import { DailyChart } from "@/components/analytics/DailyChart";
import { TransactionsTable } from "@/components/analytics/TransactionsTable";
import { useNotifications } from "@/context/NotificationContext";

export default function AnalyticsPage() {
  const { pendingTxHashes } = useNotifications();
  const pendingCount = pendingTxHashes.size;

  return (
    <div className="space-y-10 fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Analytics
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          On-chain transaction analytics
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3">
          <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
          <span className="text-sm text-amber-300/80">
            Syncing {pendingCount} transaction{pendingCount > 1 ? "s" : ""}...
          </span>
        </div>
      )}

      <KPICards />
      <DailyChart />
      <TransactionsTable />
    </div>
  );
}
