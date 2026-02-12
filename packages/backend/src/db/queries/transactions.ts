import { db } from '../client';
import { transactions } from '../schema';

interface InsertTransaction {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  fromAddress: string;
  toAddress: string;
  method: string | null;
  gasUsed: string;
  effectiveGasPrice: string;
}

export async function insertTransaction(tx: InsertTransaction): Promise<void> {
  await db
    .insert(transactions)
    .values(tx)
    .onConflictDoNothing({ target: transactions.hash });
}
