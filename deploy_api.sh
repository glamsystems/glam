#!/bin/bash

set -e

TARGET="dev"
if [[ $1 == "--prod" || $1 == "-p" ]]; then
  TARGET="prod"
fi

DIST=dist/api

rm -rf $DIST

pnpm install
pnpm run api-build

cp api/app.yaml $DIST/app.yaml
# cp pnpm-lock.yaml $DIST/pnpm-lock.yaml

jq '.scripts +={"gcp-build": ""} +{"start": "node main.js"}' package.json  > $DIST/tmp_package.json

# Delete unnecessary dependencies for the api to speed up the deploy and reduce the size of build artifact
deps_to_remove=(
  "@carbon/charts-react"
  "@carbon/colors"
  "@carbon/icons-react"
  "@carbon/react"
  "@carbon/styles"
  "@carbon/type"
  "@ibm/plex"
  "@hookform/resolvers"
  "@solana-developers/helpers"
  "@solana-developers/preset-react"
  "@swc/helpers"
  "@tabler/icons-react"
  "@tailwindcss/typography"
  "@tanstack/react-query"
  "carbon-components"
  "carbon-components-react"
  "carbon-icons"
  "daisyui"
  "react"
  "react-dom"
  "react-hook-form"
  "react-hot-toast"
  "react-router-dom"
  "use-dark-mode"
  "zod"
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
