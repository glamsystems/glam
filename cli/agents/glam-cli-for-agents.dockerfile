FROM node:20-slim 

WORKDIR /mnt/glam

COPY . ./

RUN mkdir -p /root/.config/glam/cli/ 
COPY cli/agents/coding/config.json /root/.config/glam/cli/
COPY cli/agents/coding/agent-keypair.json /root/agent-keypair.json

RUN corepack enable pnpm
RUN pnpm install && npx nx build cli
