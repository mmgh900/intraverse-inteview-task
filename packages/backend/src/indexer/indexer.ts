import { publicClient } from '../config/chain';
import { env } from '../config/env';
import { getLastIndexedBlock, updateLastIndexedBlock } from '../db/queries/state';
import { processBlockRange } from './blockProcessor';
import { logger } from '../utils/logger';

const BATCH_SIZE = 2000;
const MAX_RETRIES = 3;
const CONCURRENCY = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processRangeWithRetry(from: bigint, to: bigint): Promise<number> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await processBlockRange(from, to);
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      // If range is too large, bisect and retry both halves
      if (msg.includes('range') || msg.includes('too many') || msg.includes('limit')) {
        if (to - from <= 1n) throw err;
        const mid = from + (to - from) / 2n;
        logger.warn({ from: Number(from), to: Number(to), mid: Number(mid) }, 'Range too large, bisecting');
        const a = await processRangeWithRetry(from, mid);
        const b = await processRangeWithRetry(mid + 1n, to);
        return a + b;
      }
      if (attempt === MAX_RETRIES) throw err;
      const backoff = Math.pow(2, attempt - 1) * 1000;
      logger.warn({ from: Number(from), to: Number(to), attempt, backoff }, 'Batch failed, retrying...');
      await sleep(backoff);
    }
  }
  return 0;
}

async function syncHistorical(): Promise<number> {
  let lastIndexed = await getLastIndexedBlock();
  const startBlock = Math.max(lastIndexed, env.START_BLOCK);
  const currentBlock = Number(await publicClient.getBlockNumber());

  logger.info({ startBlock, currentBlock, gap: currentBlock - startBlock }, 'Starting historical sync');

  // Build all chunk ranges
  const chunks: { from: number; to: number }[] = [];
  for (let from = startBlock + 1; from <= currentBlock; from += BATCH_SIZE) {
    const to = Math.min(from + BATCH_SIZE - 1, currentBlock);
    chunks.push({ from, to });
  }

  // Process chunks with bounded concurrency
  let totalIndexed = 0;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((chunk) => processRangeWithRetry(BigInt(chunk.from), BigInt(chunk.to))),
    );

    totalIndexed += results.reduce((sum, n) => sum + n, 0);
    const lastChunk = batch[batch.length - 1];
    await updateLastIndexedBlock(lastChunk.to);
    lastIndexed = lastChunk.to;

    logger.info(
      {
        from: batch[0].from,
        to: lastChunk.to,
        currentBlock,
        txsFound: results.reduce((sum, n) => sum + n, 0),
        progress: `${Math.round(((lastChunk.to - startBlock) / (currentBlock - startBlock)) * 100)}%`,
      },
      'Batch processed',
    );
  }

  logger.info({ totalIndexed, blocksProcessed: currentBlock - startBlock }, 'Historical sync complete');
  return lastIndexed;
}

async function pollNewBlocks(lastProcessed: number): Promise<void> {
  logger.info('Starting polling loop');

  let current = lastProcessed;

  while (true) {
    try {
      const latestBlock = Number(await publicClient.getBlockNumber());

      if (current < latestBlock) {
        const indexed = await processRangeWithRetry(BigInt(current + 1), BigInt(latestBlock));
        await updateLastIndexedBlock(latestBlock);
        if (indexed > 0) {
          logger.info({ from: current + 1, to: latestBlock, txsFound: indexed }, 'New blocks processed');
        }
        current = latestBlock;
      }
    } catch (err) {
      logger.error({ err }, 'Polling error, will retry next interval');
    }

    await sleep(env.POLL_INTERVAL);
  }
}

export async function startIndexer(): Promise<void> {
  logger.info('Indexer starting...');
  const lastProcessed = await syncHistorical();
  await pollNewBlocks(lastProcessed);
}
