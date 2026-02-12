# Intraverse FullStack Developer Task -- Preparation Document

> **Author:** Mahdi Gheysari
> **Date:** 2026-02-11
> **Contract:** `0xC82E0CE02623972330164657e8C3e568d8f351FA`
> **Network:** Somnia Mainnet (Chain ID 5031)

---

## Table of Contents

1. [Task Summary](#1-task-summary)
2. [Smart Contract Analysis](#2-smart-contract-analysis)
3. [Technology Stack Recommendations](#3-technology-stack-recommendations)
4. [Project Structure](#4-project-structure)
5. [Key Research Items](#5-key-research-items)
6. [Risk Assessment & Challenges](#6-risk-assessment--challenges)
7. [Development Timeline](#7-development-timeline)
8. [Evaluation Criteria Mapping](#8-evaluation-criteria-mapping)

---

## 1. Task Summary

### What We Are Building

A full-stack decentralized application (dApp) with **two routes**:

| Route | Purpose |
|-------|---------|
| `/` | **Mint & Manage Tokens** -- Connect wallet, mint Moon Pass NFTs, view inventory, and upgrade tokens by burning 2 cards of the same rarity to produce 1 card of the next rarity. |
| `/analytics` | **On-Chain Analytics** -- A backend indexer continuously polls/listens to on-chain events, stores them in a database, and serves analytics data (total mints over time, upgrade counts, rarity distribution) via API endpoints, rendered as charts. |

### Core User Flows

1. **Mint Flow:** User connects wallet -> clicks "Mint" -> signs transaction -> receives Rarity 1 Moon Pass NFT.
2. **Upgrade Flow:** User selects 2 tokens of the same rarity -> clicks "Upgrade" -> burns both -> receives 1 token of the next rarity.
3. **Analytics Flow:** User navigates to `/analytics` -> sees line chart of mints over time, bar chart of rarity distribution, and aggregate stats (total mints, total upgrades, unique holders).

### Deliverables

- Dockerized full-stack application (frontend + backend + database) via `docker-compose up`
- Clear README with setup instructions
- Source code in a GitHub repository
- Bonus: Deployed demo (if time permits)

---

## 2. Smart Contract Analysis

### Contract Identity

| Field | Value |
|-------|-------|
| **Address** | `0xC82E0CE02623972330164657e8C3e568d8f351FA` |
| **Name** | `IntraverseProtocolDirect` |
| **Standard** | ERC-1155 (multi-token, confirmed by `balanceOf(address,uint256)` and `safeBatchTransferFrom`) |
| **Network** | Somnia Mainnet (Chain ID 5031) |
| **Verified** | Yes (ABI available via Somnia Explorer API) |

### ABI Retrieval

The ABI can be fetched programmatically from the Somnia block explorer:

```
GET https://explorer.somnia.network/api?module=contract&action=getabi&address=0xC82E0CE02623972330164657e8C3e568d8f351FA
```

### Key Read Functions

| Function | Parameters | Returns | Purpose |
|----------|-----------|---------|---------|
| `balanceOf` | `account (address), id (uint256)` | `uint256` | Get token balance for specific rarity |
| `balanceOfBatch` | `accounts (address[]), ids (uint256[])` | `uint256[]` | Batch balance query across multiple rarities |
| `currentPhase` | None | `Phase` | Current minting phase (Whitelist/Public/Closed) |
| `getConfig` | None | `Config` | Contract configuration (max supply, mint limits, etc.) |
| `mintCount` | `address` | `uint256` | Number of times an address has minted |
| `mintGlobalCount` | None | `uint256` | Total global mint count |
| `totalSupply` | `id (uint256)` (optional) | `uint256` | Total supply for a token ID or overall |
| `exists` | `id (uint256)` | `bool` | Whether a token ID exists |
| `uri` | `id (uint256)` | `string` | Metadata URI for a token |
| `contractURI` | None | `string` | Collection-level metadata URI |
| `verifySignature` | `message (string), signature (bytes)` | `bool` | Verify a whitelist signature |
| `royaltyInfo` | `tokenId (uint256), salePrice (uint256)` | `(address, uint256)` | ERC-2981 royalty info |
| `supportsInterface` | `_interfaceId (bytes4)` | `bool` | ERC-165 interface detection |

### Key Write Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `mint` | `recipient (address), signature (bytes)` | Mint a Rarity 1 token. In public phase, pass `0x00` as signature. |
| `upgradeTokenTo` | `_tokenId (uint256)` | Burn 2 tokens of rarity `_tokenId` and mint 1 token of rarity `_tokenId + 1`. |
| `safeTransferFrom` | `from, to, id, value, data` | Standard ERC-1155 transfer. |
| `safeBatchTransferFrom` | `from, to, ids, values, data` | Standard ERC-1155 batch transfer. |
| `setApprovalForAll` | `operator, approved` | Approve an operator for all tokens. |

### Admin Functions (not relevant for dApp users, but good to know)

| Function | Purpose |
|----------|---------|
| `updatePhase` | Change minting phase |
| `updateContractConfig` | Update contract configuration |
| `updateMetadata` | Update base URI for metadata |
| `updateWhitelistSigner` | Change the whitelist signer address |
| `mintInitialSupply` | Admin mint specific token IDs |

### Upgrade Mechanics (Critical Business Logic)

The upgrade system is the core game mechanic:

1. **Minting always produces Rarity 1** (token ID likely = 1).
2. **Upgrading requires exactly 2 tokens of the same rarity level.**
3. **`upgradeTokenTo(_tokenId)`** burns 2 tokens of `_tokenId` from the caller and mints 1 token of `_tokenId + 1`.
4. **13 rarity levels** exist (1 through 13). Rarity 13 is the maximum and cannot be upgraded further.
5. The user must have a `balanceOf >= 2` for the specified `_tokenId` to upgrade.

**Rarity Multiplier Table:**

| Rarity | Base Multiplier | Stack Bonus | Max Multiplier |
|--------|----------------|-------------|----------------|
| 1 | 1.2x | 0.025 | 2x |
| 2 | 1.5x | 0.05 | 3x |
| 3 | 2x | 0.1 | 5x |
| 4 | 4x | 0.2 | 10x |
| 5 | 10x | 0.4 | 20x |
| 6 | 20x | 0.5 | 40x |
| 7 | 44x | 1 | 60x |
| 8 | 56x | 2 | 80x |
| 9 | 70x | 4 | 90x |
| 10 | 80x | 6 | 110x |
| 11 | 90x | 10 | 130x |
| 12 | 100x | 20 | 150x |
| 13 | 120x | 40 | 200x |

### Key Events to Index

The contract emits standard ERC-1155 events that the indexer must capture:

- **`TransferSingle(operator, from, to, id, value)`** -- Emitted on mint (from = `0x0`), burn (to = `0x0`), and transfer.
- **`TransferBatch(operator, from, to, ids, values)`** -- Emitted on batch operations.
- **`ApprovalForAll(account, operator, approved)`** -- Approval events.
- **`URI(value, id)`** -- Metadata update events.

**Mint detection:** `from == 0x0000000000000000000000000000000000000000`
**Burn detection:** `to == 0x0000000000000000000000000000000000000000`
**Upgrade detection:** A `TransferSingle` burn of 2 tokens of rarity N followed by a `TransferSingle` mint of 1 token of rarity N+1 in the same transaction.

---

## 3. Technology Stack Recommendations

### 3.1 Frontend Framework: **Next.js 14+ (App Router)**

**Why Next.js over Vite+React:**

- **Server-Side Rendering (SSR):** The `/analytics` page benefits from SSR for faster initial paint and SEO (if the analytics dashboard is meant to be publicly shareable).
- **API Routes:** Next.js API routes can act as a lightweight BFF (Backend for Frontend), proxying requests to the indexer backend, simplifying CORS and auth if needed.
- **File-Based Routing:** The two-route structure (`/` and `/analytics`) maps naturally to the App Router's file system conventions.
- **Built-in Optimizations:** Image optimization, code splitting, and font optimization come free.
- **Industry Standard:** Demonstrates knowledge of the most widely adopted React meta-framework, which evaluators likely expect.

**Trade-off acknowledged:** For a pure client-side dApp, Vite+React would be lighter. However, the analytics page with server-rendered charts and the evaluation focus on "project design" and "design patterns" makes Next.js the stronger choice.

### 3.2 Styling: **Tailwind CSS v4**

**Why Tailwind over CSS Modules:**

- **Rapid Prototyping:** Utility-first approach accelerates development, critical for hitting the 5-day delivery bonus.
- **Consistent Design System:** Tailwind's design tokens (spacing, colors, typography) enforce visual consistency without a custom design system.
- **Co-location:** Styles live alongside JSX, eliminating the mental overhead of switching between files.
- **Responsive Design:** Built-in responsive utilities (`sm:`, `md:`, `lg:`) make mobile-responsive layouts trivial.
- **Small Production Bundle:** PurgeCSS (built-in) eliminates unused styles.

**Enhancement:** Use `shadcn/ui` as a component library built on Tailwind + Radix UI primitives. This provides accessible, well-designed components (Dialog, Toast, Dropdown, Card, etc.) without the bloat of a full UI framework.

### 3.3 State Management: **TanStack Query (React Query) + Zustand**

**Why this combination:**

- **TanStack Query** handles all server/async state (API calls, contract reads) with built-in caching, refetching, loading/error states, and optimistic updates. This eliminates 80% of typical state management complexity.
- **Zustand** handles minimal client-only state (UI state like modal open/close, selected tokens for upgrade). It is tiny (~1KB), has no boilerplate, and avoids the Redux ceremony that would be overkill here.
- **wagmi already uses TanStack Query** under the hood, so contract reads are automatically cached and deduplicated.

**What we avoid:** Redux (too heavy), Context API alone (causes unnecessary re-renders), Jotai/Recoil (atomic state is overkill for two routes).

### 3.4 Web3 Stack: **wagmi v2 + viem + RainbowKit**

**Why wagmi+viem over ethers.js:**

| Criteria | wagmi+viem | ethers.js |
|----------|-----------|-----------|
| Bundle Size | ~27KB (viem, tree-shakable) | ~130KB |
| TypeScript | First-class, auto-generated types from ABI | Bolted-on types |
| React Integration | Native hooks (`useReadContract`, `useWriteContract`) | Manual wrapping needed |
| Error Handling | Typed errors with `ContractFunctionRevertedError` | Generic errors |
| Caching | Built-in via TanStack Query | Manual |
| Modern Patterns | Modular, composable | Monolithic |
| Maintenance | Actively developed, modern architecture | Stable but less active |

**Why RainbowKit for wallet connection:**

- **Beautiful out-of-the-box UI:** Modal, account dropdown, chain switcher are pre-built and customizable.
- **Multi-wallet support:** MetaMask, WalletConnect, Coinbase Wallet, Rainbow, etc.
- **Custom chain support:** Easy to define Somnia as a custom chain.
- **Built on wagmi:** Zero integration friction.
- **Theming:** Supports dark mode and custom themes that align with evaluation criteria around UI polish.

**Alternative considered:** ConnectKit is simpler but less customizable. A custom solution would take too long for the 5-day timeline.

### 3.5 Backend: **Node.js + Express.js (Separate Service)**

**Why Express.js over Next.js API Routes for the backend:**

- **Separation of Concerns:** The indexer is a long-running background process that continuously polls the blockchain. This does not fit the request-response model of Next.js API routes.
- **Process Isolation:** The indexer should run independently of the frontend. If the frontend restarts, the indexer keeps running. Docker Compose naturally models this as separate services.
- **Scalability Pattern:** In production, you might scale the indexer and API independently.
- **Evaluation Criteria:** "Project Design" rewards proper architectural separation and design patterns.

**Framework specifics:**
- **TypeScript** with strict mode for type safety.
- **Express.js** for REST API routes serving analytics data.
- **Node-cron or setInterval** for the polling loop.
- **viem** (same library as frontend) for blockchain interaction in the indexer.

### 3.6 ORM: **Drizzle ORM**

**Why Drizzle over Prisma or raw SQL:**

- **Type Safety:** Schema definitions in TypeScript generate types automatically, matching the TypeScript-first approach.
- **Lightweight:** No external binary (unlike Prisma's query engine). Drizzle is a thin, performant SQL wrapper.
- **SQL-like API:** Drizzle's query builder mirrors SQL closely, making queries readable and debuggable. This aligns with the "code readability" evaluation criterion.
- **Migration Support:** Built-in migration generation from schema changes.
- **SQLite & PostgreSQL support:** Works with both, allowing easy switching.

### 3.7 Database: **PostgreSQL** (via Docker)

**Why PostgreSQL over SQLite:**

- **Concurrent Access:** The indexer writes continuously while the API serves reads. PostgreSQL handles concurrent read/write gracefully; SQLite can lock.
- **Production-Ready:** Demonstrates a real-world setup. Docker makes it zero-effort to run.
- **Richer Query Support:** Window functions, CTEs, and date/time functions are useful for time-series analytics queries (e.g., mints per day).
- **Evaluation Signal:** Using PostgreSQL signals production awareness over a toy setup.
- **Docker Compose Natural Fit:** PostgreSQL as a Docker service is idiomatic and expected.

**Schema Design (initial):**

```sql
-- Tracks every on-chain event we care about
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  tx_hash       VARCHAR(66) NOT NULL,
  block_number  BIGINT NOT NULL,
  log_index     INTEGER NOT NULL,
  event_type    VARCHAR(20) NOT NULL,  -- 'mint', 'burn', 'upgrade', 'transfer'
  from_address  VARCHAR(42) NOT NULL,
  to_address    VARCHAR(42) NOT NULL,
  token_id      INTEGER NOT NULL,
  amount        INTEGER NOT NULL DEFAULT 1,
  timestamp     TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Indexer state to track last processed block
CREATE TABLE indexer_state (
  id              SERIAL PRIMARY KEY,
  last_block      BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Materialized view or query for analytics
-- (mints_per_day, upgrades_per_day, rarity_distribution, unique_holders)
```

### 3.8 Charting: **Recharts**

**Why Recharts over Chart.js:**

- **React-Native Components:** Recharts is built for React with declarative JSX components (`<LineChart>`, `<BarChart>`, `<Tooltip>`). Chart.js requires imperative canvas manipulation or a wrapper library (`react-chartjs-2`).
- **Composable:** Each chart element (Axis, Line, Bar, Tooltip, Legend) is a separate component, giving fine-grained control.
- **SSR Compatible:** Works with Next.js SSR without hydration issues.
- **Responsive:** Built-in `<ResponsiveContainer>` for adaptive sizing.
- **Lighter for Simple Charts:** For the 2-3 charts needed (line chart for mints over time, bar chart for rarity distribution), Recharts is ideal without the overhead of Chart.js's full canvas rendering engine.

### 3.9 Containerization: **Docker + Docker Compose**

**Architecture:**

```yaml
services:
  frontend:    # Next.js app on port 3000
  backend:     # Express.js API + indexer on port 4000
  db:          # PostgreSQL on port 5432
```

**Key Docker decisions:**
- **Multi-stage builds** for frontend and backend (build stage + slim runtime stage) to minimize image size.
- **Health checks** on each service for robust orchestration.
- **Volume mount** for PostgreSQL data persistence.
- **Environment variables** via `.env` file for configuration (RPC URL, contract address, database URL).
- **Single `docker-compose up`** spins up the entire stack.

---

## 4. Project Structure

### Monorepo with Shared Types

A monorepo is the best fit here because:
1. The frontend and backend share TypeScript types (event types, API response shapes, contract ABI types).
2. A single `docker-compose.yml` at the root orchestrates everything.
3. The evaluator clones one repo and runs one command.

```
intraverse-dapp/
|
|-- docker-compose.yml              # Orchestrates all services
|-- .env.example                    # Environment variable template
|-- README.md                       # Setup & usage documentation
|
|-- packages/
|   |-- shared/                     # Shared TypeScript types & constants
|   |   |-- src/
|   |   |   |-- types/
|   |   |   |   |-- events.ts       # Event types (MintEvent, UpgradeEvent, etc.)
|   |   |   |   |-- analytics.ts    # API response types
|   |   |   |   |-- contract.ts     # Contract-related types
|   |   |   |-- constants/
|   |   |   |   |-- contract.ts     # Contract address, ABI
|   |   |   |   |-- chain.ts        # Somnia chain config
|   |   |   |   |-- rarities.ts     # Rarity names, multipliers
|   |   |   |-- index.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- frontend/                   # Next.js application
|   |   |-- src/
|   |   |   |-- app/
|   |   |   |   |-- layout.tsx      # Root layout with providers
|   |   |   |   |-- page.tsx        # "/" -- Mint & Manage route
|   |   |   |   |-- analytics/
|   |   |   |   |   |-- page.tsx    # "/analytics" route
|   |   |   |   |-- not-found.tsx   # 404 page
|   |   |   |-- components/
|   |   |   |   |-- layout/
|   |   |   |   |   |-- Header.tsx
|   |   |   |   |   |-- Footer.tsx
|   |   |   |   |   |-- Navigation.tsx
|   |   |   |   |-- mint/
|   |   |   |   |   |-- MintButton.tsx
|   |   |   |   |   |-- MintStatus.tsx
|   |   |   |   |-- inventory/
|   |   |   |   |   |-- TokenGrid.tsx
|   |   |   |   |   |-- TokenCard.tsx
|   |   |   |   |   |-- UpgradeModal.tsx
|   |   |   |   |-- analytics/
|   |   |   |   |   |-- MintsChart.tsx
|   |   |   |   |   |-- RarityDistribution.tsx
|   |   |   |   |   |-- StatsCards.tsx
|   |   |   |   |-- ui/             # shadcn/ui components
|   |   |   |   |   |-- button.tsx
|   |   |   |   |   |-- card.tsx
|   |   |   |   |   |-- dialog.tsx
|   |   |   |   |   |-- toast.tsx
|   |   |   |   |   |-- skeleton.tsx
|   |   |   |-- hooks/
|   |   |   |   |-- useTokenBalances.ts    # Reads balanceOfBatch for all 13 rarities
|   |   |   |   |-- useMint.ts             # Mint transaction hook
|   |   |   |   |-- useUpgrade.ts          # Upgrade transaction hook
|   |   |   |   |-- useAnalytics.ts        # Fetches analytics from backend API
|   |   |   |-- lib/
|   |   |   |   |-- wagmi.ts         # wagmi config + Somnia chain definition
|   |   |   |   |-- api.ts           # API client for backend
|   |   |   |   |-- utils.ts         # Utility functions
|   |   |   |-- providers/
|   |   |   |   |-- Web3Provider.tsx  # WagmiProvider + RainbowKitProvider + QueryClientProvider
|   |   |-- public/
|   |   |   |-- images/              # Token card images, logos
|   |   |-- Dockerfile
|   |   |-- next.config.ts
|   |   |-- tailwind.config.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- backend/                     # Express.js API + Indexer
|   |   |-- src/
|   |   |   |-- index.ts             # Entry point: starts API server + indexer
|   |   |   |-- api/
|   |   |   |   |-- server.ts        # Express app setup
|   |   |   |   |-- routes/
|   |   |   |   |   |-- analytics.ts # GET /api/analytics/* endpoints
|   |   |   |   |   |-- health.ts    # GET /api/health
|   |   |   |   |-- middleware/
|   |   |   |   |   |-- errorHandler.ts
|   |   |   |   |   |-- cors.ts
|   |   |   |   |   |-- rateLimit.ts
|   |   |   |-- indexer/
|   |   |   |   |-- indexer.ts        # Main indexer loop
|   |   |   |   |-- eventParser.ts    # Parse ERC-1155 events into domain events
|   |   |   |   |-- blockProcessor.ts # Process a range of blocks
|   |   |   |-- db/
|   |   |   |   |-- schema.ts         # Drizzle schema definitions
|   |   |   |   |-- client.ts         # Database connection
|   |   |   |   |-- migrations/       # Drizzle migrations
|   |   |   |   |-- queries/
|   |   |   |   |   |-- analytics.ts  # Analytics query functions
|   |   |   |   |   |-- events.ts     # Event CRUD operations
|   |   |   |   |   |-- state.ts      # Indexer state management
|   |   |   |-- config/
|   |   |   |   |-- env.ts            # Environment variable validation (zod)
|   |   |   |   |-- chain.ts          # Viem client setup for Somnia
|   |   |   |-- utils/
|   |   |   |   |-- logger.ts         # Structured logging (pino)
|   |   |   |   |-- retry.ts          # Retry logic for RPC calls
|   |   |-- Dockerfile
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- drizzle.config.ts
```

---

## 5. Key Research Items

### 5.1 Somnia Network Details

| Parameter | Value |
|-----------|-------|
| **Chain Name** | Somnia Mainnet |
| **Chain ID** | 5031 |
| **Native Currency** | SOMI (assumed 18 decimals, standard EVM) |
| **HTTP RPC URLs** | `https://api.infra.mainnet.somnia.network` (primary) |
| | `https://somnia-json-rpc.stakely.io` (backup) |
| | `https://somnia-rpc.publicnode.com` (backup) |
| **WebSocket RPC** | `wss://api.infra.mainnet.somnia.network/ws` |
| **Block Explorer** | `https://explorer.somnia.network` |
| **Explorer API** | `https://explorer.somnia.network/api` (Blockscout-compatible) |
| **Testnet Chain ID** | 50312 (Shannon Testnet -- for development if needed) |
| **Testnet RPC** | `https://dream-rpc.somnia.network` |
| **Testnet Explorer** | `https://shannon-explorer.somnia.network` |
| **EVM Compatibility** | Full -- Solidity, Hardhat, Foundry, Remix, OpenZeppelin all work |
| **Additional RPC Providers** | Ankr, Public Node, Stakely, Validation Cloud |

**Defining Somnia as a custom chain in viem:**

```typescript
import { defineChain } from 'viem';

export const somnia = defineChain({
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network'],
      webSocket: ['wss://api.infra.mainnet.somnia.network/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
});
```

### 5.2 Contract ABI Acquisition Strategy

**Primary method:** Fetch from the verified contract on Somnia Explorer:

```bash
curl "https://explorer.somnia.network/api?module=contract&action=getabi&address=0xC82E0CE02623972330164657e8C3e568d8f351FA"
```

**Fallback methods (if the above fails or returns partial data):**
1. Use `cast interface` (Foundry) to extract ABI from bytecode.
2. Manually reconstruct the ABI from the function signatures we have identified.
3. Check if Intraverse has published the ABI in their GitHub or documentation.

**Storage approach:** Save the ABI as a TypeScript constant in `packages/shared/src/constants/contract.ts` so both frontend and backend import it from a single source of truth.

### 5.3 Token Standard Confirmation

The contract is **ERC-1155** (Multi-Token Standard). Evidence:
- `balanceOf(address, uint256)` -- takes both account AND token ID (ERC-721 only takes owner).
- `balanceOfBatch(address[], uint256[])` -- ERC-1155 specific.
- `safeBatchTransferFrom` -- ERC-1155 batch transfer.
- `safeTransferFrom` with `value` parameter -- ERC-1155 (ERC-721 has no `value`).
- `supportsInterface` for ERC-1155 interface ID `0xd9b67a26`.
- `uri(uint256)` instead of `tokenURI(uint256)` -- ERC-1155 metadata pattern.

**Implication:** Token IDs 1-13 represent rarity levels. A user can hold multiple tokens of the same ID (e.g., 5 tokens of Rarity 1). This is different from ERC-721 where each token is unique.

### 5.4 Upgrade Mechanism On-Chain

The `upgradeTokenTo(_tokenId)` function:
1. Checks that the caller's `balanceOf(caller, _tokenId) >= 2`.
2. Burns 2 units of `_tokenId` from the caller.
3. Mints 1 unit of `_tokenId + 1` to the caller.
4. Emits `TransferSingle` events for both the burn and mint.

**Transaction pattern for an upgrade:**
- Log 1: `TransferSingle(contract, caller, 0x0, _tokenId, 2)` -- burn.
- Log 2: `TransferSingle(contract, 0x0, caller, _tokenId+1, 1)` -- mint.

**Important for frontend:**
- Before calling `upgradeTokenTo`, check `balanceOf` to ensure the user has >= 2 tokens.
- Token ID 13 cannot be upgraded (likely reverts if attempted).
- The function does NOT require approval since the user is burning their own tokens via the contract.

---

## 6. Risk Assessment & Challenges

### 6.1 Somnia RPC Reliability

**Risk:** Somnia is a relatively new L1 chain. Public RPC endpoints may have intermittent availability, rate limits, or higher latency compared to established chains like Ethereum or Polygon.

**Mitigations:**
- **Multiple RPC endpoints:** Configure a fallback list (primary: `api.infra.mainnet.somnia.network`, fallbacks: `stakely.io`, `publicnode.com`).
- **Retry logic with exponential backoff:** Wrap all RPC calls in a retry utility.
- **Graceful degradation:** If the RPC is down, show cached data with a "data may be stale" indicator rather than a blank page.
- **Connection health monitoring:** The indexer should log RPC errors and track uptime.

```typescript
// Example retry utility
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error('Unreachable');
}
```

### 6.2 ABI Availability

**Risk:** The contract ABI might not be fully verified, or the explorer API might have intermittent issues.

**Mitigations:**
- Fetch and cache the ABI locally as a TypeScript file at build time.
- We have already identified all the critical function signatures from the explorer. If full ABI retrieval fails, we can reconstruct the minimal ABI from known function selectors.
- Use `cast interface` (Foundry) as a fallback to extract the ABI from deployed bytecode.

### 6.3 Indexer Design: Polling vs. WebSocket

**Risk:** Choosing the wrong event-listening strategy could lead to missed events or excessive RPC calls.

**Recommendation: Hybrid approach (polling primary, WebSocket optional enhancement).**

| Approach | Pros | Cons |
|----------|------|------|
| **Polling** | Simple, reliable, resumable from last block | Latency (depends on poll interval), more RPC calls |
| **WebSocket** | Real-time, fewer redundant calls | Connection drops, harder to recover missed events, state management |
| **Hybrid** | Best of both: WebSocket for real-time, polling as catch-up | More complex implementation |

**Implementation plan:**
1. **Start with polling** (simpler, more reliable for a 5-day timeline).
2. Poll every 5-10 seconds for new blocks.
3. Store the last processed block number in the database.
4. On restart, resume from the last processed block (no missed events).
5. **Optional WebSocket enhancement** if time permits: subscribe to `TransferSingle` events via WSS for near-instant indexing, with polling as a fallback.

### 6.4 Rate Limiting on RPC Endpoints

**Risk:** Public RPC endpoints often have rate limits (e.g., 25 requests/second). The indexer might hit these limits during initial catch-up when processing many historical blocks.

**Mitigations:**
- **Batch block processing:** Fetch events for ranges of blocks (e.g., 100 blocks at a time) using `eth_getLogs` with `fromBlock`/`toBlock` filters instead of one block at a time.
- **Request throttling:** Implement a token-bucket or leaky-bucket rate limiter.
- **Configurable polling interval:** Allow the poll interval to be set via environment variable.
- **Backpressure handling:** If a 429 (Too Many Requests) response is received, back off exponentially.

### 6.5 Initial Block Sync / Historical Data

**Risk:** If the contract has been live for a while, there could be thousands of historical events to index on first startup. This initial sync could take significant time.

**Mitigations:**
- **Configurable start block:** Set `INDEXER_START_BLOCK` to the contract deployment block (or slightly before) to avoid scanning from genesis.
- **Progress logging:** Log progress during initial sync (e.g., "Indexed blocks 1000-2000 of 50000").
- **Batch size tuning:** Process larger block ranges during catch-up, smaller ranges during real-time tracking.

### 6.6 Frontend UX During Pending Transactions

**Risk:** Blockchain transactions take time to confirm. Users might click "Mint" or "Upgrade" multiple times or be confused by the wait.

**Mitigations:**
- **Optimistic UI updates** with rollback on failure.
- **Transaction status tracking:** Show pending/confirming/confirmed/failed states.
- **Disable action buttons** while a transaction is pending.
- **Toast notifications** for transaction status changes.
- **Loading skeletons** while data is being fetched.

---

## 7. Development Timeline

### 5-Day Sprint Plan

#### Day 1: Foundation & Infrastructure

| Task | Time | Details |
|------|------|---------|
| Project scaffolding | 2h | Initialize monorepo, Next.js frontend, Express backend, shared package, Docker setup. |
| Somnia chain configuration | 1h | Define custom chain in viem, configure wagmi, test RPC connectivity. |
| ABI acquisition & typing | 1h | Fetch ABI from explorer, generate TypeScript types, store in shared package. |
| Docker Compose setup | 1h | Create Dockerfiles (multi-stage), docker-compose.yml with frontend, backend, PostgreSQL. |
| Database schema & migrations | 1h | Define Drizzle schema (events table, indexer_state table), run initial migration. |
| Wallet connection | 1h | Integrate RainbowKit, test wallet connect/disconnect with Somnia. |

**Day 1 Deliverable:** Skeleton app boots via `docker-compose up`, wallet connects to Somnia, database is initialized.

#### Day 2: Mint & Manage Page (Route `/`)

| Task | Time | Details |
|------|------|---------|
| Mint functionality | 2h | `useMint` hook, MintButton component, transaction status handling. |
| Token inventory display | 3h | `useTokenBalances` hook (reads balanceOfBatch for IDs 1-13), TokenGrid with TokenCard components showing rarity, count, and multiplier. |
| Upgrade functionality | 2h | `useUpgrade` hook, UpgradeModal with token selection, confirmation, and execution. |
| Error handling & UX | 1h | Toast notifications, loading skeletons, error boundaries, disabled states. |

**Day 2 Deliverable:** Users can connect wallet, mint Rarity 1 tokens, view their inventory, and upgrade tokens.

#### Day 3: Backend Indexer & API

| Task | Time | Details |
|------|------|---------|
| Indexer core | 3h | Block processor, event parser (distinguish mint/burn/upgrade/transfer from TransferSingle events), polling loop. |
| Database operations | 1.5h | Insert events, update indexer state, handle duplicates (upsert on tx_hash+log_index). |
| Analytics API endpoints | 2h | `GET /api/analytics/mints-over-time`, `GET /api/analytics/rarity-distribution`, `GET /api/analytics/stats` (total mints, upgrades, unique holders). |
| Health & monitoring | 0.5h | `GET /api/health` with database and RPC connectivity checks. |
| Error handling & retry | 1h | RPC retry logic, graceful error recovery, structured logging. |

**Day 3 Deliverable:** Indexer runs, processes historical and new events, API serves analytics data.

#### Day 4: Analytics Page (Route `/analytics`) & Polish

| Task | Time | Details |
|------|------|---------|
| Analytics charts | 3h | MintsChart (Recharts LineChart), RarityDistribution (BarChart), StatsCards (aggregate numbers). |
| Frontend-backend integration | 1h | `useAnalytics` hook, API client, loading states. |
| UI/UX polish | 2h | Navigation between routes, responsive design, dark mode, animations/transitions. |
| Cross-route consistency | 1h | Shared layout (Header with wallet connection + nav), consistent card styles. |
| Error boundaries & edge cases | 1h | Empty states, disconnected wallet state, network switching prompts. |

**Day 4 Deliverable:** Full analytics dashboard with charts. Both routes fully functional.

#### Day 5: Testing, Documentation & Deployment

| Task | Time | Details |
|------|------|---------|
| Integration testing | 2h | Test mint flow, upgrade flow, analytics data accuracy. Docker Compose end-to-end test. |
| README documentation | 1.5h | Setup instructions, architecture overview, environment variables, screenshots. |
| Code cleanup & linting | 1h | ESLint + Prettier pass, remove dead code, add JSDoc comments to key functions. |
| Docker optimization | 0.5h | Verify multi-stage builds work, test `docker-compose up` from clean state. |
| Edge case handling | 1h | No wallet connected, wrong network, RPC failures, empty inventory. |
| Optional: deployment | 2h | Deploy frontend to Vercel, backend to Railway/Render, set up production database. |

**Day 5 Deliverable:** Production-ready, documented, Dockerized application.

---

## 8. Evaluation Criteria Mapping

### 8.1 Working Code

> **Criterion:** The application should run correctly, and the core features should be functional.

| Strategy | Implementation |
|----------|---------------|
| **One-command startup** | `docker-compose up` builds and starts all services. README documents the exact steps. |
| **Environment configuration** | `.env.example` with all required variables and sensible defaults. No hardcoded secrets. |
| **Health checks** | Docker health checks on each service. API `/health` endpoint reports database and RPC status. |
| **Idempotent setup** | Database migrations run automatically on backend startup. Indexer resumes from last processed block. |
| **Cross-platform** | Docker ensures consistent behavior across macOS, Linux, Windows (WSL2). |

### 8.2 Project Design

> **Criterion:** Proper use of design patterns, component decoupling, separation of concerns.

| Pattern | Where Applied |
|---------|--------------|
| **Repository Pattern** | Database queries abstracted behind query functions (`getMintsOverTime()`, `getRarityDistribution()`). API routes never touch the database directly. |
| **Service Layer** | Business logic (event parsing, analytics aggregation) separated from transport (Express routes) and data access (Drizzle queries). |
| **Custom Hooks (Composition)** | Each contract interaction is a custom hook (`useMint`, `useUpgrade`, `useTokenBalances`) that encapsulates wagmi calls, error handling, and state management. |
| **Component Composition** | UI components are small, focused, and composable. `TokenCard` is a pure presentational component; `TokenGrid` handles layout; `UpgradeModal` orchestrates the upgrade flow. |
| **Provider Pattern** | `Web3Provider` wraps the app with WagmiProvider, RainbowKitProvider, and QueryClientProvider. Clean dependency injection via React context. |
| **Strategy Pattern** | RPC fallback logic uses an ordered list of endpoints, trying each in sequence. |
| **Observer Pattern** | The indexer emits structured log events; the polling loop observes new blocks and triggers processing. |
| **Shared Package** | Types and constants are defined once in `packages/shared` and consumed by both frontend and backend, preventing drift. |

### 8.3 Code Readability

> **Criterion:** Clean, well-organized, and easy-to-understand code.

| Practice | How |
|----------|-----|
| **Consistent naming** | `camelCase` for variables/functions, `PascalCase` for components/types, `SCREAMING_SNAKE_CASE` for constants. File names match export names. |
| **ESLint + Prettier** | Enforced via shared config. Rules: no unused variables, no `any` types, consistent imports, max line length. |
| **TypeScript strict mode** | `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. No escape hatches. |
| **Meaningful abstractions** | Each file has a single responsibility. Functions are short (< 30 lines). Complex logic is broken into named helper functions. |
| **JSDoc comments** | Key functions (hooks, API handlers, indexer logic) have JSDoc comments explaining purpose, parameters, and return values. |
| **Barrel exports** | Each directory has an `index.ts` re-exporting its public API, keeping imports clean. |
| **No magic numbers** | Constants like token IDs, rarity counts, and poll intervals are named constants, not inline numbers. |

### 8.4 Error Handling

> **Criterion:** Proper error handling and user feedback.

| Layer | Strategy |
|-------|----------|
| **React Error Boundaries** | Top-level error boundary catches rendering errors and shows a friendly fallback UI instead of a white screen. |
| **Transaction Errors** | Catch contract reverts (insufficient balance, wrong phase, max supply reached) and translate to user-friendly messages. Example: "You need at least 2 cards of this rarity to upgrade." |
| **Network Errors** | Detect wrong network (chain ID mismatch), prompt user to switch to Somnia via `useSwitchChain`. Show clear message if Somnia is not added to wallet. |
| **API Errors** | Express error middleware catches all unhandled errors, logs them, and returns structured JSON error responses with appropriate HTTP status codes. |
| **Loading States** | Every async operation (contract read, API call, transaction) has explicit loading, success, and error states rendered in the UI. Skeleton components during loading. |
| **Toast Notifications** | `sonner` or `react-hot-toast` for transient notifications: "Mint successful!", "Upgrade failed: insufficient tokens", "Wallet disconnected". |
| **Indexer Resilience** | The indexer wraps each block processing cycle in try/catch. Individual event parsing failures do not crash the indexer; they are logged and skipped. The indexer automatically retries failed RPC calls. |
| **Input Validation** | Validate environment variables at startup with `zod`. Fail fast with clear error messages if required config is missing. |
| **Empty States** | Specific UI for: no wallet connected, wallet connected but no tokens, no analytics data yet. |

### 8.5 Smart AI Usage

> **Criterion:** Evidence of effective AI-assisted development, documented decisions.

| Area | What to Document / Defend |
|------|---------------------------|
| **Architecture decisions** | Why monorepo, why separate backend, why PostgreSQL over SQLite -- be ready to explain trade-offs. |
| **Technology choices** | Why wagmi+viem over ethers.js (type safety, bundle size, hooks). Why Recharts over Chart.js (React-native, composable). |
| **Contract interaction patterns** | How we determined the upgrade mechanism from the ABI analysis. How we detect upgrades vs. regular mints in the event logs. |
| **Indexer design** | Why polling over WebSocket for initial implementation. How the indexer handles restarts and historical sync. |
| **Error handling strategy** | Systematic approach -- not just try/catch everywhere, but typed errors, user-friendly messages, and graceful degradation. |
| **Code generation** | Where AI was used (e.g., generating TypeScript types from ABI, scaffolding boilerplate) vs. where manual implementation was critical (business logic, UX decisions). |
| **Prompt engineering** | Keep a log of key prompts used during development. This demonstrates intentional, directed AI usage rather than copy-paste-and-pray. |

---

## Appendix A: Environment Variables

```env
# .env.example

# Somnia Network
NEXT_PUBLIC_CHAIN_ID=5031
NEXT_PUBLIC_RPC_URL=https://api.infra.mainnet.somnia.network
NEXT_PUBLIC_WS_RPC_URL=wss://api.infra.mainnet.somnia.network/ws
NEXT_PUBLIC_EXPLORER_URL=https://explorer.somnia.network
NEXT_PUBLIC_CONTRACT_ADDRESS=0xC82E0CE02623972330164657e8C3e568d8f351FA

# Backend
BACKEND_URL=http://localhost:4000
DATABASE_URL=postgresql://postgres:postgres@db:5432/intraverse
PORT=4000

# Indexer
INDEXER_POLL_INTERVAL_MS=5000
INDEXER_START_BLOCK=0
INDEXER_BATCH_SIZE=100
RPC_URL=https://api.infra.mainnet.somnia.network
RPC_FALLBACK_URLS=https://somnia-json-rpc.stakely.io,https://somnia-rpc.publicnode.com

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Appendix B: API Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| `GET` | `/api/health` | `{ status, database, rpc, lastIndexedBlock }` | Health check |
| `GET` | `/api/analytics/mints-over-time?interval=day` | `[{ date, count }]` | Mints aggregated by time interval |
| `GET` | `/api/analytics/upgrades-over-time?interval=day` | `[{ date, count }]` | Upgrades aggregated by time interval |
| `GET` | `/api/analytics/rarity-distribution` | `[{ tokenId, name, totalSupply }]` | Current supply per rarity level |
| `GET` | `/api/analytics/stats` | `{ totalMints, totalUpgrades, uniqueHolders, totalSupply }` | Aggregate statistics |
| `GET` | `/api/analytics/recent-events?limit=20` | `[{ txHash, type, from, to, tokenId, amount, timestamp }]` | Recent on-chain events |

## Appendix C: Key Dependencies

### Frontend
| Package | Purpose |
|---------|---------|
| `next` | React meta-framework |
| `react`, `react-dom` | UI library |
| `tailwindcss` | Utility-first CSS |
| `wagmi` | React hooks for Ethereum |
| `viem` | TypeScript Ethereum library |
| `@rainbow-me/rainbowkit` | Wallet connection UI |
| `@tanstack/react-query` | Async state management |
| `recharts` | Charting library |
| `sonner` | Toast notifications |
| `zustand` | Minimal client state |
| `clsx`, `tailwind-merge` | Tailwind class utilities |

### Backend
| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `viem` | Blockchain interaction |
| `drizzle-orm` | ORM |
| `postgres` (or `pg`) | PostgreSQL driver |
| `zod` | Schema validation |
| `pino` | Structured logging |
| `cors` | CORS middleware |
| `helmet` | Security headers |

### Dev Dependencies
| Package | Purpose |
|---------|---------|
| `typescript` | Type system |
| `eslint` | Linting |
| `prettier` | Formatting |
| `tsx` | TypeScript execution |
| `drizzle-kit` | Migration tooling |

---

## Appendix D: Research Sources

- [Somnia Network Info (Official Docs)](https://docs.somnia.network/developer/network-info)
- [Somnia WebSocket Event Listening](https://docs.somnia.network/developer/building-dapps/data-indexing-and-querying/listening-to-blockchain-events-websocket)
- [Somnia Mainnet Block Explorer](https://explorer.somnia.network)
- [Somnia on Thirdweb (RPC, Chain Settings)](https://thirdweb.com/somnia)
- [Moon Pass Collection on Intraverse](https://play.intraverse.io/collections/moon-pass)
- [Intraverse Dream Circuit Announcement](https://intraverse.io/dream-circuit-by-intraverse-x-somnia/)
- [Intraverse Medium: A New Era of Racing on Somnia](https://medium.com/@intraverse/a-new-era-of-racing-on-somnia-bea233b93f89)
- [viem Documentation (Why Viem)](https://viem.sh/docs/introduction)
- [wagmi vs ethers.js Comparison](https://shapkarin.me/articles/wagmi-ethers/)
- [Viem vs Ethers.js (MetaMask Blog)](https://metamask.io/news/viem-vs-ethers-js-a-detailed-comparison-for-web3-developers)
