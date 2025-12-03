# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Next.js app located in ./another1 with standalone output

FROM node:18-alpine AS builder
WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable

# Copy the Next.js app sources (only the subproject)
COPY another1/ ./

# Install dependencies and build
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm run build

# --- Runtime image ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Easypanel expects port 80 for web services usually
ENV PORT=80

# Copy standalone build and assets keeping expected paths
# Note: We are copying to /app because that's where we'll run from
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy the new deploy script
COPY --from=builder /app/deploy-production.js ./deploy-production.js

# Expose port 80
EXPOSE 80

# Start using the new deploy script which handles env vars and paths correctly
CMD ["node", "deploy-production.js"]