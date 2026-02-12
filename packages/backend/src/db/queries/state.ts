import { eq } from 'drizzle-orm';
import { db } from '../client';
import { indexerState } from '../schema';

export async function getLastIndexedBlock(): Promise<number> {
  const rows = await db.select().from(indexerState).where(eq(indexerState.id, 1));
  if (rows.length === 0) {
    await db.insert(indexerState).values({ id: 1, lastIndexedBlock: 0 });
    return 0;
  }
  return rows[0].lastIndexedBlock;
}

export async function updateLastIndexedBlock(blockNumber: number): Promise<void> {
  await db
    .insert(indexerState)
    .values({ id: 1, lastIndexedBlock: blockNumber, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: indexerState.id,
      set: { lastIndexedBlock: blockNumber, updatedAt: new Date() },
    });
}
