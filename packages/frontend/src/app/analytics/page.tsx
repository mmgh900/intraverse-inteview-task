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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">On-chain transaction analytics</p>
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 animate-pulse">
          <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
          <span className="text-sm text-amber-200">
            Waiting for {pendingCount} transaction{pendingCount > 1 ? "s" : ""} to be indexed...
          </span>
        </div>
      )}
      <KPICards />
      <DailyChart />
      <TransactionsTable />
    </div>
  );
}
