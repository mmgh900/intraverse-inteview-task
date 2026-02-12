# Intraverse dApp

A full-stack decentralized application for minting and managing Moon Pass tokens on the Somnia blockchain.

## Technology Choices

### Frontend
- **Next.js 15** (App Router) — SSR-capable React framework with Turbopack for fast development
- **wagmi v2 + viem** — Type-safe Ethereum interactions; wagmi hooks for wallet/contract state
- **RainbowKit** — Drop-in wallet connection UI with multi-wallet support
- **TanStack React Query** — Server state management for API data fetching and caching
- **Tailwind CSS v4 + shadcn/ui** — Utility-first styling with accessible component primitives
- **Recharts** — Composable React charting for the analytics dashboard
- **sonner** — Toast notifications for transaction feedback

### Backend
- **Express.js** — Lightweight HTTP server for the analytics API
- **Drizzle ORM + PostgreSQL** — Type-safe database access with schema-as-code
- **viem** — Blockchain data fetching for the block indexer
- **Zod** — Runtime validation for API input parameters
- **pino** — Structured JSON logging

### Shared
- **TypeScript** — End-to-end type safety across all packages
- **npm workspaces** — Monorepo management with a shared package for ABI, addresses, and rarity config

### Infrastructure
- **Docker Compose** — One-command setup for all services (frontend, backend, PostgreSQL)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User (Browser)                     │
│               MetaMask + Chrome/Firefox               │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌───────────────────────────┐
│   Frontend (:3000)   │  │   Somnia Blockchain       │
│   Next.js + React    │──│   Smart Contract          │
│   RainbowKit + wagmi │  │   (mint, upgrade,         │
│                      │  │    balanceOfBatch)         │
└──────────┬───────────┘  └───────────────────────────┘
           │                          │
           ▼                          │
┌──────────────────────┐              │
│   Backend (:4000)    │◄─────────────┘
│   Express + Node.js  │  (Indexer reads blocks)
│   Analytics API      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   PostgreSQL (:5432) │
│   Transaction data   │
│   Analytics storage  │
└──────────────────────┘
```

- **Frontend** talks directly to the blockchain for minting, upgrading, and reading balances via wagmi/viem.
- **Frontend** also calls the Backend API for analytics data (summary stats, daily charts, transaction history).
- **Backend indexer** continuously polls the blockchain for new blocks and stores transactions involving the Moon Pass contract.
- **PostgreSQL** persists indexed transaction data for fast analytics queries.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MetaMask browser extension

### Option 1: Docker (recommended)

```bash
docker compose up --build
```

This starts all 3 services:
- Frontend at http://localhost:3000
- Backend API at http://localhost:4000
- PostgreSQL at localhost:5432

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL via Docker
docker compose up db -d

# Push database schema
npm run db:push -w packages/backend

# Start backend (port 4000)
npm run dev:backend

# Start frontend (port 3000) — in another terminal
npm run dev:frontend
```

## Project Structure

```
intraverse-dapp/
├── packages/
│   ├── frontend/          # Next.js app (pages, components, hooks)
│   ├── backend/           # Express API + blockchain indexer
│   └── shared/            # ABI, contract config, rarity definitions
├── docs/
│   └── guide.html         # User guide (Farsi)
├── docker-compose.yml     # Multi-service orchestration
├── package.json           # Workspace root
└── tsconfig.base.json     # Shared TypeScript config
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/analytics/summary?wallet=0x...` | Wallet summary: total txs, gas spent, first/last tx dates |
| GET | `/api/analytics/daily?wallet=0x...` | Daily transaction counts for charting |
| GET | `/api/analytics/txs?wallet=0x...&page=1&limit=20` | Paginated transaction history |

## Environment Variables

### Frontend (`packages/frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_USE_TESTNET` | Use testnet instead of mainnet | `false` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

### Backend (`packages/backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `RPC_URL` | Somnia RPC endpoint | `https://api.infra.mainnet.somnia.network/` |
| `CONTRACT_ADDRESS` | Moon Pass contract address | `0xC82E0CE02623972330164657e8C3e568d8f351FA` |
| `INDEXED_WALLET_ADDRESS` | Wallet to index (empty = all) | — |
| `POLL_INTERVAL` | Indexer poll interval (ms) | `5000` |
| `START_BLOCK` | Block to start indexing from | `0` |
| `PORT` | Server port | `4000` |

## License

This project was built for the Intraverse hackathon.
