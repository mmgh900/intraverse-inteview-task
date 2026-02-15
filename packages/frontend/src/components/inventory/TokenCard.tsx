import Image from "next/image";
import { Zap } from "lucide-react";
import { MAX_RARITY_ID } from "@intraverse/shared";
import type { Rarity } from "@intraverse/shared";
import type { ReactNode } from "react";

const CARD_IMAGES: Record<number, string> = {
  1: "/cards/1-common.svg",
  2: "/cards/2-uncommon.svg",
  3: "/cards/3-rare.svg",
  4: "/cards/4-epic.svg",
  5: "/cards/5-legendary.svg",
  6: "/cards/6-mythic.svg",
  7: "/cards/7-divine.svg",
  8: "/cards/8-celestial.svg",
  9: "/cards/9-transcendent.svg",
  10: "/cards/10-immortal.svg",
  11: "/cards/11-eternal.svg",
  12: "/cards/12-omega.svg",
  13: "/cards/13-supreme.svg",
};

interface TokenCardProps {
  rarity: Rarity;
  balance: number;
  upgradeSlot?: ReactNode;
}

export function TokenCard({ rarity, balance, upgradeSlot }: TokenCardProps) {
  const imageSrc = CARD_IMAGES[rarity.id];
  const progress = Math.min(balance, 2);
  const isFull = balance >= 2;
  const isMaxRarity = rarity.id >= MAX_RARITY_ID;

  return (
    <div
      className={`glass overflow-hidden transition-all duration-200 hover:border-white/[0.12] ${isFull && !isMaxRarity ? "ring-pulse" : ""}`}
    >
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${rarity.color}40, ${rarity.color}, ${rarity.color}40)` }} />

      {imageSrc && (
        <div className="px-3 pt-3">
          <div className="relative w-full aspect-[5/6] rounded-lg overflow-hidden bg-white/[0.02]">
            <Image
              src={imageSrc}
              alt={`${rarity.name} card`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: rarity.color }}>
            {rarity.name}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">x{rarity.baseMultiplier}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tabular-nums text-white">{balance}</span>
          {upgradeSlot}
        </div>

        {!isMaxRarity && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Upgrade</span>
              <span className="text-[10px] tabular-nums text-zinc-400">{progress}/2</span>
            </div>
            <div className="relative h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFull ? "progress-shine" : ""}`}
                style={{
                  width: `${(progress / 2) * 100}%`,
                  backgroundColor: rarity.color,
                }}
              />
            </div>
            {isFull && (
              <div className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" style={{ color: rarity.color }} />
                <span className="text-[10px] font-medium" style={{ color: rarity.color }}>
                  Ready to upgrade
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
