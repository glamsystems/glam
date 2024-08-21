#!/bin/bash

set -e

PROGRAM_KEYPAIR=~/solana-keypairs/glam/glam-keypair-GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP.json
SOLANA=~/code/agave/target/debug/solana
PRIORITY_FEE=50000
MAX_ATTEMPTS=1000

build() {
    anchor build -- --features mainnet
}

deploy() {
    $SOLANA program deploy anchor/target/deploy/glam.so \
    --program-id $PROGRAM_KEYPAIR \
    --use-rpc \
    --with-compute-unit-price $PRIORITY_FEE \
    --max-sign-attempts $MAX_ATTEMPTS
}

if [ -f $SOLANA ]; then
    echo "✅ Found solana binary: $SOLANA"
else
    which solana > /dev/null || (echo "❌ Missing solana binary" && exit 1)
    SOLANA=$(which solana)
    echo "✅ Use solana binary at $SOLANA"
fi

$SOLANA address -k $PROGRAM_KEYPAIR >> /dev/null || (echo "❌ Missing program keypair" && exit 1)
if [ $($SOLANA address -k $PROGRAM_KEYPAIR) == "GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP" ]; then
    echo "✅ Program keypair is correct: $PROGRAM_KEYPAIR"
else
    echo "❌ Program keypair is incorrect" && exit 1
fi

if [ -d "anchor" ] && [ -f "package.json" ]; then
    echo "✅ Appears to be in the root of the glam repo: $PWD"
else
    echo "❌ Must run this script from the root of the project!" && exit 1
fi

# anchor build will remove program id from the idl file, we need to restore it
(cd anchor && build) && git checkout anchor/target/idl/glam.json

# Uncomment the following line to deploy the program
# deploy
