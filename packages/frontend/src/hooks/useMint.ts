"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "@/lib/contract";

export function useMint() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (address: `0x${string}`) => {
    writeContract({
      ...contractConfig,
      functionName: "mint",
      args: [address, "0x0"],
    });
  };

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  };
}
