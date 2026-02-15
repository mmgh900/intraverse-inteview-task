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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-400">Failed to load balances</p>
        <p className="text-sm mt-1 text-zinc-500">
          {error?.message?.split("\n")[0] || "Check your network connection"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
