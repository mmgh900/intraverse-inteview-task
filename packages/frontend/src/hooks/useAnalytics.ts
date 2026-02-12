"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSummary, fetchDailyStats, fetchTransactions } from "@/lib/api";

export function useSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
    staleTime: 30_000,
  });
}

export function useDailyStats(from: string, to: string) {
  return useQuery({
    queryKey: ["analytics", "daily", from, to],
    queryFn: () => fetchDailyStats(from, to),
    staleTime: 60_000,
    enabled: !!from && !!to,
  });
}

export function useTransactions(limit: number, offset: number) {
  return useQuery({
    queryKey: ["analytics", "txs", limit, offset],
    queryFn: () => fetchTransactions(limit, offset),
    staleTime: 30_000,
  });
}
