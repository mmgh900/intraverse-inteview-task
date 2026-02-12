import { RARITIES } from "@intraverse/shared";
import { TokenCard } from "@/components/inventory/TokenCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface TokenGridProps {
  balances: Record<number, number>;
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  renderUpgrade?: (rarityId: number, balance: number) => ReactNode;
}

export function TokenGrid({ balances, isLoading, isError, error, renderUpgrade }: TokenGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-lg">Failed to load balances</p>
        <p className="text-sm mt-1 text-gray-500">
          {error?.message?.split("\n")[0] || "Check your network connection"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {RARITIES.map((rarity) => (
        <TokenCard
          key={rarity.id}
          rarity={rarity}
          balance={balances[rarity.id] ?? 0}
          upgradeSlot={renderUpgrade?.(rarity.id, balances[rarity.id] ?? 0)}
        />
      ))}
    </div>
  );
}
