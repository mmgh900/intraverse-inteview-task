import { pgTable, serial, varchar, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  hash: varchar('hash', { length: 66 }).unique().notNull(),
  blockNumber: integer('block_number').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  fromAddress: varchar('from_address', { length: 42 }).notNull(),
  toAddress: varchar('to_address', { length: 42 }).notNull(),
  method: varchar('method', { length: 50 }),
  gasUsed: varchar('gas_used', { length: 78 }).notNull(),
  effectiveGasPrice: varchar('effective_gas_price', { length: 78 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_transactions_block_number').on(table.blockNumber),
  index('idx_transactions_timestamp').on(table.timestamp),
  index('idx_transactions_method').on(table.method),
  index('idx_transactions_from_address').on(table.fromAddress),
]);

export const indexerState = pgTable('indexer_state', {
  id: integer('id').primaryKey().default(1),
  lastIndexedBlock: integer('last_indexed_block').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});
