import { defineChain, type Chain } from 'viem';
import { SOMNIA_CHAIN, SOMNIA_TESTNET } from '@intraverse/shared';

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
const cfg = useTestnet ? SOMNIA_TESTNET : SOMNIA_CHAIN;

export const somniaChain: Chain = defineChain({
  id: cfg.id,
  name: cfg.name,
  nativeCurrency: cfg.nativeCurrency,
  rpcUrls: cfg.rpcUrls,
  blockExplorers: cfg.blockExplorers,
  testnet: useTestnet,
});
