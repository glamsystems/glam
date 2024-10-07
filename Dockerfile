FROM ubuntu:22.04

WORKDIR /mnt/workspace

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash && \
    apt-get install -y nodejs && \
    npm install -g pnpm@9.1.2

COPY . ./

ENV PORT=8080
RUN pnpm install && pnpm run pg-build

CMD ["pnpm", "pg-start-docker"]
