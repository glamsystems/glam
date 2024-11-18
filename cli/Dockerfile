FROM node:20-slim 

WORKDIR /mnt/workspace

COPY . ./

RUN mkdir -p /root/.config/glam/cli/ && mv config.json /root/.config/glam/cli/
RUN mv keypair.json /root/

RUN corepack enable pnpm
RUN pnpm install && npx nx build cli
