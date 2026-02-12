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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Moon Pass Collection</h1>
          <p className="text-gray-400 mt-1">Mint and manage your Moon Pass tokens</p>
        </div>
        <div>
          <MintButton onSuccess={handleMintSuccess} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Inventory</h2>
          {isConnected && <TokenInventory totalTokens={totalTokens} />}
        </div>
        {!isConnected ? (
          <p className="text-gray-500">Connect your wallet to view your tokens</p>
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
      </div>
    </div>
  );
}
