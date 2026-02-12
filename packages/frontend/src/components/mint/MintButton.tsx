"use client";

import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useMint } from "@/hooks/useMint";
import { Button } from "@/components/ui/button";
import { MintStatus } from "@/components/mint/MintStatus";
import { useEffect, useRef } from "react";
import { useNotifications } from "@/context/NotificationContext";

interface MintButtonProps {
  onSuccess?: () => void;
}

export function MintButton({ onSuccess }: MintButtonProps) {
  const { address, isConnected } = useAccount();
  const { mint, hash, isPending, isConfirming, isConfirmed, error, reset } = useMint();
  const { addPendingTx } = useNotifications();
  const prevConfirmed = useRef(false);

  useEffect(() => {
    if (isConfirmed && !prevConfirmed.current) {
      toast.success("Mint successful!");
      if (hash) addPendingTx(hash, "mint", "Minted a Common token");
      onSuccess?.();
    }
    prevConfirmed.current = isConfirmed;
  }, [isConfirmed, onSuccess, hash, addPendingTx]);

  useEffect(() => {
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("user rejected") || msg.includes("user denied")) {
        toast.error("Transaction rejected by user");
      } else if (msg.includes("insufficient funds") || msg.includes("insufficient balance")) {
        toast.error("Insufficient SOMI balance to cover gas fees");
      } else if (msg.includes("chain") || msg.includes("network")) {
        toast.error("Wrong network — please switch to Somnia");
      } else {
        toast.error("Transaction failed: " + error.message.split("\n")[0]);
      }
    }
  }, [error]);

  if (!isConnected) {
    return (
      <Button disabled className="opacity-50">
        Connect wallet to mint
      </Button>
    );
  }

  const handleMint = () => {
    if (!address) return;
    reset();
    prevConfirmed.current = false;
    mint(address);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleMint}
        disabled={isPending || isConfirming}
      >
        {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Mint"}
      </Button>
      {hash && <MintStatus hash={hash} isConfirming={isConfirming} isConfirmed={isConfirmed} />}
    </div>
  );
}
