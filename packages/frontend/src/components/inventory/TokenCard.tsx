import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Rarity } from "@intraverse/shared";
import type { ReactNode } from "react";

interface TokenCardProps {
  rarity: Rarity;
  balance: number;
  upgradeSlot?: ReactNode;
}

export function TokenCard({ rarity, balance, upgradeSlot }: TokenCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: rarity.color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" style={{ color: rarity.color }}>
            {rarity.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            x{rarity.baseMultiplier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-white">{balance}</p>
          {upgradeSlot}
        </div>
      </CardContent>
    </Card>
  );
}
