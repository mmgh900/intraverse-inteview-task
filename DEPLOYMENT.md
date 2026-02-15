# Deployment Guide

## Production Deployment

### Prerequisites
- Docker & Docker Compose installed
- Access to a PostgreSQL database (or use the included Docker service)
- Somnia RPC endpoint access

### Environment Setup

1. **Create environment file**:
```bash
cp .env.example .env
```

2. **Configure for production**:
```env
# Use mainnet
NEXT_PUBLIC_USE_TESTNET=false
RPC_URL=https://api.infra.mainnet.somnia.network/

# Set your indexer wallet (or leave empty to index all transactions)
INDEXED_WALLET_ADDRESS=0xYourWalletAddressHere

# Production database
DATABASE_URL=postgresql://user:password@host:5432/intraverse

# Set your API URL (update after deployment)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Docker Deployment

#### Full Stack (Frontend + Backend + Database)
```bash
docker compose up -d --build
```

Check logs:
```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

#### Frontend Only (if backend is deployed separately)
```bash
docker build -t intraverse-frontend -f packages/frontend/Dockerfile packages/frontend
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-backend-url.com \
  -e NEXT_PUBLIC_USE_TESTNET=false \
  intraverse-frontend
```

#### Backend Only (if database is external)
```bash
docker build -t intraverse-backend -f packages/backend/Dockerfile packages/backend
docker run -p 4000:4000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e RPC_URL=https://api.infra.mainnet.somnia.network/ \
  -e INDEXED_WALLET_ADDRESS=0xYourAddress \
  intraverse-backend
```

### Platform-Specific Deployments

#### Vercel (Frontend)
1. Connect your GitHub repo to Vercel
2. Set build command: `npm run build -w packages/frontend`
3. Set output directory: `packages/frontend/.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → your backend URL
   - `NEXT_PUBLIC_USE_TESTNET` → `false`

#### Railway / Render / Fly.io (Backend)
1. Use `packages/backend/Dockerfile`
2. Set environment variables (see above)
3. Ensure PostgreSQL service is running and accessible
4. Set start command: `node dist/index.js`

#### Managed PostgreSQL (Neon, Supabase, PlanetScale)
1. Create a PostgreSQL database
2. Get connection string
3. Update `DATABASE_URL` in backend environment
4. Run migrations:
```bash
npm run db:push -w packages/backend
```

### Database Migrations

The indexer will auto-create tables via Drizzle on first run. To manually manage schema:

```bash
# Generate migration
npm run db:generate -w packages/backend

# Apply migration
npm run db:migrate -w packages/backend

# Push schema directly (dev only)
npm run db:push -w packages/backend
```

### Monitoring

#### Health Check
```bash
curl http://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T..."
}
```

#### Indexer Status
Check backend logs for:
```
Indexer started
Processing blocks 0-100...
Indexed block 12345, found 3 transactions
```

#### WebSocket Connection
Open browser console on frontend and check for:
```
WebSocket connected
```

### Troubleshooting

#### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in `packages/backend/src/api/server.ts`
- Ensure backend is publicly accessible

#### Indexer not syncing
- Check RPC_URL is accessible: `curl $RPC_URL`
- Verify contract address is correct
- Check PostgreSQL connection
- Look for errors in backend logs

#### Transactions not appearing in analytics
- Wait ~10 seconds for indexer to catch up (default POLL_INTERVAL=5000ms)
- Check if INDEXED_WALLET_ADDRESS filter is too restrictive
- Verify transactions are actually to the contract address

#### WebSocket not connecting
- Ensure backend WebSocket server is running
- Check firewall/proxy allows WebSocket connections
- Verify frontend WS URL matches backend (http→ws, https→wss)

### Performance Tuning

#### Backend
- Increase `POLL_INTERVAL` to reduce RPC calls (e.g., 10000 for 10 seconds)
- Add database indexes for frequently queried fields
- Enable connection pooling for PostgreSQL

#### Frontend
- Adjust React Query `staleTime` in `useAnalytics.ts` hooks
- Enable Next.js image optimization for card assets
- Configure CDN for static assets

### Security Checklist

- [ ] Remove any hardcoded private keys or sensitive data
- [ ] Set strong PostgreSQL password
- [ ] Enable SSL for PostgreSQL connections (`?sslmode=require`)
- [ ] Configure rate limiting on API endpoints
- [ ] Set proper CORS origins (not `*` in production)
- [ ] Review and limit API permissions
- [ ] Enable HTTPS for all services
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies

### Backup & Recovery

#### Database Backup
```bash
# Backup
docker compose exec db pg_dump -U postgres intraverse > backup.sql

# Restore
docker compose exec -T db psql -U postgres intraverse < backup.sql
```

#### Re-indexing from Scratch
```bash
# Stop backend
docker compose stop backend

# Clear database
docker compose exec db psql -U postgres -c "TRUNCATE transactions, indexer_state CASCADE;"

# Restart backend (will re-index from START_BLOCK)
docker compose start backend
```

### Scaling

For high-traffic scenarios:
1. **Horizontal scaling**: Run multiple backend instances behind a load balancer
2. **Database optimization**: Add read replicas for analytics queries
3. **Caching**: Add Redis for frequently accessed analytics data
4. **CDN**: Serve frontend static assets via CDN
5. **Separate indexer**: Run indexer as a dedicated service separate from API server
