FROM node:20-slim AS base

# Builder stage
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./
RUN corepack enable pnpm
RUN pnpm install && npx nx reset && npx nx build cli

# Final stage (runtime image)
FROM node:20-slim AS runtime
WORKDIR /mnt/glam

ENV DOCKER=1
COPY --from=builder /mnt/workspace/node_modules /mnt/glam/node_modules
COPY --from=builder /mnt/workspace/dist /mnt/glam/dist
