FROM node:20-slim AS base

# Builder stage
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./
RUN npm install -g pnpm@9.15.4
RUN pnpm install && cd apps/fatcat && pnpm install
RUN cd apps/fatcat && pnpm run build

# Final stage (runtime image)
FROM node:20-slim AS runtime
WORKDIR /app

COPY --from=builder /mnt/workspace/apps/fatcat /app
CMD ["npx", "next", "start", "-p", "8080"]
