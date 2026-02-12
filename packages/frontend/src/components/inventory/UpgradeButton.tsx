"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RARITIES, MAX_RARITY_ID } from "@intraverse/shared";
import { useUpgrade } from "@/hooks/useUpgrade";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UpgradeButtonProps {
  rarityId: number;
  balance: number;
  onSuccess?: () => void;
}

export function UpgradeButton({ rarityId, balance, onSuccess }: UpgradeButtonProps) {
  const [open, setOpen] = useState(false);
  const { upgrade, hash, isPending, isConfirming, isConfirmed, error, reset } = useUpgrade();
  const { addPendingTx } = useNotifications();
  const prevConfirmed = useRef(false);

  const currentRarity = RARITIES.find((r) => r.id === rarityId);
  const nextRarity = RARITIES.find((r) => r.id === rarityId + 1);

  useEffect(() => {
    if (isConfirmed && !prevConfirmed.current) {
      toast.success(`Upgraded to ${nextRarity?.name}!`);
      if (hash) addPendingTx(hash, "upgrade", `Upgraded to ${nextRarity?.name}`);
      setOpen(false);
      onSuccess?.();
      reset();
    }
    prevConfirmed.current = isConfirmed;
  }, [isConfirmed, nextRarity?.name, onSuccess, reset, hash, addPendingTx]);

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
        toast.error("Upgrade failed: " + error.message.split("\n")[0]);
      }
    }
  }, [error]);

  if (rarityId >= MAX_RARITY_ID) return null;

  const canUpgrade = balance >= 2;

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" disabled={!canUpgrade}>
          Upgrade to next rarity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Upgrade to {nextRarity?.name}
          </DialogTitle>
          <DialogDescription>
            Burn 2 <span style={{ color: currentRarity?.color }}>{currentRarity?.name}</span> tokens
            to receive 1 <span style={{ color: nextRarity?.color }}>{nextRarity?.name}</span> token.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center text-sm text-gray-400">
          <p>
            Current balance: <span className="font-bold text-white">{balance}</span> {currentRarity?.name}
          </p>
          <p className="mt-1">
            After upgrade: <span className="font-bold text-white">{balance - 2}</span> {currentRarity?.name}
            {" + "}
            <span className="font-bold text-white">1</span> {nextRarity?.name}
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              prevConfirmed.current = false;
              upgrade(rarityId);
            }}
            disabled={isPending || isConfirming}
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Upgrading..." : "Confirm Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {!canUpgrade && balance > 0 && (
      <p className="text-xs text-gray-500 mt-1">Need 2 tokens to upgrade</p>
    )}
    </>
  );
}
