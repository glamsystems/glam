FROM node:20-slim AS base

# Builder stage
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./
RUN npm install -g pnpm@9.15.4
RUN pnpm install && pnpm install --filter @glamsystems/glam-sdk && pnpm run gui-build

# Final stage (runtime image)
FROM node:20-slim AS runtime
WORKDIR /app

COPY --from=builder /mnt/workspace/gui /app
RUN npm install next@15.0.3
CMD ["npx", "next", "start", "-p", "8080"]
