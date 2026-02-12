"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import { somniaChain } from "@/lib/chain";
import { Button } from "@/components/ui/button";

export function NetworkBanner() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chainId === somniaChain.id) return null;

  const handleSwitch = () => {
    switchChain(
      { chainId: somniaChain.id },
      {
        onSuccess: () => toast.success("Switched to Somnia"),
        onError: (err) => {
          const msg = err.message.toLowerCase();
          if (msg.includes("user rejected") || msg.includes("user denied")) {
            toast.error("Network switch rejected by user");
          } else {
            toast.error("Failed to switch network. Please add Somnia manually in MetaMask.");
          }
        },
      }
    );
  };

  return (
    <div className="bg-yellow-900/50 border-b border-yellow-700 px-4 py-2 text-center text-sm text-yellow-200">
      You are connected to the wrong network.{" "}
      <Button variant="link" size="sm" className="text-yellow-100 underline" onClick={handleSwitch}>
        Switch to Somnia
      </Button>
    </div>
  );
}
