"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useAnalytics";
import { SOMNIA_CHAIN } from "@intraverse/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

export function TransactionsTable() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useTransactions(PAGE_SIZE, offset);

  const explorerUrl = SOMNIA_CHAIN.blockExplorers.default.url;

  return (
    <div className="glass overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.04]">
        <h3 className="text-sm font-medium text-zinc-400">
          Recent Transactions
        </h3>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-white/[0.03] rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6">
          <p className="text-sm text-red-400/70">Failed to load transactions</p>
        </div>
      ) : !data?.data.length ? (
        <div className="p-6">
          <p className="text-sm text-zinc-600">No transactions found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Tx Hash</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Block</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.data.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <a
                        href={`${explorerUrl}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-300 hover:text-white transition-colors font-mono text-xs"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </a>
                    </td>
                    <td className="px-6 py-3 tabular-nums text-zinc-400 text-xs">{tx.blockNumber}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        tx.method === "mint"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tx.method === "upgradeTokenTo"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-white/[0.05] text-zinc-400"
                      }`}>
                        {tx.method === "upgradeTokenTo" ? "upgrade" : tx.method ?? "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                      {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                    </td>
                    <td className="px-6 py-3 text-xs text-zinc-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.04]">
            <span className="text-xs text-zinc-500 tabular-nums">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="h-7 px-3 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= (data?.total ?? 0)}
                className="h-7 px-3 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
