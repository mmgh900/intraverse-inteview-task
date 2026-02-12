import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/intraverse'),
  RPC_URL: z.string().default('https://api.infra.mainnet.somnia.network/'),
  CONTRACT_ADDRESS: z.string().default('0xC82E0CE02623972330164657e8C3e568d8f351FA'),
  INDEXED_WALLET_ADDRESS: z.string().optional(),
  POLL_INTERVAL: z.coerce.number().default(5000),
  START_BLOCK: z.coerce.number().default(0),
  PORT: z.coerce.number().default(4000),
});

export const env = envSchema.parse(process.env);
