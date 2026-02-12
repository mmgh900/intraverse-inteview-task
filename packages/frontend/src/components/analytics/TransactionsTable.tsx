"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useAnalytics";
import { SOMNIA_CHAIN } from "@intraverse/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

export function TransactionsTable() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useTransactions(PAGE_SIZE, offset);

  const explorerUrl = SOMNIA_CHAIN.blockExplorers.default.url;

  const methodBadge = (method: string | null) => {
    if (method === "mint")
      return <Badge className="bg-green-600 text-white">mint</Badge>;
    if (method === "upgradeTokenTo")
      return <Badge className="bg-blue-600 text-white">upgrade</Badge>;
    return <Badge variant="secondary">{method ?? "unknown"}</Badge>;
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-red-400">Failed to load transactions</p>
        ) : !data?.data.length ? (
          <p className="text-gray-500">No transactions found</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell>
                      <a
                        href={`${explorerUrl}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </a>
                    </TableCell>
                    <TableCell>{tx.blockNumber}</TableCell>
                    <TableCell>{methodBadge(tx.method)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                Showing {offset + 1}-
                {Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={offset + PAGE_SIZE >= (data?.total ?? 0)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
