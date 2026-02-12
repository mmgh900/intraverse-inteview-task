import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';
import { env } from './env';
import { SOMNIA_CHAIN } from '@intraverse/shared';

const somniaChain = defineChain({
  id: SOMNIA_CHAIN.id,
  name: SOMNIA_CHAIN.name,
  nativeCurrency: SOMNIA_CHAIN.nativeCurrency,
  rpcUrls: SOMNIA_CHAIN.rpcUrls,
  blockExplorers: SOMNIA_CHAIN.blockExplorers,
});

export const publicClient = createPublicClient({
  chain: somniaChain,
  transport: http(env.RPC_URL, { batch: true }),
});
