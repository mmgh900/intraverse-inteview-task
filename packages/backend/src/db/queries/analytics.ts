import { sql, count, desc, inArray } from 'drizzle-orm';
import { db } from '../client';
import { transactions } from '../schema';
import type { AnalyticsSummary, DailyStats, TransactionRecord } from '@intraverse/shared';

export async function getSummary(): Promise<AnalyticsSummary> {
  const rows = await db.execute(sql`
    SELECT
      COUNT(*)::int as total_tx_count,
      COALESCE(SUM(gas_used::bigint)::text, '0') as total_gas_used,
      COALESCE(SUM(gas_used::bigint * effective_gas_price::bigint)::text, '0') as total_gas_cost,
      MIN(timestamp) as first_tx_date,
      MAX(timestamp) as last_tx_date
    FROM transactions
  `);

  const row = (rows as any[])[0];

  return {
    totalTxCount: row?.total_tx_count ?? 0,
    totalGasUsed: row?.total_gas_used ?? '0',
    totalGasCost: row?.total_gas_cost ?? '0',
    firstTxDate: row?.first_tx_date ? new Date(row.first_tx_date).toISOString() : null,
    lastTxDate: row?.last_tx_date ? new Date(row.last_tx_date).toISOString() : null,
  };
}

export async function getDailyStats(from: string, to: string): Promise<DailyStats[]> {
  const rows = await db.execute(sql`
    SELECT
      DATE(timestamp) as date,
      COUNT(*)::int as tx_count,
      COALESCE(SUM(gas_used::bigint)::text, '0') as gas_used
    FROM transactions
    WHERE DATE(timestamp) >= ${from}
      AND DATE(timestamp) <= ${to}
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp) ASC
  `);

  return (rows as any[]).map((row: any) => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
    txCount: Number(row.tx_count),
    gasUsed: String(row.gas_used),
  }));
}

export async function getTransactionsPaginated(
  limit: number,
  offset: number
): Promise<{ data: TransactionRecord[]; total: number }> {
  const [countResult, txRows] = await Promise.all([
    db.select({ count: count() }).from(transactions),
    db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.blockNumber))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countResult[0]?.count ?? 0;

  const data: TransactionRecord[] = txRows.map((tx) => ({
    hash: tx.hash,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp.toISOString(),
    from: tx.fromAddress,
    to: tx.toAddress,
    method: tx.method,
    gasUsed: tx.gasUsed,
    effectiveGasPrice: tx.effectiveGasPrice,
  }));

  return { data, total };
}

export async function checkTxHashes(hashes: string[]): Promise<string[]> {
  if (hashes.length === 0) return [];
  const rows = await db
    .select({ hash: transactions.hash })
    .from(transactions)
    .where(inArray(transactions.hash, hashes));
  return rows.map((r) => r.hash);
}
