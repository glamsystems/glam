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
cp pnpm-lock.yaml $DIST/pnpm-lock.yaml
jq '.scripts +{"gcp-build": ""} +{"start": "node main.js"}' package.json  > $DIST/package.json

cd $DIST

if [ $TARGET == "dev" ]; then
  echo "" >> app.yaml
  echo "service: dev" >> app.yaml
  echo "" >> app.yaml
fi

gcloud app deploy --project glam-api-419002
