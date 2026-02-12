import type { AnalyticsSummary, DailyStats, TransactionRecord, PaginatedResponse } from '@intraverse/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function fetchSummary(): Promise<AnalyticsSummary> {
  return fetchJson<AnalyticsSummary>(`${API_URL}/api/analytics/summary`);
}

export function fetchDailyStats(from: string, to: string): Promise<{ data: DailyStats[] }> {
  return fetchJson<{ data: DailyStats[] }>(`${API_URL}/api/analytics/daily?from=${from}&to=${to}`);
}

export function fetchTransactions(limit: number, offset: number): Promise<PaginatedResponse<TransactionRecord>> {
  return fetchJson<PaginatedResponse<TransactionRecord>>(`${API_URL}/api/analytics/txs?limit=${limit}&offset=${offset}`);
}

export async function checkTxHashes(hashes: string[]): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/analytics/tx/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashes }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.found ?? [];
}
