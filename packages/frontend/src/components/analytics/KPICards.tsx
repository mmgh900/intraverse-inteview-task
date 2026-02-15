"use client";

import { useSummary } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from "viem";

export function KPICards() {
  const { data, isLoading, isError } = useSummary();

  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass p-5">
            <p className="text-sm text-red-400/70">Failed to load</p>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Transactions",
      value: data?.totalTxCount.toLocaleString() ?? "0",
    },
    {
      label: "Total Gas Used",
      value: data ? BigInt(data.totalGasUsed).toLocaleString() : "0",
    },
    {
      label: "Total Gas Cost",
      value: data
        ? `${formatEther(BigInt(data.totalGasCost))} SOMI`
        : "0 SOMI",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="glass p-5 space-y-2">
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">
            {card.label}
          </p>
          {isLoading ? (
            <Skeleton className="h-7 w-24 bg-white/[0.04] rounded" />
          ) : (
            <p className="text-2xl font-semibold text-white tabular-nums tracking-tight">
              {card.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
