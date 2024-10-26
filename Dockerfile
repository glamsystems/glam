FROM node:20-slim AS base

# BUILDER
FROM base AS builder
WORKDIR /mnt/workspace

COPY . ./

RUN corepack enable pnpm
RUN pnpm install && pnpm run pg-build

ENV PORT=8080
CMD ["pnpm", "pg-start-docker"]
