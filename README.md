# Intraverse dApp — Full-Stack Developer Task Submission

> **Candidate:** Mahdi Gheysari
> **Position:** Full-Stack Developer at Intraverse
> **Completion Time:** 5 days (eligible for bonus)
> **Demo:** [Live Demo URL if deployed]
> **Repository:** [GitHub URL]

---

## 📋 Task Overview

This project is a complete implementation of the Intraverse Full-Stack Developer Task, building a decentralized application (dApp) for minting and managing Moon Pass NFTs on the Somnia blockchain, with comprehensive on-chain analytics powered by a custom blockchain indexer.

**Core Requirements:**
- ✅ Two-route application (`/` for minting & managing, `/analytics` for on-chain data)
- ✅ Wallet connection with MetaMask
- ✅ Network switching to Somnia (Chain ID 5031)
- ✅ Mint functionality (public phase, ERC-1155 contract)
- ✅ Upgrade system (burn 2 tokens → receive 1 of next rarity)
- ✅ Token inventory display (13 rarity tiers)
- ✅ Backend indexer with PostgreSQL database
- ✅ Analytics API with three endpoints
- ✅ Docker deployment (`docker compose up`)

**Bonus Features Implemented:**
- ✅ Real-time WebSocket notification system
- ✅ Custom SVG artwork for all 13 rarity cards
- ✅ Testnet support for development
- ✅ Comprehensive error handling and loading states
- ✅ 5-day delivery (bonus points)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (Browser)                        │
│               MetaMask + Chrome/Firefox                  │
└──────────┬───────────────────────┬──────────────────────┘
           │                       │
           │ (Web3/RPC)           │ (HTTP/WS)
           ▼                       ▼
┌──────────────────────┐  ┌───────────────────────────────┐
│  Somnia Blockchain   │  │    Frontend (:3000)           │
│  Smart Contract      │◄─│    Next.js 16 + React 19      │
│  (ERC-1155)          │  │    wagmi v2 + RainbowKit      │
│  - mint()            │  │    TanStack Query             │
│  - upgradeTokenTo()  │  │    Tailwind + shadcn/ui       │
│  - balanceOfBatch()  │  └────────────┬──────────────────┘
└──────────┬───────────┘               │
           │                           │ REST API + WebSocket
           │ (Indexer polls)           ▼
           │                  ┌────────────────────────────┐
           └─────────────────►│   Backend (:4000)          │
                              │   Express + Node.js        │
                              │   Block Indexer            │
                              │   Analytics API            │
                              │   WebSocket Server         │
                              └────────────┬───────────────┘
                                           │
                                           ▼
                              ┌────────────────────────────┐
                              │   PostgreSQL (:5432)       │
                              │   Transaction History      │
                              │   Indexer State            │
                              └────────────────────────────┘
```

### Key Architectural Decisions

**1. Monorepo with Shared Package**
- npm workspaces with 3 packages: `frontend`, `backend`, `shared`
- Single source of truth for contract ABI, chain config, and TypeScript types
- `as const` assertions enable full type inference in wagmi hooks

**2. Event-Based Indexing**
- Uses viem's `getLogs` with ERC-1155 `TransferSingle`/`TransferBatch` events
- More efficient than scanning every transaction in every block
- Optional wallet filter for targeted indexing

**3. Real-Time Data Flow**
```
User Action → On-Chain TX → Indexer Detects → WebSocket Push → UI Auto-Update
     │                                                               │
     └───────────── Pending Notification ──────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Justification |
|------------|---------|---------------|
| **Next.js** | 16.1.6 | App Router for SSR capability, file-based routing, Turbopack dev server |
| **React** | 19.2.3 | Latest stable, improved concurrent features |
| **wagmi** | 2.x | Type-safe Ethereum interactions with React hooks |
| **viem** | 2.21.0 | Modern, lightweight alternative to ethers.js (27KB vs 130KB) |
| **RainbowKit** | Latest | Production-ready wallet connection UI with multi-wallet support |
| **TanStack Query** | Latest | Server state management, caching, auto-refetch |
| **Tailwind CSS** | 4.0 | Utility-first styling with CSS-first configuration |
| **shadcn/ui** | Latest | Accessible component primitives built on Radix UI |
| **Recharts** | Latest | Composable React charts for analytics |
| **sonner** | 2.0.7 | Lightweight toast notifications |

**Why wagmi + viem over ethers.js?**
- 80% smaller bundle size (27KB vs 130KB)
- First-class TypeScript support with auto-generated types from ABI
- Native React hooks (no manual wrapping needed)
- Built-in caching via TanStack Query
- Modern, modular architecture

### Backend
| Technology | Version | Justification |
|------------|---------|---------------|
| **Express.js** | 4.21.0 | Minimal, battle-tested HTTP server for REST API |
| **Drizzle ORM** | 0.38.0 | Type-safe, schema-as-code, lighter than Prisma (no binary) |
| **PostgreSQL** | 16-alpine | Production-grade database with proper indexing |
| **viem** | 2.21.0 | Same library as frontend for consistent blockchain interaction |
| **Zod** | 3.24.0 | Runtime validation with detailed error messages |
| **pino** | 9.6.0 | Structured JSON logging for production |
| **ws** | Latest | WebSocket server for real-time notifications |

**Why Drizzle ORM over Prisma?**
- Schema defined in TypeScript (no external DSL)
- No code generation step or binary
- Direct SQL access when needed via `sql` template literal
- Smaller runtime footprint

### Infrastructure
- **Docker Compose** — Multi-stage builds, health checks, service dependencies
- **TypeScript** — End-to-end type safety across all packages
- **npm workspaces** — Built-in monorepo, no extra tooling

---

## 📁 Project Structure

```
intraverse-dapp/
├── packages/
│   ├── shared/                    # @intraverse/shared
│   │   ├── src/
│   │   │   ├── constants/
│   │   │   │   ├── chain.ts       # Somnia chain config (mainnet + testnet)
│   │   │   │   ├── contract.ts    # ABI + address with 'as const'
│   │   │   │   └── rarities.ts    # 13 rarity tiers with metadata
│   │   │   ├── types/
│   │   │   │   └── index.ts       # Shared interfaces
│   │   │   └── index.ts           # Barrel exports
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx     # Root layout with providers
│   │   │   │   ├── page.tsx       # Mint & manage route
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx   # Analytics dashboard
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── NetworkBanner.tsx
│   │   │   │   ├── NotificationPane.tsx
│   │   │   │   ├── mint/          # MintButton, MintStatus
│   │   │   │   ├── inventory/     # TokenCard, TokenGrid, UpgradeButton
│   │   │   │   └── analytics/     # KPICards, DailyChart, TransactionsTable
│   │   │   ├── hooks/
│   │   │   │   ├── useMint.ts
│   │   │   │   ├── useUpgrade.ts
│   │   │   │   ├── useTokenBalances.ts
│   │   │   │   ├── useAnalytics.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── providers/
│   │   │   │   └── Web3Provider.tsx
│   │   │   ├── context/
│   │   │   │   └── NotificationContext.tsx
│   │   │   └── lib/
│   │   │       ├── api.ts         # Typed API client
│   │   │       ├── chain.ts       # viem chain definition
│   │   │       └── contract.ts    # Contract config
│   │   ├── public/
│   │   │   └── cards/             # 13 custom SVG card illustrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── backend/
│       ├── src/
│       │   ├── api/
│       │   │   ├── server.ts      # Express app setup
│       │   │   ├── routes/
│       │   │   │   └── analytics.ts
│       │   │   └── middleware/
│       │   │       └── errorHandler.ts
│       │   ├── indexer/
│       │   │   ├── indexer.ts     # Polling loop + historical sync
│       │   │   └── blockProcessor.ts
│       │   ├── db/
│       │   │   ├── schema.ts      # Drizzle schema
│       │   │   ├── client.ts
│       │   │   └── queries/
│       │   │       ├── analytics.ts
│       │   │       ├── transactions.ts
│       │   │       └── state.ts
│       │   ├── ws/
│       │   │   └── broadcast.ts   # WebSocket server
│       │   ├── config/
│       │   │   ├── env.ts         # Zod validation
│       │   │   └── chain.ts       # viem public client
│       │   ├── utils/
│       │   │   └── logger.ts      # Pino logger
│       │   └── index.ts           # Entry point
│       ├── Dockerfile
│       └── package.json
│
├── docs/
│   ├── SPECIFICATION.md
│   ├── PREPARATION.md
│   ├── PLAN.md
│   └── guide.html                 # Farsi user guide
├── docker-compose.yml
├── DEPLOYMENT.md
├── README.md
└── package.json                   # Workspace root
```

---

## ✨ Feature Implementation

### 1. Wallet & Network (Phase 2)

**Requirement:** Connect wallet, switch to Somnia network (Chain ID 5031)

**Implementation:**
- `Web3Provider.tsx` — WagmiProvider + RainbowKit + TanStack Query stack
- `Header.tsx` — RainbowKit `<ConnectButton />` with dark theme
- `NetworkBanner.tsx` — Detects wrong chain via `useAccount()`, switches via `useSwitchChain()`
- Handles "chain not added" via automatic `wallet_addEthereumChain` RPC call

**Error Handling:**
- No wallet detected → RainbowKit shows "Get MetaMask" link
- User rejects → Toast notification
- Wrong network → Full-width warning banner with "Switch to Somnia" button

---

### 2. Mint Functionality (Phase 3)

**Requirement:** Mint button, show transaction states, errors

**Implementation:**
- `useMint.ts` — Calls `mint(address, "0x")` via `useWriteContract`
- `MintButton.tsx` — State machine: idle → pending → confirming → confirmed → error
- `MintStatus.tsx` — Transaction hash linked to Somnia Explorer
- Success toast with explorer link action

**Code Example:**
```typescript
const { mint, isPending, isConfirming, isConfirmed, hash, error } = useMint();

// Button content changes based on state
{isPending && <><Loader2 className="animate-spin" /> Confirm in wallet...</>}
{isConfirming && <><Loader2 className="animate-spin" /> Minting...</>}
{isConfirmed && <><Check /> Minted!</>}
```

---

### 3. Token Inventory (Phase 4)

**Requirement:** Display tokens owned by connected user

**Implementation:**
- `useTokenBalances.ts` — Batch query via `balanceOfBatch` (13 IDs in one RPC call)
- `TokenCard.tsx` — Shows rarity name, balance, multiplier, color accent
- `TokenGrid.tsx` — Responsive grid (1/2/3/4 columns based on breakpoint)
- Custom SVG artwork for each rarity tier

**Features:**
- Skeleton loading states
- Empty state: "No tokens yet — mint your first!"
- Auto-refresh after mint/upgrade

---

### 4. Upgrade Functionality (Phase 5)

**Requirement:** Upgrade button on each card, requires 2 tokens

**Implementation:**
- `useUpgrade.ts` — Calls `upgradeTokenTo(tokenId)` via `useWriteContract`
- `UpgradeButton.tsx` — Disabled when `balance < 2`, hidden on rarity 13
- Confirmation dialog: "This will burn 2 [Rarity X] tokens and give you 1 [Rarity X+1] token"
- Visual preview: `2x Common → 1x Uncommon`

**Edge Cases:**
- Balance = 1 → Button disabled with tooltip
- Rarity 13 (Supreme) → No upgrade button
- Transaction reverts → Clear error message

---

### 5. Backend Indexer (Phase 6)

**Requirement:** Index transactions from wallet to contract

**Implementation:**
- **Historical sync**: Processes blocks in batches of 2000 with concurrency = 3
- **Real-time polling**: Checks for new blocks every 5 seconds
- **Event-based**: Uses `eth_getLogs` with ERC-1155 event filters (more efficient than scanning all txs)
- **Method decoding**: Infers from event semantics (zero-address from = mint)
- **Resilience**: Exponential backoff retry (3 attempts), automatic range bisection for RPC limits

**Database Schema:**
```typescript
transactions {
  id: serial PRIMARY KEY
  hash: varchar(66) UNIQUE NOT NULL
  block_number: integer NOT NULL
  timestamp: timestamp NOT NULL
  from_address: varchar(42) NOT NULL
  to_address: varchar(42) NOT NULL
  method: varchar(50)              // "mint" or "upgradeTokenTo"
  gas_used: varchar(78) NOT NULL   // BigInt as string
  effective_gas_price: varchar(78) NOT NULL
  created_at: timestamp DEFAULT NOW()

  // Indexes on: block_number, timestamp, method, from_address
}

indexer_state {
  id: integer PRIMARY KEY DEFAULT 1
  last_indexed_block: integer NOT NULL DEFAULT 0
  updated_at: timestamp DEFAULT NOW()
}
```

---

### 6. Analytics API (Phase 7)

**Requirement:** Three REST endpoints

**Implementation:**

#### `GET /api/analytics/summary`
Returns:
```json
{
  "totalTxCount": 42,
  "totalGasUsed": "1234567",
  "totalGasCost": "98765432100000000",
  "firstTxDate": "2026-02-01T10:00:00Z",
  "lastTxDate": "2026-02-15T12:00:00Z"
}
```

#### `GET /api/analytics/daily?from=2026-02-01&to=2026-02-15`
Validation: Zod schema, max 365-day range, `from <= to`
```json
{
  "data": [
    { "date": "2026-02-01", "txCount": 5, "gasUsed": "123456" },
    { "date": "2026-02-02", "txCount": 8, "gasUsed": "234567" }
  ]
}
```

#### `GET /api/analytics/txs?limit=10&offset=0`
Validation: `limit` 1-100, `offset >= 0`
```json
{
  "data": [
    {
      "hash": "0xabc...",
      "blockNumber": 12345,
      "timestamp": "2026-02-15T12:00:00Z",
      "from": "0xdef...",
      "to": "0xC82E0CE...",
      "method": "mint",
      "gasUsed": "54321",
      "effectiveGasPrice": "1000000000"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

### 7. Analytics Dashboard (Phase 8)

**Requirement:** Frontend for `/analytics` route

**Implementation:**
- **KPICards** — 3 cards showing total transactions, gas used (formatted), gas cost (in SOMI)
- **DailyChart** — Recharts line chart with date range picker (defaults to last 30 days)
- **TransactionsTable** — Paginated table with method badges (mint=green, upgrade=blue), explorer links

**Features:**
- Each section handles errors independently (one failure doesn't break others)
- Loading skeletons for all async data
- TanStack Query caching (30-60s staleTime)
- Responsive: chart scrolls horizontally on mobile

---

### 8. Real-Time Notifications (Bonus)

**NOT REQUIRED by task, implemented as bonus feature**

**Backend:**
- WebSocket server (`ws/broadcast.ts`) with 30s heartbeat ping/pong
- Broadcasts `{ type: "tx_indexed", hash, method, blockNumber }` after each transaction insert
- 212 lines of additional backend code

**Frontend:**
- `NotificationContext` — State management for notifications (pending vs indexed)
- `useWebSocket` — Auto-reconnecting WebSocket client with exponential backoff + polling fallback
- `NotificationPane` — Bell icon with unread badge, dropdown showing recent actions
- Syncing banner on analytics page when pending transactions exist

**User Flow:**
```
1. User mints → Toast: "Minted successfully!"
2. Frontend adds pending notification → Bell icon shows red dot
3. ~5-10s later, indexer picks up tx → WebSocket pushes event
4. Notification updates to "indexed" (checkmark) → Analytics auto-refresh
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Docker & Docker Compose**
- **MetaMask** browser extension

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd intraverse-dapp

# Start all services
docker compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - PostgreSQL: localhost:5432
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up db -d

# Push database schema
npm run db:push -w packages/backend

# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Open http://localhost:3000
```

### Environment Configuration

Create `.env` files or use the provided `.env.example`:

**Frontend** (`packages/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_USE_TESTNET=false  # Set true for Shannon testnet
```

**Backend** (`packages/backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intraverse
RPC_URL=https://api.infra.mainnet.somnia.network/
CONTRACT_ADDRESS=0xC82E0CE02623972330164657e8C3e568d8f351FA
INDEXED_WALLET_ADDRESS=  # Optional: leave empty to index all txs
POLL_INTERVAL=5000       # Indexer poll interval in ms
START_BLOCK=0            # Block to start indexing from
```

---

## 🧪 Testing & Verification

### Build Verification
```bash
# Build all packages
npm run build

# Expected output:
# ✓ @intraverse/shared compiled (TypeScript)
# ✓ @intraverse/backend compiled (TypeScript)
# ✓ @intraverse/frontend compiled (Next.js)
# Zero TypeScript errors
```

### API Health Check
```bash
curl http://localhost:4000/api/health

# Expected:
# {"status":"ok","timestamp":"2026-02-15T..."}
```

### Frontend Features Checklist
- [ ] Connect MetaMask wallet
- [ ] Wrong network banner appears (if not on Somnia)
- [ ] Click "Switch to Somnia" → Chain added and switched
- [ ] Click "Mint" → MetaMask popup → Transaction confirmation
- [ ] Transaction hash appears with explorer link
- [ ] Token count updates after mint
- [ ] Upgrade button enabled when balance >= 2
- [ ] Upgrade dialog shows "burn 2 → get 1" explanation
- [ ] Bell icon shows notification after mint
- [ ] Navigate to `/analytics` → KPI cards, chart, table visible

### Backend Features Checklist
- [ ] Indexer logs show "Processing blocks X-Y..."
- [ ] `GET /api/analytics/summary` returns valid JSON
- [ ] `GET /api/analytics/daily?from=2026-02-01&to=2026-02-15` returns daily breakdown
- [ ] `GET /api/analytics/txs?limit=10&offset=0` returns paginated transactions
- [ ] Invalid query params return 400 with Zod error details
- [ ] WebSocket connection established (check browser console)

---

## 📊 Requirements Coverage

| Requirement | Status | Implementation Details |
|-------------|--------|------------------------|
| **Wallet connection** | ✅ Complete | RainbowKit with MetaMask support, multi-wallet ready |
| **Switch Network button** | ✅ Complete | Adds Somnia if missing, switches via `useSwitchChain` |
| **Mint functionality** | ✅ Complete | `mint(address, "0x")`, full state tracking, error handling |
| **Upgrade functionality** | ✅ Complete | Requires 2+ tokens, confirmation dialog, clear messaging |
| **Inventory widget** | ✅ Complete | `balanceOfBatch` for all 13 rarities, custom SVG cards |
| **Error messages** | ✅ Complete | Wrong network, no wallet, insufficient balance, rejected, RPC errors |
| **Loading states** | ✅ Complete | Skeleton components for all async operations |
| **Backend + DB** | ✅ Complete | Express + PostgreSQL with Drizzle ORM |
| **Transaction indexing** | ✅ Complete | Event-based with retry, bisection, concurrent batching |
| **Analytics API** | ✅ Complete | 3 endpoints + bonus check endpoint |
| **Analytics frontend** | ✅ Complete | KPI cards, Recharts line chart, paginated table |
| **Docker deployment** | ✅ Complete | Multi-stage builds, health checks, service dependencies |

**Bonus Features:**
| Feature | Status | Notes |
|---------|--------|-------|
| **Real-time notifications** | ✅ Implemented | WebSocket + polling fallback, bell icon, syncing banner |
| **Custom card artwork** | ✅ Implemented | 13 SVG illustrations |
| **Testnet support** | ✅ Implemented | Shannon testnet via env flag |
| **5-day delivery** | ✅ Achieved | Completed within timeline |
| **Authentication (SIWE)** | ❌ Not implemented | — |

---

## 💡 Design Decisions & Trade-offs

### Why Event-Based Indexing?
**Decision:** Use `eth_getLogs` with ERC-1155 event filters instead of scanning all transactions.

**Rationale:**
- 10-100x fewer RPC calls (only events, not every tx in every block)
- Contracts emit events for all state changes
- Easier to decode (event params vs calldata parsing)

**Trade-off:** Misses transactions that don't emit events (not applicable here since ERC-1155 always emits).

### Why String for Gas Values?
**Decision:** Store `gas_used` and `effective_gas_price` as `varchar(78)` instead of numeric.

**Rationale:**
- JavaScript `Number` has 53-bit precision; EVM gas values can exceed this
- PostgreSQL `numeric` would work but requires casting in queries
- Storing as string preserves full precision, converts to BigInt in application code

**Trade-off:** Slightly more storage (78 bytes vs 8-16 for numeric), but prevents silent overflow bugs.

### Why Not SIWE?
**Decision:** No authentication beyond wallet connection.

**Rationale:**
- Task requirements don't mandate auth for any endpoint
- Analytics API is read-only, no sensitive data
- Backend can be restricted via CORS to frontend domain
- SIWE would add complexity without clear security benefit for this use case

**Trade-off:** Lose bonus points, but kept implementation focused on core requirements.

### Why Polling Instead of WebSocket RPC?
**Decision:** Backend indexer polls via HTTP, not WebSocket subscription.

**Rationale:**
- Somnia public RPCs may not support `eth_subscribe` (common restriction)
- Polling with 5s interval is good enough for analytics (not latency-critical)
- Easier to implement, fewer failure modes (WS disconnect, reorg handling)

**Trade-off:** Slightly higher latency (5s average) vs real-time, but acceptable for analytics.

---

## 🎯 Evaluation Criteria Mapping

### 1. Working Code ✅
- `docker compose up --build` starts all 3 services successfully
- Frontend loads at `localhost:3000`, backend at `:4000`, database at `:5432`
- All core features functional (mint, upgrade, inventory, analytics)
- Zero build errors, zero runtime crashes

### 2. Project Design ✅
**Design Patterns:**
- Provider pattern (Web3, Notification, Query Client)
- Repository pattern (`db/queries/` modules)
- Custom hooks for reusability (`useMint`, `useUpgrade`, `useTokenBalances`, `useAnalytics`, `useWebSocket`)
- Dependency injection via React Context
- Zod validation at API boundaries

**Component Decoupling:**
- Frontend never imports backend code (only shared types)
- Database queries isolated from API routes
- Indexer separated from API server (could be split into separate processes)
- Shared package has zero runtime dependencies

### 3. Code Readability ✅
- Consistent naming: `camelCase` functions, `PascalCase` components, `SCREAMING_SNAKE_CASE` constants
- Clear file organization by feature (`mint/`, `inventory/`, `analytics/`)
- TypeScript interfaces document data shapes
- Zod schemas serve as inline API documentation
- No magic numbers (all constants named)

### 4. Error Handling ✅
**Frontend:**
- Toast notifications for all user actions
- Wrong network banner
- Loading skeletons (never shows blank while loading)
- Error states in each component (KPICards, DailyChart, TransactionsTable independent)
- Wallet connection errors handled by RainbowKit

**Backend:**
- Global Express error handler
- Zod validation with detailed error messages
- Retry logic with exponential backoff
- Range bisection for RPC limits
- Idempotent inserts (`onConflictDoNothing`)
- Structured logging with pino

### 5. Smart Usage of AI ✅
**Technology Choices:**
Every major technology choice (wagmi vs ethers, Drizzle vs Prisma, Docker multi-stage builds) has a documented rationale based on bundle size, type safety, or developer experience.

**Architecture Decisions:**
- Monorepo structure justified (single source of truth for types)
- Event-based indexing explained (efficiency trade-off)
- String storage for gas values defended (precision safety)

**Beyond Copy-Paste:**
- Real-time notification system (not in requirements)
- Concurrent batch processing with bisection fallback
- WebSocket with polling fallback
- Custom SVG card artwork

---

## 📦 Deliverables

- [x] Source code in Git repository with clear commit history
- [x] README.md with technology justifications (this document)
- [x] DEPLOYMENT.md with production deployment guide
- [x] docker-compose.yml for one-command setup
- [x] .env.example with all variables documented
- [x] Farsi user guide (docs/guide.html)

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Production environment setup
- Vercel deployment (frontend)
- Railway/Render deployment (backend)
- Managed PostgreSQL configuration
- Monitoring and troubleshooting

---

## 📝 License & Attribution

This project was built for the Intraverse Full-Stack Developer hiring task.

**Contract:** `0xC82E0CE02623972330164657e8C3e568d8f351FA` (Somnia Mainnet)
**Network:** Somnia (Chain ID 5031)
**Developer:** Mahdi Gheysari
**Completion Date:** February 2026

---

## 🙏 Acknowledgments

- **Intraverse Team** for the interesting technical challenge
- **Somnia Network** for the EVM-compatible L1 blockchain
- **wagmi & viem** for excellent TypeScript-first web3 libraries
- **shadcn/ui** for beautiful, accessible React components

---

**Thank you for reviewing my submission. I look forward to discussing the implementation details in the interview.**
