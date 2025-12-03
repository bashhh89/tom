# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Next.js app located in ./another1 with standalone output

FROM node:18-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY another1/ ./

ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY --from=builder /app/.next/standalone /app/.next/standalone
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public
COPY --from=builder /app/start-production.js /app/start-production.js

EXPOSE 80

CMD ["node", "start-production.js"]

