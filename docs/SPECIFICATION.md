# Intraverse FullStack Developer Task - Technical Specification Document

---

## 1. Overview

**Project:** Intraverse FullStack Developer Task - A decentralized application (dApp) with two routes: a Mint & Manage interface for interacting with an ERC-1155 NFT contract, and an Analytics dashboard displaying on-chain transaction data.

**Contract:** `0xC82E0CE02623972330164657e8C3e568d8f351FA` (IntraverseProtocolContract)

**Network:** Somnia Mainnet (Chain ID `5031`)

**Tech Stack:**
- **Frontend:** React / Next.js with TypeScript
- **Backend:** Node.js (Express or Next.js API routes) with TypeScript
- **Database:** SQLite (development) / PostgreSQL (production)
- **Blockchain Interaction:** ethers.js or viem/wagmi
- **Containerization:** Docker + Docker Compose

---

## 2. Architecture Diagram (ASCII)

```
+------------------------------------------------------------------+
|                        USER'S BROWSER                            |
|                                                                  |
|  +---------------------------+   +----------------------------+  |
|  |  Route: / (Mint & Manage) |   |  Route: /analytics         |  |
|  |                           |   |                            |  |
|  |  - WalletConnect          |   |  - KPICards               |  |
|  |  - NetworkSwitcher        |   |  - DailyChart             |  |
|  |  - MintButton             |   |  - TransactionsTable      |  |
|  |  - TokenInventory         |   |                            |  |
|  |  - TokenCard (x12)        |   |                            |  |
|  |  - UpgradeButton          |   |                            |  |
|  +------------+--------------+   +-------------+--------------+  |
|               |                                |                 |
+------------------------------------------------------------------+
                |                                |
                v                                v
+---------------+----------------+  +------------+---------------+
|       Web3 Provider            |  |       Backend API           |
|    (MetaMask / Injected)       |  |    (Node.js / Express)      |
|                                |  |                             |
|  - wallet_addEthereumChain     |  |  GET /api/analytics/summary |
|  - wallet_switchEthereumChain  |  |  GET /api/analytics/daily   |
|  - eth_sendTransaction         |  |  GET /api/analytics/txs     |
|  - eth_call (balanceOf, etc.)  |  |                             |
+---------------+----------------+  +------------+---------------+
                |                                |
                v                                v
+---------------+----------------+  +------------+---------------+
|        Somnia RPC              |  |        Database             |
|  (Chain ID: 5031)              |  |     (SQLite / PostgreSQL)   |
|                                |  |                             |
|  api.infra.mainnet.somnia.     |  |  - transactions table       |
|  network                       |  |  - indexer_state table      |
+---------------+----------------+  +------------+---------------+
                ^                                ^
                |                                |
                +----------------+---------------+
                                 |
                  +--------------+--------------+
                  |      Indexer Service         |
                  |                              |
                  |  - Polls new blocks          |
                  |  - Filters contract txs      |
                  |  - Decodes method selectors  |
                  |  - Stores in database        |
                  |  - Tracks last indexed block |
                  +-----------------------------+
```

**Data Flow Summary:**
1. The **Frontend** communicates directly with the **Somnia RPC** via a Web3 provider (MetaMask) for all on-chain reads and writes (minting, upgrading, balance queries).
2. The **Frontend** fetches analytics data from the **Backend API**, which reads from the **Database**.
3. The **Indexer Service** runs as a background process, continuously polling the **Somnia RPC** for new blocks, filtering for transactions involving the contract, decoding them, and storing the results in the **Database**.

---

## 3. Frontend Specification

### 3.1 Route: `/` (Mint & Manage)

#### Components

| Component | Purpose | Key Behavior |
|---|---|---|
| `WalletConnect` | Connect wallet button using browser wallet (MetaMask) | Displays "Connect Wallet" when disconnected, shows truncated address (`0x1234...abcd`) when connected. Handles `eth_requestAccounts`. |
| `NetworkSwitcher` | "Switch Network" button | Calls `wallet_switchEthereumChain` with chain ID `0x13A7`. If the chain is not recognized, calls `wallet_addEthereumChain` with full Somnia config. Only visible when connected to wrong network. |
| `MintButton` | Triggers the mint transaction | Calls `mint(connectedAddress, 0x0)` on the contract. Displays tx hash on submission, shows pending/confirmed/error states with appropriate UI feedback. Disabled if wallet not connected or wrong network. |
| `TokenInventory` | Shows total number of tokens owned from this contract | Aggregates `balanceOf` across all 12 rarity levels. Displays a summary count. |
| `TokenCard` (x12) | Individual card per rarity level | Each card shows: rarity level name/number (0-11), balance of that rarity, and an "Upgrade to next rarity" button. Card 11 (max rarity) shows no upgrade button. |
| `UpgradeButton` | Triggers the upgrade transaction | Calls `upgradeTokenTo(tokenId)`. Disabled unless user holds >= 2 tokens of the same rarity. Shows clear tooltip/explanation of upgrade mechanics (burns 2 of current rarity, mints 1 of next rarity). Displays tx hash, pending/confirmed/error states. |

#### State Management

```typescript
interface AppState {
  // Wallet state
  walletAddress: string | null;
  chainId: number | null;
  isConnecting: boolean;

  // Token state
  tokenBalances: Record<number, bigint>; // rarityId (0-11) -> balance
  isLoadingBalances: boolean;

  // Transaction state
  mintTx: TransactionState;
  upgradeTx: Record<number, TransactionState>; // per rarity

  // UI state
  error: string | null;
}

interface TransactionState {
  status: 'idle' | 'pending' | 'confirmed' | 'error';
  hash: string | null;
  error: string | null;
}
```

#### Error Handling

| Error Scenario | User Feedback |
|---|---|
| No wallet detected | "No Ethereum wallet detected. Please install MetaMask." with link to MetaMask download. |
| Wrong network | Banner: "Please switch to Somnia network" with a "Switch Network" button. |
| Insufficient balance for upgrade | Upgrade button disabled with tooltip: "You need at least 2 tokens of this rarity to upgrade." |
| User rejected transaction | Toast: "Transaction was rejected by the user." |
| RPC errors | Toast: "Network error. Please try again later." with retry option. |
| Transaction reverted | Toast: "Transaction failed on-chain." with link to tx on explorer. |
| Loading states | Skeleton components for token cards and balances during initial load. Spinner overlays during transactions. |

### 3.2 Route: `/analytics`

#### Components

| Component | Purpose | Key Behavior |
|---|---|---|
| `KPICards` | Summary statistics | Three cards: (1) Total Transactions count, (2) Total Gas Used (formatted with commas), (3) Total Gas Cost in native currency (STT/SOMI). Data from `GET /api/analytics/summary`. |
| `DailyChart` | Line chart of daily transaction count | X-axis: dates. Y-axis: tx count. Date range picker with `from` and `to` inputs. Defaults to last 30 days. Data from `GET /api/analytics/daily?from=...&to=...`. Uses a charting library (e.g., Recharts, Chart.js). |
| `TransactionsTable` | Paginated table of individual transactions | Columns: Tx Hash (linked to `https://explorer.somnia.network/tx/{hash}`), Method Name (`mint` / `upgradeTokenTo` / `unknown`), Date (formatted), Gas Used. Pagination controls (prev/next, page size selector). Data from `GET /api/analytics/txs?limit=...&offset=...`. |

#### Data Flow

1. On mount, fetch `GET /api/analytics/summary` for KPI cards.
2. On mount and on date range change, fetch `GET /api/analytics/daily?from=...&to=...` for chart data.
3. On mount and on page change, fetch `GET /api/analytics/txs?limit=50&offset=...` for table data.
4. All fetches show loading skeletons while in progress.
5. All fetches show error states with retry buttons if the API call fails.

### 3.3 Shared Components

| Component | Purpose |
|---|---|
| `Layout` | Main layout wrapper with navigation bar. Links to `/` (Mint & Manage) and `/analytics`. Shows connected wallet address in the header. |
| `ErrorBoundary` | React error boundary wrapper. Catches rendering errors and displays a fallback UI with "Something went wrong" message and a "Reload" button. |
| `Toast` / `Notification` | Toast notification system for success/error/info feedback. Auto-dismiss after 5 seconds. Stackable. |
| `Skeleton` | Loading skeleton components matching the shape of cards, charts, and table rows. Used during all async operations. |
| `Spinner` | Inline spinner for buttons during transaction submission. |
| `AddressDisplay` | Utility component to show truncated Ethereum addresses with copy-to-clipboard functionality. |

---

## 4. Smart Contract Interface

### 4.1 Contract ABI (Partial - Key Functions)

The contract at `0xC82E0CE02623972330164657e8C3e568d8f351FA` is an ERC-1155 token with 12 rarity tiers (token IDs 0 through 11). Below is the minimal ABI required for the frontend:

```json
[
  {
    "name": "mint",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "signature", "type": "bytes" }
    ],
    "outputs": []
  },
  {
    "name": "upgradeTokenTo",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "tokenId", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "account", "type": "address" },
      { "name": "id", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "name": "balanceOfBatch",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "accounts", "type": "address[]" },
      { "name": "ids", "type": "uint256[]" }
    ],
    "outputs": [
      { "name": "", "type": "uint256[]" }
    ]
  }
]
```

**Function Selectors (for indexer method decoding):**

| Function | Selector (4 bytes) |
|---|---|
| `mint(address,bytes)` | `0x8832e6e3` |
| `upgradeTokenTo(uint256)` | Compute via `keccak256("upgradeTokenTo(uint256)")[:4]` |

> Note: The exact function selectors should be verified against the deployed contract bytecode. The selectors above are computed from the canonical function signatures.

### 4.2 Chain Configuration

```
Network Name:       Somnia
Chain ID:           5031 (hex: 0x13A7)
RPC URL:            https://api.infra.mainnet.somnia.network/
Block Explorer:     https://explorer.somnia.network
Native Currency:
  Name:             SOMI
  Symbol:           SOMI
  Decimals:         18
```

**MetaMask `wallet_addEthereumChain` Params:**

```json
{
  "chainId": "0x13A7",
  "chainName": "Somnia",
  "nativeCurrency": {
    "name": "SOMI",
    "symbol": "SOMI",
    "decimals": 18
  },
  "rpcUrls": ["https://api.infra.mainnet.somnia.network/"],
  "blockExplorerUrls": ["https://explorer.somnia.network"]
}
```

**Alternative RPC Providers (for fallback or load balancing):**
- Ankr: `https://rpc.ankr.com/somnia`
- Public Node: `https://somnia.publicnode.com`
- Stakely: `https://somnia-json-rpc.stakely.io`

> Note: If the task is intended for the Somnia **Testnet (Shannon)**, use Chain ID `50312` (`0xC498`), RPC `https://dream-rpc.somnia.network/`, Explorer `https://shannon-explorer.somnia.network/`, and native currency `STT`. Verify which network the contract `0xC82E0CE02623972330164657e8C3e568d8f351FA` is deployed on and adjust accordingly.

### 4.3 Transaction Flows

#### Mint Flow

```
User clicks "Mint"
  |
  v
Is wallet connected?
  |-- No --> Prompt "Connect Wallet" --> eth_requestAccounts
  |-- Yes
  v
Is chain ID == 5031?
  |-- No --> Prompt "Switch Network" --> wallet_switchEthereumChain / wallet_addEthereumChain
  |-- Yes
  v
Set mintTx.status = 'pending'
  |
  v
Call contract.mint(connectedAddress, "0x")
  |
  v
Receive tx hash --> Set mintTx.hash = hash
  |
  v
Wait for tx receipt (1 confirmation)
  |
  +-- Success --> Set mintTx.status = 'confirmed'
  |               Show success toast with explorer link
  |               Refresh token balances
  |
  +-- Revert  --> Set mintTx.status = 'error'
  |               Show error toast with reason (if available)
  |
  +-- User rejected --> Set mintTx.status = 'error'
                        Show "Transaction rejected" toast
```

#### Upgrade Flow

```
User clicks "Upgrade to next rarity" on TokenCard[rarityId]
  |
  v
Is wallet connected? (same check as mint)
  |
  v
Is chain ID == 5031? (same check as mint)
  |
  v
Is balanceOf(connectedAddress, rarityId) >= 2?
  |-- No --> Button should already be disabled; show tooltip
  |-- Yes
  v
Set upgradeTx[rarityId].status = 'pending'
  |
  v
Call contract.upgradeTokenTo(rarityId)
  |
  v
Receive tx hash --> Set upgradeTx[rarityId].hash = hash
  |
  v
Wait for tx receipt (1 confirmation)
  |
  +-- Success --> Set upgradeTx[rarityId].status = 'confirmed'
  |               Show success toast with explorer link
  |               Refresh token balances (current rarity -2, next rarity +1)
  |
  +-- Revert  --> Set upgradeTx[rarityId].status = 'error'
  |               Show error toast with reason
  |
  +-- User rejected --> Set upgradeTx[rarityId].status = 'error'
                        Show "Transaction rejected" toast
```

---

## 5. Backend Specification

### 5.1 API Endpoints

All endpoints are prefixed with `/api`. Responses use JSON. All endpoints return appropriate HTTP status codes (`200` for success, `400` for bad request, `500` for server errors).

---

#### `GET /api/analytics/summary`

Returns aggregate statistics for all indexed transactions.

**Request:** No parameters.

**Response (200):**
```json
{
  "totalTxCount": 1523,
  "totalGasUsed": "45690000",
  "totalGasCost": "4569000000000000",
  "firstTxDate": "2025-10-15T08:30:00.000Z",
  "lastTxDate": "2026-02-10T14:22:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `totalTxCount` | `number` | Total number of indexed transactions |
| `totalGasUsed` | `string` | Sum of all gas used (as string to handle large numbers) |
| `totalGasCost` | `string` | Sum of `gasUsed * effectiveGasPrice` for all txs (in wei, as string) |
| `firstTxDate` | `string` | ISO-8601 timestamp of the earliest transaction |
| `lastTxDate` | `string` | ISO-8601 timestamp of the most recent transaction |

**Response (500):**
```json
{
  "error": "Internal server error"
}
```

---

#### `GET /api/analytics/daily?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns daily aggregated transaction data within a date range.

**Query Parameters:**

| Parameter | Required | Description | Default |
|---|---|---|---|
| `from` | No | Start date (inclusive) | 30 days ago |
| `to` | No | End date (inclusive) | Today |

**Validation:**
- `from` and `to` must be valid `YYYY-MM-DD` date strings.
- `from` must be <= `to`.
- Maximum range: 365 days.

**Response (200):**
```json
{
  "data": [
    { "date": "2026-02-01", "txCount": 42, "gasUsed": "1260000" },
    { "date": "2026-02-02", "txCount": 38, "gasUsed": "1140000" },
    { "date": "2026-02-03", "txCount": 55, "gasUsed": "1650000" }
  ]
}
```

**Response (400):**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD."
}
```

---

#### `GET /api/analytics/txs?limit=50&offset=0`

Returns a paginated list of individual transactions, ordered by block number descending (newest first).

**Query Parameters:**

| Parameter | Required | Description | Default |
|---|---|---|---|
| `limit` | No | Number of results per page | `50` |
| `offset` | No | Number of results to skip | `0` |

**Validation:**
- `limit` must be between 1 and 100.
- `offset` must be >= 0.

**Response (200):**
```json
{
  "data": [
    {
      "hash": "0xabc123...",
      "blockNumber": 1234567,
      "timestamp": "2026-02-10T14:22:00.000Z",
      "from": "0x1234...abcd",
      "to": "0xC82E...51FA",
      "method": "mint",
      "gasUsed": "30000",
      "effectiveGasPrice": "1000000000"
    }
  ],
  "total": 1523,
  "limit": 50,
  "offset": 0
}
```

| Field | Type | Description |
|---|---|---|
| `hash` | `string` | Transaction hash |
| `blockNumber` | `number` | Block number the tx was included in |
| `timestamp` | `string` | ISO-8601 block timestamp |
| `from` | `string` | Sender address (checksummed) |
| `to` | `string` | Recipient address (the contract) |
| `method` | `string` | Decoded method name: `"mint"`, `"upgradeTokenTo"`, or `"unknown"` |
| `gasUsed` | `string` | Gas units consumed (as string) |
| `effectiveGasPrice` | `string` | Gas price in wei (as string) |
| `total` | `number` | Total number of matching transactions |
| `limit` | `number` | Page size used |
| `offset` | `number` | Offset used |

**Response (400):**
```json
{
  "error": "Invalid pagination parameters."
}
```

---

### 5.2 Indexer Service

#### Purpose

The indexer service runs as a background process (either a standalone script or a worker within the backend server). It monitors the Somnia blockchain for transactions sent **to** the contract address `0xC82E0CE02623972330164657e8C3e568d8f351FA`, decodes the function called, and stores the transaction data in the database for the analytics API.

#### Polling Strategy

```
On startup:
  1. Read `last_indexed_block` from `indexer_state` table.
  2. If no record exists, use CONFIGURED_START_BLOCK (contract deployment block).
  3. Fetch current block number from RPC.
  4. Process blocks from (last_indexed_block + 1) to current block (initial sync).

Continuous loop:
  1. Sleep for POLL_INTERVAL seconds (default: 5 seconds).
  2. Fetch current block number from RPC.
  3. If current > last_indexed_block:
       Process blocks from (last_indexed_block + 1) to current.
  4. Update `last_indexed_block` in indexer_state.
```

#### Block Processing

For each block in range:
1. Fetch block with transactions (`eth_getBlockByNumber` with `true` for full tx objects).
2. Filter transactions where `tx.to` equals the contract address (case-insensitive comparison).
3. For each matching transaction:
   a. Fetch the transaction receipt (`eth_getTransactionReceipt`) to get `gasUsed` and `effectiveGasPrice`.
   b. Decode the method name from the first 4 bytes of `tx.input` (calldata).
   c. Insert into `transactions` table (skip duplicates via `UNIQUE` constraint on `hash`).
4. Update `last_indexed_block` to the current block.

#### Batch Processing

For initial sync (potentially thousands of blocks):
- Process in batches of 100 blocks to avoid memory issues.
- Use `Promise.all` with concurrency limit (e.g., 5 concurrent RPC calls) to speed up while respecting rate limits.
- Log progress every 100 blocks.

#### Method Decoding

```typescript
const METHOD_SELECTORS: Record<string, string> = {
  '0x8832e6e3': 'mint',           // mint(address,bytes)
  // Add computed selector for upgradeTokenTo(uint256)
};

function decodeMethod(calldata: string): string {
  if (!calldata || calldata.length < 10) return 'unknown';
  const selector = calldata.slice(0, 10).toLowerCase();
  return METHOD_SELECTORS[selector] || 'unknown';
}
```

> The exact function selectors should be verified by computing `keccak256` of the canonical function signatures or by inspecting the contract ABI.

#### Error Handling

- If an RPC call fails, retry up to 3 times with exponential backoff (1s, 2s, 4s).
- If a block fetch fails after retries, log the error and skip to the next poll cycle (do not advance `last_indexed_block`).
- If a transaction insert fails (non-duplicate error), log the error and continue processing remaining transactions.

---

## 6. Database Schema

### `transactions` table

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    hash                TEXT    UNIQUE NOT NULL,
    block_number        INTEGER NOT NULL,
    timestamp           DATETIME NOT NULL,
    from_address        TEXT    NOT NULL,
    to_address          TEXT    NOT NULL,
    method              TEXT,
    gas_used            TEXT    NOT NULL,
    effective_gas_price TEXT    NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(method);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
```

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Auto-incrementing primary key |
| `hash` | `TEXT UNIQUE NOT NULL` | Transaction hash (unique constraint prevents duplicate inserts) |
| `block_number` | `INTEGER NOT NULL` | Block number the transaction was included in |
| `timestamp` | `DATETIME NOT NULL` | Block timestamp (stored as ISO-8601 string) |
| `from_address` | `TEXT NOT NULL` | Sender address (checksummed) |
| `to_address` | `TEXT NOT NULL` | Recipient/contract address (checksummed) |
| `method` | `TEXT` | Decoded method name (`mint`, `upgradeTokenTo`, `unknown`, or `NULL` if decoding failed) |
| `gas_used` | `TEXT NOT NULL` | Gas units consumed (stored as string for large number safety) |
| `effective_gas_price` | `TEXT NOT NULL` | Effective gas price in wei (stored as string for large number safety) |
| `created_at` | `DATETIME` | Timestamp when the record was inserted into the database |

### `indexer_state` table

```sql
CREATE TABLE IF NOT EXISTS indexer_state (
    id                  INTEGER PRIMARY KEY CHECK (id = 1),
    last_indexed_block  INTEGER NOT NULL,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed with initial state (update START_BLOCK with the actual contract deployment block)
INSERT OR IGNORE INTO indexer_state (id, last_indexed_block) VALUES (1, 0);
```

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Always `1` (singleton row, enforced by CHECK constraint) |
| `last_indexed_block` | `INTEGER NOT NULL` | The last block number that the indexer has fully processed |
| `updated_at` | `DATETIME` | Timestamp of the last update to this row |

### Query Examples for API Endpoints

**Summary query:**
```sql
SELECT
    COUNT(*) as totalTxCount,
    COALESCE(SUM(CAST(gas_used AS INTEGER)), 0) as totalGasUsed,
    MIN(timestamp) as firstTxDate,
    MAX(timestamp) as lastTxDate
FROM transactions;
```

**Total gas cost (requires application-level BigInt math):**
```sql
SELECT gas_used, effective_gas_price FROM transactions;
-- Then compute SUM(gas_used * effective_gas_price) in application code using BigInt
```

**Daily aggregation query:**
```sql
SELECT
    DATE(timestamp) as date,
    COUNT(*) as txCount,
    SUM(CAST(gas_used AS INTEGER)) as gasUsed
FROM transactions
WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
GROUP BY DATE(timestamp)
ORDER BY date ASC;
```

**Paginated transactions query:**
```sql
SELECT hash, block_number, timestamp, from_address, to_address, method, gas_used, effective_gas_price
FROM transactions
ORDER BY block_number DESC
LIMIT ? OFFSET ?;

-- Total count for pagination:
SELECT COUNT(*) as total FROM transactions;
```

---

## 7. Authentication (Bonus)

### SIWE (Sign-In with Ethereum) Flow

This is an optional enhancement. If implemented, the flow works as follows:

```
1. User clicks "Sign In"
     |
     v
2. Frontend requests a nonce from backend
     GET /api/auth/nonce
     Response: { "nonce": "abc123..." }
     |
     v
3. Frontend constructs a SIWE message
     "Sign in to Intraverse with your Ethereum account:
      0x1234...abcd
      URI: https://app.example.com
      Nonce: abc123...
      Issued At: 2026-02-11T..."
     |
     v
4. User signs the message in MetaMask
     personal_sign(message, address)
     |
     v
5. Frontend sends signature to backend
     POST /api/auth/verify
     Body: { "message": "<SIWE message>", "signature": "0x..." }
     |
     v
6. Backend verifies the signature
     - Parses the SIWE message
     - Verifies the signature matches the claimed address
     - Validates nonce, domain, expiration
     |
     v
7. Backend issues a JWT or session cookie
     Response: { "token": "eyJhb..." }
     |
     v
8. Frontend stores token and includes it in subsequent API requests
     Authorization: Bearer eyJhb...
```

### API Endpoints for Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/nonce` | Generate and return a one-time nonce |
| `POST` | `/api/auth/verify` | Verify SIWE signature and issue JWT |
| `POST` | `/api/auth/logout` | Invalidate session (if using server-side sessions) |

### Protected Routes

If auth is implemented, the analytics endpoints can optionally be protected:
- Middleware checks for valid JWT in `Authorization` header.
- Returns `401 Unauthorized` if token is missing or invalid.
- Returns `403 Forbidden` if token is expired.

### Dependencies

- `siwe` - SIWE message parsing and verification
- `jsonwebtoken` - JWT creation and verification

---

## 8. Docker Configuration

### Project Structure

```
/
+-- docker-compose.yml
+-- frontend/
|   +-- Dockerfile
|   +-- package.json
|   +-- ...
+-- backend/
|   +-- Dockerfile
|   +-- package.json
|   +-- ...
```

### `frontend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### `backend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS}
      - NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
      - NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}
      - NEXT_PUBLIC_EXPLORER_URL=${NEXT_PUBLIC_EXPLORER_URL}
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL:-/app/data/intraverse.db}
      - INDEXED_WALLET_ADDRESS=${INDEXED_WALLET_ADDRESS}
      - RPC_URL=${RPC_URL}
      - PORT=3001
      - CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS}
      - START_BLOCK=${START_BLOCK:-0}
      - POLL_INTERVAL=${POLL_INTERVAL:-5000}
    volumes:
      - db-data:/app/data
    restart: unless-stopped

volumes:
  db-data:
    driver: local
```

---

## 9. Environment Variables

### `.env` (Root-Level, Used by Docker Compose)

```bash
# =============================================================================
# Shared / Contract Configuration
# =============================================================================
NEXT_PUBLIC_CONTRACT_ADDRESS=0xC82E0CE02623972330164657e8C3e568d8f351FA
NEXT_PUBLIC_CHAIN_ID=5031
NEXT_PUBLIC_RPC_URL=https://api.infra.mainnet.somnia.network/
NEXT_PUBLIC_EXPLORER_URL=https://explorer.somnia.network

# =============================================================================
# Backend Configuration
# =============================================================================
DATABASE_URL=/app/data/intraverse.db
INDEXED_WALLET_ADDRESS=<wallet address to index transactions for>
RPC_URL=https://api.infra.mainnet.somnia.network/
PORT=3001
CONTRACT_ADDRESS=0xC82E0CE02623972330164657e8C3e568d8f351FA
START_BLOCK=0
POLL_INTERVAL=5000

# =============================================================================
# Frontend Configuration
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3001

# =============================================================================
# Auth (Bonus - Optional)
# =============================================================================
JWT_SECRET=<a-strong-random-secret>
JWT_EXPIRY=24h
```

### Variable Descriptions

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | IntraverseProtocolContract address |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Somnia chain ID (`5031` for mainnet, `50312` for testnet) |
| `NEXT_PUBLIC_RPC_URL` | Yes | Public RPC URL for frontend wallet interactions |
| `NEXT_PUBLIC_EXPLORER_URL` | Yes | Block explorer base URL for linking transaction hashes |
| `DATABASE_URL` | Yes | Path to SQLite database file (or PostgreSQL connection string) |
| `INDEXED_WALLET_ADDRESS` | Yes | The wallet address whose transactions to/from the contract are indexed |
| `RPC_URL` | Yes | RPC URL for the backend indexer (can differ from public RPC for rate limit reasons) |
| `PORT` | No | Backend server port (default: `3001`) |
| `CONTRACT_ADDRESS` | Yes | Contract address for the indexer to monitor |
| `START_BLOCK` | No | Block number to start indexing from (default: `0`) |
| `POLL_INTERVAL` | No | Milliseconds between indexer poll cycles (default: `5000`) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL for frontend fetch calls |
| `JWT_SECRET` | Bonus | Secret key for signing JWTs (only if auth is implemented) |
| `JWT_EXPIRY` | Bonus | JWT expiration duration (default: `24h`) |

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Target:** Utility functions, pure logic, data transformations.

| Test Area | Examples |
|---|---|
| Method decoding | `decodeMethod('0x8832e6e3...') === 'mint'`; `decodeMethod('0x') === 'unknown'` |
| Gas cost calculation | `calculateGasCost('30000', '1000000000') === '30000000000000'` |
| Address formatting | `truncateAddress('0x1234567890abcdef...') === '0x1234...cdef'` |
| Date formatting | `formatDate('2026-02-11T14:22:00.000Z') === 'Feb 11, 2026'` |
| Pagination logic | `computeOffset(page=3, limit=50) === 100` |
| Input validation | `isValidDateRange('2026-01-01', '2026-02-01') === true` |

**Tools:** Jest or Vitest.

### 10.2 Integration Tests

**Target:** API endpoint behavior with a test database.

| Test Area | Examples |
|---|---|
| `GET /api/analytics/summary` | Returns correct totals; handles empty database; returns 200 |
| `GET /api/analytics/daily` | Filters by date range; handles missing params (defaults); validates date format returns 400 |
| `GET /api/analytics/txs` | Returns paginated results; respects limit/offset; returns correct total count |
| Indexer | Processes a mock block correctly; skips non-contract transactions; handles duplicate inserts gracefully |

**Tools:** Supertest (for HTTP assertions), in-memory SQLite database for test isolation.

**Setup:**
```typescript
beforeEach(async () => {
  // Create fresh in-memory SQLite database
  // Run schema migrations
  // Seed with test data
});

afterEach(async () => {
  // Close database connection
});
```

### 10.3 Frontend Tests

**Target:** Component rendering, user interactions, state management.

| Test Area | Examples |
|---|---|
| `WalletConnect` | Renders "Connect Wallet" when disconnected; shows address when connected |
| `NetworkSwitcher` | Visible when chain ID is wrong; hidden when correct |
| `TokenCard` | Shows correct balance; disables upgrade button when balance < 2 |
| `KPICards` | Displays loading skeleton; renders data after fetch |
| `TransactionsTable` | Renders rows correctly; pagination controls work |

**Tools:** React Testing Library, MSW (Mock Service Worker) for API mocking.

### 10.4 E2E Tests (Optional)

**Target:** Full user flows.

| Test Area | Examples |
|---|---|
| Mint flow | Connect wallet -> switch network -> mint -> see tx hash |
| Analytics | Navigate to /analytics -> see KPIs -> filter chart -> paginate table |

**Tools:** Playwright or Cypress with a local Hardhat/Anvil fork (if feasible with Somnia).

---

## 11. Non-Functional Requirements

### 11.1 Responsive Design

- **Mobile (< 768px):** Single-column layout. Token cards stack vertically. Navigation collapses to hamburger menu. Charts scale to full width. Table scrolls horizontally.
- **Tablet (768px - 1024px):** Two-column grid for token cards. Side navigation or top nav.
- **Desktop (> 1024px):** Three or four-column grid for token cards. Full navigation bar. Charts and tables at full width.

### 11.2 Accessibility

| Requirement | Implementation |
|---|---|
| Semantic HTML | Use `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` appropriately |
| ARIA labels | All interactive elements have descriptive `aria-label` or `aria-labelledby` |
| Keyboard navigation | All buttons and links are focusable and activatable via keyboard (Tab, Enter, Space) |
| Color contrast | WCAG AA minimum contrast ratio (4.5:1 for text, 3:1 for large text) |
| Screen reader | Transaction statuses announced via `aria-live` regions |
| Focus management | After modal close or toast dismiss, focus returns to triggering element |

### 11.3 Performance

| Requirement | Implementation |
|---|---|
| Code splitting | Lazy-load the `/analytics` route (`React.lazy` or Next.js dynamic imports) |
| Optimized re-renders | Use `React.memo`, `useMemo`, `useCallback` for expensive computations |
| Bundle size | Tree-shake unused imports. Monitor bundle with `@next/bundle-analyzer` |
| API caching | Cache analytics responses with appropriate `Cache-Control` headers or SWR/React Query stale times |
| Image optimization | Use `next/image` for any images. SVG for icons. |
| Database queries | Indexed columns for all WHERE/ORDER BY clauses (see schema indexes above) |
| RPC efficiency | Use `balanceOfBatch` instead of 12 individual `balanceOf` calls |

### 11.4 Security

| Requirement | Implementation |
|---|---|
| Input validation | Validate and sanitize all API query parameters (limit, offset, date formats) |
| SQL injection prevention | Use parameterized queries (never string concatenation for SQL) |
| CORS | Configure CORS to allow only the frontend origin |
| Rate limiting | Apply rate limiting to API endpoints (e.g., 100 requests/minute per IP) |
| Helmet headers | Use `helmet` middleware for security headers (CSP, X-Frame-Options, etc.) |
| Environment secrets | Never expose `JWT_SECRET` or backend `RPC_URL` to the frontend |
| Transaction safety | Never sign transactions on the backend; all signing happens in the user's wallet |

### 11.5 Error Resilience

| Requirement | Implementation |
|---|---|
| React Error Boundary | Wrap routes in `ErrorBoundary` to prevent full-app crashes |
| API error handling | All API calls wrapped in try/catch with user-friendly error messages |
| RPC fallback | If primary RPC fails, attempt fallback RPC provider |
| Indexer resilience | Indexer continues from last successful block after crash/restart |
| Graceful degradation | If analytics API is down, show error state; mint/manage route still works (it uses direct RPC) |

---

## Appendix A: Recommended Dependencies

### Frontend

| Package | Purpose |
|---|---|
| `next` | React framework with SSR/SSG, routing, API routes |
| `react`, `react-dom` | UI library |
| `typescript` | Type safety |
| `ethers` (v6) or `viem` + `wagmi` | Blockchain interaction |
| `@tanstack/react-query` or `swr` | Data fetching and caching |
| `recharts` or `chart.js` + `react-chartjs-2` | Charts for analytics |
| `tailwindcss` | Utility-first CSS framework |
| `react-hot-toast` or `sonner` | Toast notifications |
| `date-fns` | Date formatting and manipulation |

### Backend

| Package | Purpose |
|---|---|
| `express` | HTTP server (if not using Next.js API routes) |
| `better-sqlite3` or `pg` | Database driver |
| `ethers` (v6) or `viem` | RPC interaction for indexer |
| `cors` | CORS middleware |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `zod` | Input validation |
| `siwe` | SIWE message parsing (bonus) |
| `jsonwebtoken` | JWT handling (bonus) |

---

## Appendix B: File Structure (Recommended)

```
intraverse/
+-- docker-compose.yml
+-- .env.example
+-- README.md
+-- docs/
|   +-- SPECIFICATION.md
|
+-- frontend/
|   +-- Dockerfile
|   +-- package.json
|   +-- tsconfig.json
|   +-- tailwind.config.ts
|   +-- next.config.ts
|   +-- public/
|   +-- src/
|       +-- app/
|       |   +-- layout.tsx              # Root layout with nav
|       |   +-- page.tsx                # Route: / (Mint & Manage)
|       |   +-- analytics/
|       |       +-- page.tsx            # Route: /analytics
|       +-- components/
|       |   +-- wallet/
|       |   |   +-- WalletConnect.tsx
|       |   |   +-- NetworkSwitcher.tsx
|       |   +-- mint/
|       |   |   +-- MintButton.tsx
|       |   |   +-- TokenInventory.tsx
|       |   |   +-- TokenCard.tsx
|       |   |   +-- UpgradeButton.tsx
|       |   +-- analytics/
|       |   |   +-- KPICards.tsx
|       |   |   +-- DailyChart.tsx
|       |   |   +-- TransactionsTable.tsx
|       |   +-- shared/
|       |       +-- Layout.tsx
|       |       +-- ErrorBoundary.tsx
|       |       +-- Toast.tsx
|       |       +-- Skeleton.tsx
|       |       +-- Spinner.tsx
|       |       +-- AddressDisplay.tsx
|       +-- hooks/
|       |   +-- useWallet.ts
|       |   +-- useContract.ts
|       |   +-- useTokenBalances.ts
|       |   +-- useAnalytics.ts
|       +-- lib/
|       |   +-- contract.ts             # ABI, contract instance
|       |   +-- chain.ts               # Chain config, add/switch network
|       |   +-- utils.ts               # Formatting helpers
|       +-- types/
|           +-- index.ts               # Shared TypeScript types
|
+-- backend/
    +-- Dockerfile
    +-- package.json
    +-- tsconfig.json
    +-- src/
        +-- index.ts                    # Entry point, starts server + indexer
        +-- server.ts                   # Express app setup
        +-- routes/
        |   +-- analytics.ts            # Analytics API routes
        |   +-- auth.ts                 # Auth routes (bonus)
        +-- services/
        |   +-- indexer.ts              # Block indexer service
        |   +-- analytics.ts            # Analytics query service
        +-- db/
        |   +-- connection.ts           # Database connection
        |   +-- schema.ts              # Table creation / migrations
        |   +-- queries.ts             # Prepared SQL queries
        +-- utils/
        |   +-- decoder.ts             # Method selector decoder
        |   +-- validation.ts          # Input validation schemas
        +-- types/
            +-- index.ts               # Shared TypeScript types
```

---

*Document Version: 1.0*
*Created: 2026-02-11*
*Project: Intraverse FullStack Developer Task*
