import { parseAbi } from 'viem';
import { publicClient } from '../config/chain';
import { env } from '../config/env';
import { insertTransaction } from '../db/queries/transactions';
import { broadcastEvent } from '../ws/broadcast';
import { logger } from '../utils/logger';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const contractEvents = parseAbi([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
]);

export async function processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<number> {
  const logs = await publicClient.getLogs({
    address: env.CONTRACT_ADDRESS as `0x${string}`,
    events: contractEvents,
    fromBlock,
    toBlock,
  });

  if (logs.length === 0) return 0;

  const walletFilter = env.INDEXED_WALLET_ADDRESS?.toLowerCase();

  // Collect unique block numbers to fetch timestamps
  const blockNumbers = [...new Set(logs.map((l) => l.blockNumber!))];
  const blockTimestamps = new Map<bigint, Date>();

  // Fetch block timestamps in parallel
  await Promise.all(
    blockNumbers.map(async (bn) => {
      const block = await publicClient.getBlock({ blockNumber: bn });
      blockTimestamps.set(bn, new Date(Number(block.timestamp) * 1000));
    }),
  );

  // Deduplicate by transaction hash (a single tx can emit multiple events)
  const seenTxHashes = new Set<string>();
  let indexed = 0;

  for (const log of logs) {
    if (seenTxHashes.has(log.transactionHash)) continue;

    const from = (log.args as any).from as string;
    const to = (log.args as any).to as string;

    // Determine method from event semantics
    const method = from.toLowerCase() === ZERO_ADDRESS ? 'mint' : 'upgradeTokenTo';

    // Apply optional wallet filter
    if (walletFilter) {
      const matchesFrom = from.toLowerCase() === walletFilter;
      const matchesTo = to.toLowerCase() === walletFilter;
      if (!matchesFrom && !matchesTo) continue;
    }

    seenTxHashes.add(log.transactionHash);

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
      const timestamp = blockTimestamps.get(log.blockNumber!) ?? new Date();

      await insertTransaction({
        hash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        timestamp,
        fromAddress: receipt.from,
        toAddress: receipt.to!,
        method,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      });

      indexed++;
      broadcastEvent({
        type: 'tx_indexed',
        hash: log.transactionHash,
        method,
        blockNumber: Number(log.blockNumber),
      });
      logger.debug({ hash: log.transactionHash, method }, 'Indexed transaction');
    } catch (err) {
      logger.error({ hash: log.transactionHash, err }, 'Failed to process transaction');
      throw err;
    }
  }

  return indexed;
}
