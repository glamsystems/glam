#!/bin/bash

set -e

PROGRAM_KEYPAIR=/path/to/program-keypair.json
SOLANA=/path/to/solana
PRIORITY_FEE=10000
MAX_ATTEMPTS=1000
PROGRAM_ID=GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc

build() {
    anchor build -- --features mainnet
}

deploy() {
    cmd=$(cat <<EOF
$SOLANA program deploy anchor/target/deploy/glam.so \
--program-id $PROGRAM_KEYPAIR \
--use-rpc \
--with-compute-unit-price $PRIORITY_FEE \
--max-sign-attempts $MAX_ATTEMPTS
EOF
)

    default_choice="N"
    echo "🔴️ You're about to deploy the program to mainnet! Double check the command below:"
    echo
    echo $cmd
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

if [ -d "anchor" ] && [ -f "package.json" ]; then
    echo "✅ Appears to be in the root of the glam repo: $PWD"
else
    echo "❌ Must run this script from the root of the project!" && exit 1
fi

# anchor build will remove program id from the idl file, we need to restore it
(cd anchor && build)

size_kb=$(ls -lh anchor/target/deploy/glam.so | awk '{print $5}')
size_bytes=$(ls -l anchor/target/deploy/glam.so | awk '{print $5}')
echo "==== Program size ===="
echo "glam.so: $size_kb ($size_bytes bytes)"
echo "======================"

deploy

