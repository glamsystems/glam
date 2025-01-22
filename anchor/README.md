# GLAM SDK

A TypeScript SDK for interacting with the GLAM Protocol.

## Installation

```bash
npm i @glamsystems/glam-sdk
```

## Getting Started

- [GLAM docs](https://docs.glam.systems)
- [TypeScript API docs](#)

## Examples

### Set up a GLAM client and interact with a vault

```ts
import * as anchor from "@coral-xyz/anchor";
import { GlamClient, WSOL } from "@glamsystems/glam-sdk";
import { PublicKey } from "@solana/web3.js";

// Need to set ANCHOR_PROVIDER_URL and ANCHOR_WALLET env variables
// ANCHOR_PROVIDER_URL=...
// ANCHOR_WALLET=...
const glamClient = new GlamClient();
const statePda = new PublicKey("FMHLPaEeCbuivqsAfHrr28FpWJ9oKHTx3jzFbb3tYhq4");

async function main() {
  const vaultPda = glamClient.getVaultPda(statePda);

  console.log("statePda:", statePda.toBase58());
  console.log("vaultPda:", vaultPda.toBase58());

  const vaultWsolBalance = await glamClient.getVaultTokenBalance(statePda, WSOL);
  console.log("vaultWsolBalance:", vaultWsolBalance.toString());

  // Wrap 0.1 SOL
  const txSig = await glamClient.wsol.wrap(statePda, new anchor.BN(100_000_000));
  console.log("txSig:", txSig);

  // wSOL balance after wrap should increase by 0.1 SOL
  const vaultWsolBalanceAfter = await glamClient.getVaultTokenBalance(statePda, WSOL);
  console.log("vaultWsolBalanceAfter:", vaultWsolBalanceAfter.toString());
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
```
