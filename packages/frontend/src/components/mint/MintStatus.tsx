import { Badge } from "@/components/ui/badge";
import { SOMNIA_CHAIN } from "@intraverse/shared";

interface MintStatusProps {
  hash: string;
  isConfirming: boolean;
  isConfirmed: boolean;
}

export function MintStatus({ hash, isConfirming, isConfirmed }: MintStatusProps) {
  const explorerUrl = `${SOMNIA_CHAIN.blockExplorers.default.url}/tx/${hash}`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:text-indigo-300 underline truncate max-w-48"
      >
        {hash.slice(0, 10)}...{hash.slice(-8)}
      </a>
      {isConfirming && <Badge variant="secondary">Pending</Badge>}
      {isConfirmed && <Badge className="bg-green-600 text-white">Confirmed</Badge>}
    </div>
  );
}
