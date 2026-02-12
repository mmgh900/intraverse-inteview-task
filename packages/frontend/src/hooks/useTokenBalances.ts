"use client";

import { useAccount, useReadContract } from "wagmi";
import { contractConfig } from "@/lib/contract";
import { RARITY_COUNT } from "@intraverse/shared";

export function useTokenBalances() {
  const { address } = useAccount();

  const ids = Array.from({ length: RARITY_COUNT }, (_, i) => BigInt(i + 1));
  const accounts = address
    ? Array.from({ length: RARITY_COUNT }, () => address)
    : [];

  const { data, isLoading, isError, error, refetch } = useReadContract({
    ...contractConfig,
    functionName: "balanceOfBatch",
    args: [accounts as `0x${string}`[], ids],
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  const balances: Record<number, number> = {};
  let totalTokens = 0;

  if (data) {
    const results = data as bigint[];
    for (let i = 0; i < RARITY_COUNT; i++) {
      const val = Number(results[i]);
      balances[i + 1] = val;
      totalTokens += val;
    }
  }

  return { balances, totalTokens, isLoading, isError, error, refetch };
}
