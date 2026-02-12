"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "@/lib/contract";

export function useUpgrade() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const upgrade = (currentRarityId: number) => {
    writeContract({
      ...contractConfig,
      functionName: "upgradeTokenTo",
      args: [BigInt(currentRarityId + 1)],
    });
  };

  return {
    upgrade,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  };
}
