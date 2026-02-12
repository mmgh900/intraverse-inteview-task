import { Badge } from "@/components/ui/badge";

interface TokenInventoryProps {
  totalTokens: number;
}

export function TokenInventory({ totalTokens }: TokenInventoryProps) {
  return (
    <Badge variant="secondary" className="text-sm">
      {totalTokens} token{totalTokens !== 1 ? "s" : ""}
    </Badge>
  );
}
