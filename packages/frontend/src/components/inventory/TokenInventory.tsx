interface TokenInventoryProps {
  totalTokens: number;
}

export function TokenInventory({ totalTokens }: TokenInventoryProps) {
  return (
    <span className="text-xs text-zinc-500 tabular-nums">
      {totalTokens} token{totalTokens !== 1 ? "s" : ""} total
    </span>
  );
}
