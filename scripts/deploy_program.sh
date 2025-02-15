#!/bin/bash

set -e

PROGRAM_KEYPAIR=${PROGRAM_KEYPAIR:-/path/to/program-keypair.json}
PROGRAM_ID=
SOLANA=${SOLANA:-solana}
PRIORITY_FEE=${PRIORITY_FEE:-10000}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-1000}
AUTHORITY_PUBKEY=gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff
MAX_LEN=

# Check if network argument is provided
if [ $# -ne 1 ] || [[ ! "$1" =~ ^(devnet|mainnet-beta)$ ]]; then
    echo "Usage: $0 <devnet|mainnet-beta>"
    exit 1
fi

CLUSTER=$1
case $CLUSTER in
    devnet) PROGRAM_ID=Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc;;
    mainnet-beta) PROGRAM_ID=GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc;;
esac

build() {
    case $CLUSTER in
        devnet) anchor test;;
        mainnet-beta) anchor build -- --features mainnet;;
    esac
}

deploy_idl() {
    rpc=$($SOLANA config get | grep "RPC URL:" | awk -F': ' '{print $2}')
    cat anchor/target/idl/glam.json | jq -c > /tmp/glam-compact.json
    cmd=(anchor idl upgrade $PROGRAM_ID
         --filepath /tmp/glam-compact.json
         --provider.cluster $rpc)

    default_choice="N"
    echo "🔴️ You're about to deploy the IDL to $CLUSTER! Double check the command below:"
    echo
    echo "${cmd[@]}"
    echo
    read -p "Continue (Y/N)? [$default_choice] " choice
    choice="${choice:-$default_choice}"

    case "$choice" in
        y | Y) 
            (cd anchor && "${cmd[@]}")
            ;;
        n | N) 
            echo "Aborted"
            ;;
        *) 
            echo "Invalid input: $choice"
            ;;
    esac
}

deploy_program() {
    cmd=($SOLANA program deploy anchor/target/deploy/glam.so
            --program-id $PROGRAM_KEYPAIR
            --use-rpc
            --with-compute-unit-price $PRIORITY_FEE
            --max-sign-attempts $MAX_ATTEMPTS
            --max-len $MAX_LEN)

    default_choice="N"
    echo "🔴️ You're about to deploy the program to $CLUSTER! Double check the command below:"
    echo
    echo
    echo "${cmd[@]}"
    echo
    read -p "Continue (Y/N)? [$default_choice] " choice
    choice="${choice:-$default_choice}"

    case "$choice" in
        y | Y) 
            $cmd
            ;;
        n | N) 
            echo "Aborted"
            ;;
        *) 
            echo "Invalid input: $choice"
            ;;
    esac
}


if [ -n "$SOLANA" ] && [ -f "$SOLANA" ]; then
    echo "✅ Found solana binary: $SOLANA"
else
    which solana > /dev/null || (echo "❌ Missing solana binary" && exit 1)
    SOLANA=$(which solana)
    echo "✅ Use solana binary at $SOLANA"
fi

$SOLANA address -k $PROGRAM_KEYPAIR &> /dev/null || (echo "❌ Missing program keypair" && exit 1)
if [ $($SOLANA address -k $PROGRAM_KEYPAIR) == $PROGRAM_ID ]; then
    echo "✅ Program keypair : $PROGRAM_KEYPAIR"
    echo "✅ Program ID validated: $PROGRAM_ID"
else
    echo "❌ Program keypair is incorrect" && exit 1
fi

if [ $($SOLANA address) == $AUTHORITY_PUBKEY ]; then
    echo "✅ Authority keypair validated: $AUTHORITY_PUBKEY"
else
    echo "❌ Authority keypair is incorrect" && exit 1
fi

if [ -d "anchor" ] && [ -f "package.json" ]; then
    echo "✅ Appears to be in the root of the glam repo: $PWD"
else
    echo "❌ Must run this script from the root of the project!" && exit 1
fi

# anchor build will remove program id from the idl file, we need to restore it
(cd anchor && build)

size_kb=$(ls -lh anchor/target/deploy/glam.so | awk '{print $5}')
size_bytes=$(ls -l anchor/target/deploy/glam.so | awk '{print $5}')
MAX_LEN=$size_bytes
echo "==== Program size ===="
echo "glam.so: $size_kb ($size_bytes bytes)"
echo "======================"

deploy_program

deploy_idl