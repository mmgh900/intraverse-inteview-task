FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
RUN npm ci --workspace=packages/shared --workspace=packages/backend --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

RUN npm -w packages/shared run build
RUN npm -w packages/backend run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@intraverse/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@intraverse/shared/

EXPOSE 4000

CMD ["node", "dist/index.js"]
