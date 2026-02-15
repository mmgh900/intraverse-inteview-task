"use client";

import { useAccount } from "wagmi";
import { useCallback } from "react";
import { MintButton } from "@/components/mint/MintButton";
import { TokenGrid } from "@/components/inventory/TokenGrid";
import { TokenInventory } from "@/components/inventory/TokenInventory";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { UpgradeButton } from "@/components/inventory/UpgradeButton";

export default function MintPage() {
  const { isConnected } = useAccount();
  const { balances, totalTokens, isLoading, isError, error, refetch } = useTokenBalances();

  const handleMintSuccess = useCallback(() => {
    setTimeout(() => refetch(), 2000);
  }, [refetch]);

  return (
    <div className="space-y-10 fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Moon Pass Collection
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Mint, collect, and upgrade your tokens on Somnia
          </p>
        </div>
        <MintButton onSuccess={handleMintSuccess} />
      </div>

      <section className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Inventory
          </h2>
          {isConnected && <TokenInventory totalTokens={totalTokens} />}
        </div>

        {!isConnected ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500">Connect your wallet to view tokens</p>
          </div>
        ) : (
          <TokenGrid
            balances={balances}
            isLoading={isLoading}
            isError={isError}
            error={error}
            renderUpgrade={(rarityId, balance) => (
              <UpgradeButton
                rarityId={rarityId}
                balance={balance}
                onSuccess={handleMintSuccess}
              />
            )}
          />
        )}
      </section>
    </div>
  );
}
