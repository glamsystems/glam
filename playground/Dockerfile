FROM node:20-slim AS base

# Builder stage
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./
RUN corepack enable pnpm
RUN pnpm install && pnpm run pg-build

# Final stage (runtime image)
FROM node:20-slim AS runtime
WORKDIR /app

COPY --from=builder /mnt/workspace/playground /app
RUN npm install next@14.2.10
CMD ["npx", "next", "start", "-p", "8080"]
