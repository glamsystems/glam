FROM node:20-slim AS base

# Builder stage
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./
RUN npm install -g pnpm@9.15.4
RUN pnpm install && pnpm install --filter @glamsystems/glam-sdk && npx nx reset && npx nx run cli:build

# Final stage (runtime image)
FROM node:20-slim AS runtime
WORKDIR /mnt/glam

ENV DOCKER=1
COPY --from=builder /mnt/workspace/node_modules /mnt/glam/node_modules
COPY --from=builder /mnt/workspace/dist /mnt/glam/dist
COPY --from=builder /mnt/workspace/dist/cli/main.js /mnt/glam/glam-cli.js