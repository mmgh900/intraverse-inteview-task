"use client";

import { useSummary } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from "viem";

export function KPICards() {
  const { data, isLoading, isError } = useSummary();

  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-red-400">Failed to load</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Transactions",
      value: data?.totalTxCount.toLocaleString() ?? "0",
    },
    {
      title: "Total Gas Used",
      value: data ? BigInt(data.totalGasUsed).toLocaleString() : "0",
    },
    {
      title: "Total Gas Cost",
      value: data
        ? `${formatEther(BigInt(data.totalGasCost))} SOMI`
        : "0 SOMI",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-white">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
