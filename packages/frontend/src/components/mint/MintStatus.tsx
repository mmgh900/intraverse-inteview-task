import { SOMNIA_CHAIN } from "@intraverse/shared";
import { ExternalLink } from "lucide-react";

interface MintStatusProps {
  hash: string;
  isConfirming: boolean;
  isConfirmed: boolean;
}

export function MintStatus({ hash, isConfirming, isConfirmed }: MintStatusProps) {
  const explorerUrl = `${SOMNIA_CHAIN.blockExplorers.default.url}/tx/${hash}`;

  return (
    <div className="flex items-center gap-2 text-xs fade-in">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300 transition-colors font-mono truncate max-w-48"
      >
        {hash.slice(0, 10)}...{hash.slice(-8)}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
      {isConfirming && (
        <span className="text-[11px] text-zinc-500 animate-pulse">Pending</span>
      )}
      {isConfirmed && (
        <span className="text-[11px] text-emerald-400">Confirmed</span>
      )}
    </div>
  );
}
