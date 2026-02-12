# Intraverse dApp - Implementation Plan

> Each phase produces a working, testable output that the next phase builds on.
> Phases are sequential — do not skip ahead.

---

## Phase 1: Project Scaffolding & Infrastructure

**Goal:** A skeleton monorepo that boots via `docker-compose up` with an empty frontend, empty backend, and a running PostgreSQL database.

### Steps

1. **Initialize the monorepo root**
   - Create root `package.json` (private, workspaces: `packages/*`)
   - Create `.gitignore`, `.env.example`, `tsconfig.base.json`
   - `git init` + initial commit

2. **Scaffold the shared package** (`packages/shared`)
   - `package.json`, `tsconfig.json` extending base
   - `src/constants/chain.ts` — Somnia chain definition (id: 5031, rpc, explorer, currency)
   - `src/constants/contract.ts` — Contract address + ABI (fetch from Somnia Explorer or hardcode minimal)
   - `src/types/index.ts` — Shared TypeScript interfaces (`TransactionRecord`, `AnalyticsSummary`, `DailyStats`, `PaginatedResponse`)

3. **Scaffold the frontend** (`packages/frontend`)
   - `npx create-next-app@latest` with App Router, TypeScript, Tailwind
   - Install `shadcn/ui` init + base components (Button, Card, Skeleton, Toast via sonner)
   - Create placeholder `app/page.tsx` ("Mint & Manage — coming soon")
   - Create placeholder `app/analytics/page.tsx` ("Analytics — coming soon")
   - Create `app/layout.tsx` with a `<nav>` linking both routes

4. **Scaffold the backend** (`packages/backend`)
   - `package.json` with express, drizzle-orm, postgres (pg driver), viem, zod, pino, cors, helmet
   - `tsconfig.json`, `drizzle.config.ts`
   - `src/index.ts` — boots Express on `PORT`, logs "Server running"
   - `src/api/server.ts` — Express app with cors, helmet, JSON parser, health route
   - `GET /api/health` returns `{ status: "ok" }`

5. **Database schema & migrations**
   - `src/db/schema.ts` — Drizzle schema for `transactions` table and `indexer_state` table (as per SPECIFICATION.md Section 6)
   - `src/db/client.ts` — create Drizzle client from `DATABASE_URL`
   - Generate + apply initial migration via `drizzle-kit`
   - Seed `indexer_state` with `{ id: 1, last_indexed_block: 0 }`

6. **Docker Compose**
   - `packages/frontend/Dockerfile` — multi-stage (build → standalone Next.js)
   - `packages/backend/Dockerfile` — multi-stage (build → node dist)
   - Root `docker-compose.yml` with three services: `frontend` (port 3000), `backend` (port 4000), `db` (PostgreSQL, port 5432)
   - `db-data` volume for persistence
   - Health checks on all services

### Exit Criteria
- `docker-compose up` starts all three services without errors
- `http://localhost:3000` shows the placeholder Next.js app with nav
- `http://localhost:4000/api/health` returns `{ status: "ok" }`
- PostgreSQL has the `transactions` and `indexer_state` tables

---

## Phase 2: Wallet Connection & Network Switching

**Goal:** Users can connect MetaMask, see their address, and switch to Somnia network.

**Depends on:** Phase 1 (frontend scaffold, shared chain config)

### Steps

1. **Install Web3 dependencies**
   - `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `@tanstack/react-query`

2. **Create the Web3 provider** (`src/providers/Web3Provider.tsx`)
   - Configure wagmi with Somnia as a custom chain (import from shared)
   - Wrap in `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider`
   - Add `"use client"` directive

3. **Wire provider into layout**
   - Import `Web3Provider` in `app/layout.tsx`, wrap `{children}`

4. **Build `Header` component** with wallet connection
   - RainbowKit `<ConnectButton />` in the header
   - Show truncated address when connected
   - Show chain name / wrong-chain indicator

5. **Build `NetworkSwitcher` component**
   - Only visible when connected to wrong chain
   - Calls `useSwitchChain` from wagmi
   - If chain not found, calls `wallet_addEthereumChain` with Somnia params
   - Shows success toast or error toast

6. **Error states**
   - No wallet detected → prompt to install MetaMask
   - User rejects connection → toast message
   - Wrong network banner at top of page

### Exit Criteria
- Clicking "Connect Wallet" opens RainbowKit modal
- After connecting, header shows truncated address
- If on wrong chain, "Switch to Somnia" banner appears
- Clicking switch adds/switches to Somnia (chain 5031)
- All error cases show clear toasts

---

## Phase 3: Mint Functionality

**Goal:** Users can mint a Rarity 1 token and see the transaction status.

**Depends on:** Phase 2 (wallet connected, correct network)

### Steps

1. **Create contract config** (`src/lib/contract.ts`)
   - Import ABI from shared package
   - Export typed contract config object: `{ address, abi }`

2. **Create `useMint` hook** (`src/hooks/useMint.ts`)
   - Uses wagmi `useWriteContract` to call `mint(connectedAddress, "0x")`
   - Uses `useWaitForTransactionReceipt` to track confirmation
   - Returns `{ mint, isPending, isConfirming, isConfirmed, hash, error }`

3. **Build `MintButton` component** (`src/components/mint/MintButton.tsx`)
   - Disabled if wallet not connected or wrong network
   - On click: calls `mint()` from hook
   - States:
     - Idle → "Mint"
     - Pending → spinner + "Confirm in wallet..."
     - Confirming → spinner + "Minting..." + tx hash link
     - Confirmed → checkmark + "Minted!" + tx hash link
     - Error → error message + "Try again"
   - Toast on success/error

4. **Build `MintStatus` component**
   - Shows tx hash linked to Somnia Explorer
   - Shows pending/confirmed badge

5. **Wire into home page** (`app/page.tsx`)
   - Layout: Collection name header + MintButton on the right (matching wireframe)
   - Conditionally render based on wallet/network state

### Exit Criteria
- Connected user clicks "Mint" → MetaMask tx popup
- After signing → tx hash appears with explorer link
- After confirmation → success toast, status updates
- If user rejects → error toast, button resets
- If tx reverts → error message shown

---

## Phase 4: Token Inventory & Cards

**Goal:** Display 12 token cards with rarity name, balance, and visual representation.

**Depends on:** Phase 3 (contract config, minting works, user has tokens)

### Steps

1. **Create `useTokenBalances` hook** (`src/hooks/useTokenBalances.ts`)
   - Uses wagmi `useReadContract` to call `balanceOfBatch`
   - Passes `accounts = [address x 13]`, `ids = [1, 2, ..., 13]` (13 rarity levels)
   - Returns `{ balances: Record<number, bigint>, isLoading, error, refetch }`
   - Auto-refetches when account changes or after mint/upgrade

2. **Create rarity metadata** (`packages/shared/src/constants/rarities.ts`)
   - Array of 13 objects: `{ id, name, multiplier, color }` per rarity level
   - Names/multipliers from the PREPARATION doc rarity table

3. **Build `TokenCard` component** (`src/components/inventory/TokenCard.tsx`)
   - Props: `{ rarityId, name, balance, multiplier, color }`
   - Shows rarity name and level number
   - Shows balance count
   - Shows multiplier badge
   - Visual distinction per rarity (color-coded border or background)
   - Skeleton state while loading

4. **Build `TokenGrid` component** (`src/components/inventory/TokenGrid.tsx`)
   - Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
   - Maps over 13 rarities, renders a `TokenCard` for each
   - Shows "No tokens yet — mint your first!" empty state

5. **Build `TokenInventory` summary** (`src/components/inventory/TokenInventory.tsx`)
   - Shows total token count (sum of all balances)
   - Small badge/chip above the grid

6. **Wire into home page**
   - Below the mint section: TokenInventory summary + TokenGrid
   - Auto-refresh balances after successful mint

### Exit Criteria
- 13 token cards displayed in a responsive grid
- Each card shows rarity name, balance, and multiplier
- Balances update after minting
- Loading skeletons shown while fetching
- Empty state when no tokens owned

---

## Phase 5: Upgrade Functionality

**Goal:** Users can upgrade tokens by burning 2 of the same rarity.

**Depends on:** Phase 4 (token balances displayed on cards)

### Steps

1. **Create `useUpgrade` hook** (`src/hooks/useUpgrade.ts`)
   - Uses wagmi `useWriteContract` to call `upgradeTokenTo(tokenId)`
   - Uses `useWaitForTransactionReceipt` for confirmation
   - Returns `{ upgrade, isPending, isConfirming, isConfirmed, hash, error }`

2. **Add upgrade button to `TokenCard`**
   - "Upgrade to next rarity" button at bottom of each card
   - **Disabled** when `balance < 2`
   - **Hidden** on rarity 13 (max, cannot upgrade)
   - Tooltip/text: "Requires 2 tokens of this rarity"

3. **Upgrade confirmation flow**
   - On click: show confirmation (optionally a small dialog)
   - Explain: "This will burn 2 Rarity X tokens and give you 1 Rarity X+1 token"
   - Confirm → call `upgrade(tokenId)`
   - Same pending/confirming/confirmed/error states as mint

4. **Post-upgrade balance refresh**
   - After confirmed upgrade, refetch `balanceOfBatch`
   - The burned rarity should show -2, the next rarity +1

5. **Edge cases**
   - User tries to upgrade rarity 13 → button not shown
   - User has exactly 1 token → button disabled with explanation
   - Transaction reverts → clear error message

### Exit Criteria
- Upgrade button is disabled when balance < 2, enabled when >= 2
- Clear explanation of "burn 2, get 1 next rarity" shown
- Clicking upgrade → MetaMask tx → confirmation → balances update
- Rarity 13 has no upgrade option
- Error states handled gracefully

---

## Phase 6: Backend Indexer

**Goal:** A background service that indexes on-chain transactions to the contract and stores them in PostgreSQL.

**Depends on:** Phase 1 (backend scaffold, database schema, shared contract config)

### Steps

1. **Create viem client** (`src/config/chain.ts`)
   - Public client for Somnia using `createPublicClient` + HTTP transport
   - Configure with RPC URL from env (+ fallback URLs)

2. **Create environment config** (`src/config/env.ts`)
   - Validate env vars with zod: `RPC_URL`, `CONTRACT_ADDRESS`, `INDEXED_WALLET_ADDRESS`, `POLL_INTERVAL`, `START_BLOCK`, `DATABASE_URL`
   - Fail fast with clear message if required vars missing

3. **Create method decoder** (`src/utils/decoder.ts`)
   - Map of 4-byte selectors → method names
   - Compute selectors from ABI: `mint(address,bytes)` → selector, `upgradeTokenTo(uint256)` → selector
   - `decodeMethod(calldata: string): string` — returns method name or "unknown"

4. **Create indexer state queries** (`src/db/queries/state.ts`)
   - `getLastIndexedBlock(): Promise<number>`
   - `updateLastIndexedBlock(blockNumber: number): Promise<void>`

5. **Create transaction queries** (`src/db/queries/transactions.ts`)
   - `insertTransaction(tx: TransactionRecord): Promise<void>` — upsert on hash
   - `getTransactions(limit, offset): Promise<{ data, total }>`

6. **Build block processor** (`src/indexer/blockProcessor.ts`)
   - Given a block range `[from, to]`:
     - Use `eth_getLogs` or fetch blocks with transactions
     - Filter where `tx.to === CONTRACT_ADDRESS` AND `tx.from === INDEXED_WALLET_ADDRESS`
     - For each match: fetch receipt (gasUsed, effectiveGasPrice), decode method
     - Insert into database
   - Process in batches (configurable batch size, e.g., 100 blocks)
   - Log progress

7. **Build indexer loop** (`src/indexer/indexer.ts`)
   - On start: read last indexed block from DB
   - If behind current block: run initial sync (batch process historical blocks)
   - Enter polling loop: every `POLL_INTERVAL` ms, check for new blocks, process them
   - Wrap each cycle in try/catch — log errors, do not advance state on failure
   - Retry RPC failures with exponential backoff (max 3 retries)

8. **Start indexer from `src/index.ts`**
   - After Express server starts, launch indexer in background
   - Log "Indexer started, last block: X, current block: Y"

### Exit Criteria
- Backend starts and indexer begins polling
- Historical transactions (from configured wallet to contract) are indexed
- New transactions are picked up within `POLL_INTERVAL` seconds
- Database contains: hash, blockNumber, timestamp, from, to, method, gasUsed, effectiveGasPrice
- Indexer survives RPC failures and resumes correctly
- Logs show clear progress during sync

---

## Phase 7: Analytics API Endpoints

**Goal:** Three REST endpoints serving analytics data from the indexed transactions.

**Depends on:** Phase 6 (indexer is populating the database)

### Steps

1. **Create analytics query functions** (`src/db/queries/analytics.ts`)
   - `getSummary()` → `{ totalTxCount, totalGasUsed, totalGasCost, firstTxDate, lastTxDate }`
     - SQL: COUNT, SUM(gas_used), MIN/MAX(timestamp)
     - Gas cost: compute `SUM(gas_used * effective_gas_price)` as BigInt in application code
   - `getDailyStats(from: string, to: string)` → `[{ date, txCount, gasUsed }]`
     - SQL: GROUP BY DATE(timestamp), WHERE between dates
   - `getTransactions(limit: number, offset: number)` → `{ data: TransactionRecord[], total: number }`
     - SQL: ORDER BY block_number DESC, LIMIT, OFFSET + COUNT(*)

2. **Create analytics routes** (`src/api/routes/analytics.ts`)
   - `GET /api/analytics/summary` → calls `getSummary()`, returns JSON
   - `GET /api/analytics/daily?from=&to=` → validates date params with zod, calls `getDailyStats()`, returns JSON
   - `GET /api/analytics/txs?limit=&offset=` → validates pagination params with zod, calls `getTransactions()`, returns JSON

3. **Input validation middleware**
   - Validate `from`/`to` are valid YYYY-MM-DD, `from <= to`, max 365 day range
   - Validate `limit` is 1-100, `offset` >= 0
   - Return 400 with clear error message on invalid input

4. **Error handling middleware** (`src/api/middleware/errorHandler.ts`)
   - Catch-all error handler
   - Log full error (pino), return sanitized JSON error response
   - 500 for unexpected errors, 400 for validation errors

5. **Wire routes into Express app**
   - Mount `/api/analytics` router in `server.ts`

### Exit Criteria
- `GET /api/analytics/summary` returns correct aggregate stats
- `GET /api/analytics/daily?from=2026-01-01&to=2026-02-11` returns daily breakdown
- `GET /api/analytics/txs?limit=10&offset=0` returns paginated transactions with decoded method names
- Invalid inputs return 400 with clear messages
- Server errors return 500 with generic message (no stack traces leaked)

---

## Phase 8: Analytics Frontend

**Goal:** The `/analytics` route displays KPI cards, a line chart, and a transactions table.

**Depends on:** Phase 7 (API endpoints returning data)

### Steps

1. **Create API client** (`src/lib/api.ts`)
   - Typed fetch wrapper for each endpoint
   - `fetchSummary()`, `fetchDailyStats(from, to)`, `fetchTransactions(limit, offset)`
   - Base URL from `NEXT_PUBLIC_API_URL` env var

2. **Create `useAnalytics` hooks** (`src/hooks/useAnalytics.ts`)
   - `useSummary()` — TanStack Query wrapper around `fetchSummary()`
   - `useDailyStats(from, to)` — TanStack Query, re-fetches on date change
   - `useTransactions(limit, offset)` — TanStack Query, re-fetches on pagination change

3. **Build `KPICards` component** (`src/components/analytics/KPICards.tsx`)
   - Three cards in a row: Total Transactions, Total Gas Used (formatted), Total Gas Cost (formatted in native currency)
   - First/last tx date shown as subtitle
   - Skeleton state while loading

4. **Build `DailyChart` component** (`src/components/analytics/DailyChart.tsx`)
   - Install `recharts`
   - `<ResponsiveContainer>` → `<LineChart>` with `<Line>` for tx count
   - X-axis: dates, Y-axis: count
   - Date range picker (two date inputs) above chart, defaults to last 30 days
   - Skeleton state while loading

5. **Build `TransactionsTable` component** (`src/components/analytics/TransactionsTable.tsx`)
   - Columns: Tx Hash (linked to `explorer/tx/{hash}`), Method, Date, Gas Used
   - Method column: color-coded badge ("mint" = green, "upgradeTokenTo" = blue, "unknown" = gray)
   - Pagination controls: Previous / Next buttons + "Showing X-Y of Z"
   - Skeleton rows while loading

6. **Assemble analytics page** (`app/analytics/page.tsx`)
   - Stack vertically: KPICards → DailyChart → TransactionsTable
   - Error states for each section independently (one section failing doesn't break others)

### Exit Criteria
- KPI cards show correct summary numbers
- Line chart displays daily tx count for selected date range
- Table shows transactions with explorer links and decoded methods
- Pagination works (next/prev)
- All sections show loading skeletons, then data
- Error states shown if API is unreachable

---

## Phase 9: UX Polish & Error Handling

**Goal:** Comprehensive error handling, loading states, and visual polish across all routes.

**Depends on:** Phase 8 (all features functional)

### Steps

1. **Global error boundary**
   - Wrap app in `ErrorBoundary` component
   - Fallback UI: "Something went wrong" + "Reload" button

2. **Toast notification system**
   - Install `sonner` if not already
   - Success toasts for: mint confirmed, upgrade confirmed, network switched
   - Error toasts for: tx rejected, tx reverted, RPC error, API error
   - Info toasts for: wallet disconnected, network changed

3. **Loading skeletons audit**
   - Verify every async operation has a skeleton/spinner
   - Token cards: card-shaped skeletons
   - KPI cards: number-shaped skeletons
   - Chart: chart-shaped skeleton
   - Table: row-shaped skeletons

4. **Wrong-network guard**
   - If wallet is connected but wrong chain → full-page overlay on `/` route
   - "Please switch to Somnia to continue" + Switch Network button
   - `/analytics` works regardless (it reads from backend, not wallet)

5. **No-wallet guard**
   - Mint page shows clear CTA to connect wallet
   - Analytics page works without wallet

6. **Responsive design pass**
   - Mobile: single column, stacked cards, hamburger nav
   - Tablet: 2 columns for cards
   - Desktop: 3-4 columns for cards, full nav bar
   - Chart and table scroll horizontally on small screens

7. **Accessibility pass**
   - All buttons have aria-labels
   - Focus indicators visible
   - Color contrast check (WCAG AA)
   - Transaction status announced via aria-live

### Exit Criteria
- No unhandled errors visible to user
- Every async action has loading → success/error flow
- App is usable on mobile, tablet, and desktop
- Keyboard-navigable
- Toasts provide clear, actionable feedback

---

## Phase 10: Authentication (Bonus)

**Goal:** SIWE (Sign-In with Ethereum) for optional wallet-based auth.

**Depends on:** Phase 9 (polished app)

### Steps

1. **Backend auth endpoints**
   - `GET /api/auth/nonce` — generate and return a random nonce (store in memory/DB with expiry)
   - `POST /api/auth/verify` — accept SIWE message + signature, verify, issue JWT
   - Install `siwe`, `jsonwebtoken`

2. **Auth middleware**
   - `authenticateToken` middleware: verify JWT from `Authorization: Bearer` header
   - Optionally protect analytics endpoints (or make auth optional/additive)

3. **Frontend auth flow**
   - After wallet connect → auto-prompt SIWE sign
   - Store JWT in memory (not localStorage for security)
   - Pass JWT in API requests via Authorization header
   - Show "Signed in" indicator

4. **Session management**
   - JWT expiry: 24h
   - On expiry: prompt re-sign
   - On wallet disconnect: clear JWT

### Exit Criteria
- User signs SIWE message after connecting wallet
- JWT is used for API requests
- Session persists across page refreshes (within expiry)
- Graceful handling of expired/invalid tokens

---

## Phase 11: Testing & Documentation

**Goal:** Tests pass, README is complete, Docker runs cleanly.

**Depends on:** Phase 9 (or Phase 10 if bonus was implemented)

### Steps

1. **Unit tests**
   - Test method decoder: known selectors → correct names, unknown → "unknown"
   - Test gas cost calculation (BigInt math)
   - Test date validation/formatting utilities
   - Test pagination offset calculation

2. **Integration tests (backend)**
   - Seed test database with sample transactions
   - Test `GET /api/analytics/summary` returns correct aggregates
   - Test `GET /api/analytics/daily` with date range filtering
   - Test `GET /api/analytics/txs` pagination (limit, offset, total)
   - Test validation: invalid dates → 400, invalid limit → 400

3. **Component tests (frontend, optional)**
   - Test MintButton disabled states (no wallet, wrong chain)
   - Test TokenCard displays balance, disables upgrade when < 2
   - Test KPICards renders skeleton then data

4. **Docker clean-run test**
   - Delete all containers/volumes
   - `docker-compose up --build`
   - Verify all services start and communicate
   - Verify indexer begins processing blocks

5. **Write README.md**
   - Project overview
   - Technology choices with justifications
   - Quick start: `docker-compose up` (or local dev setup)
   - Environment variables reference
   - Architecture overview (link to SPECIFICATION.md)
   - Screenshots of both routes

6. **Code cleanup**
   - Run ESLint + Prettier across all packages
   - Remove unused imports, dead code, console.logs
   - Verify TypeScript strict mode passes with no errors

### Exit Criteria
- All unit and integration tests pass
- `docker-compose up --build` from clean state works
- README provides clear, complete setup instructions
- No linting errors
- Code compiles with zero TypeScript errors

---

## Phase 12: Final Review & Submission

**Goal:** Verify everything works end-to-end, commit history is clean, submit.

**Depends on:** Phase 11

### Steps

1. **End-to-end walkthrough**
   - Fresh `docker-compose up`
   - Connect wallet → switch to Somnia → mint token → see inventory update
   - Upgrade tokens (if balance permits) → see balances change
   - Navigate to `/analytics` → see KPI cards, chart, table
   - Change date range → chart updates
   - Paginate table → data loads

2. **Commit history review**
   - Ensure commits are logical, atomic, and well-messaged
   - Squash any "fix typo" commits if needed
   - Verify no secrets/env files committed

3. **Final checks**
   - `.env.example` has all variables documented
   - `.gitignore` excludes `node_modules`, `.env`, `dist`, `.next`, `db-data`
   - No hardcoded secrets in source code
   - Docker images build without network issues

4. **Submit**
   - Push to GitHub (or zip the repo with `.git` included for commit history)

### Exit Criteria
- Full E2E flow works without errors
- Commit history tells a clear development story
- Repository is clean, documented, and ready for review

---

## Summary: Phase Dependencies

```
Phase 1:  Scaffolding & Infrastructure
    |
    +---> Phase 2: Wallet & Network
    |         |
    |         +---> Phase 3: Mint
    |                   |
    |                   +---> Phase 4: Inventory & Cards
    |                             |
    |                             +---> Phase 5: Upgrade
    |
    +---> Phase 6: Backend Indexer  (can run in parallel with Phases 2-5)
              |
              +---> Phase 7: Analytics API
                        |
                        +---> Phase 8: Analytics Frontend
                                  |
                                  +--- Phase 9: UX Polish (merges frontend + backend work)
                                          |
                                          +---> Phase 10: Auth (Bonus, optional)
                                          |
                                          +---> Phase 11: Testing & Docs
                                                    |
                                                    +---> Phase 12: Final Review & Submit
```

**Parallelism opportunity:** Phases 2-5 (frontend/web3) and Phase 6 (backend indexer) have no dependencies on each other. They can be developed in parallel by splitting frontend and backend work across sessions, then converging at Phase 8 when the analytics frontend needs the API.

---

*Total estimated phases: 12*
*Critical path: 1 → 2 → 3 → 4 → 5 → 9 → 11 → 12 (frontend) or 1 → 6 → 7 → 8 → 9 → 11 → 12 (backend)*
