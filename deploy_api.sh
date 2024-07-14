#!/bin/bash

set -e

if [[ ! -d api/ || ! -d anchor/ ]]; then
  echo "Error: must run this script from the root of the project!"
  exit 1
fi

TARGET="dev"
if [[ $1 == "--prod" || $1 == "-p" ]]; then
  TARGET="prod"
fi

DIST=dist/api

rm -rf $DIST

pnpm install
pnpm run api-build

cp api/app.yaml $DIST/app.yaml
cp api/.puppeteerrc.cjs $DIST/.puppeteerrc.cjs
cp api/.env.yaml $DIST/.env.yaml
# cp pnpm-lock.yaml $DIST/pnpm-lock.yaml

jq '.scripts +={"gcp-build": "npx puppeteer browsers install chrome"} +{"start": "node main.js"}' package.json  > $DIST/tmp_package.json

# Delete unnecessary dependencies for the api to speed up the deploy and reduce the size of build artifact
deps_to_remove=(
  "@hookform/resolvers"
  "@solana-developers/preset-react"
  "@solana/wallet-adapter-base"
  "@solana/wallet-adapter-react-ui"
  "@solana/wallet-adapter-wallets"
  "@solana/wallet-adapter-solflare"
  "@wallet-standard/react-core"
  "@radix-ui/react-checkbox"
  "@radix-ui/react-dialog"
  "@radix-ui/react-dropdown-menu"
  "@radix-ui/react-icons"
  "@radix-ui/react-label"
  "@radix-ui/react-popover"
  "@radix-ui/react-radio-group"
  "@radix-ui/react-select"
  "@radix-ui/react-separator"
  "@radix-ui/react-slot"
  "@radix-ui/react-switch"
  "@radix-ui/react-toast"
  "@radix-ui/react-toggle"
  "@radix-ui/react-toggle-group"
  "@swc/helpers"
  "@tailwindcss/typography"
  "@tanstack/react-query"
  "@tanstack/react-table"
  "react"
  "react-dom"
  "react-hook-form"
  "react-hot-toast"
  "react-router-dom"
  "react-day-picker"
  "tailwind-merge"
  "tailwindcss-animate"
  "zod"
  "lucide-react"
  "next"
  "next-themes"
  "d3"
  "d3-cloud"
  "d3-sankey"
)
jq_command=". | del(.devDependencies)"
# Build the jq command to delete each key in the list
for key in "${deps_to_remove[@]}"; do
  jq_command+=" | del(.dependencies[\"$key\"])"
done
jq "$jq_command" $DIST/tmp_package.json > $DIST/package.json

rm $DIST/tmp_package.json
cd $DIST

if [ $TARGET == "dev" ]; then
  echo "" >> app.yaml
  echo "service: dev" >> app.yaml
  echo "" >> app.yaml
fi

gcloud app deploy --project glam-api-419002
