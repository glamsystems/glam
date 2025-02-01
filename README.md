![GLAM Tests](https://github.com/glamsystems/glam/actions/workflows/post_commit_anchor_test.yml/badge.svg)

 <picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_light_small_left.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_dark_small_left.svg">
  <img alt="GLAM *.+ The New Standard for Asset Management." src="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_dark_small_left.svg">
</picture>

## Onchain Asset Management on Solana

GLAM is a platform for deploying institutional-grade investment products on Solana. Through programmable vaults and mints, GLAM provides infrastructure for onchain operations with fine-grained acccess controls.

### Quick Links

- [Developer Documentation](https://docs.glam.systems)
- [TypeScript SDK](https://www.npmjs.com/package/@glamsystems/glam-sdk)
- [CLI Reference](https://github.com/glamsystems/glam/tree/main/cli#readme)
- [Graphical User Interface](https://gui.glam.systems)

## Development Setup

### Prerequisites

- Node v20.11.0 or higher
- Pnpm v9.1.2 or higher
- Rust v1.75.0 or higher
- Anchor CLI 0.30.1
- Solana CLI 1.18.23

Install Solana CLI (recommended):
```shell
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.5/install)"
```

### Installation

```shell
git clone https://github.com/glamsystems/glam.git
cd glam
pnpm install
```

### Testing

Build and run the test suite:

```shell
pnpm run anchor-build
pnpm run anchor-test
```

### Local Development

Start the development server:

```shell
pnpm run dev
```

## SDK Usage Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { GlamClient, WSOL } from "@glamsystems/glam-sdk";
import { PublicKey } from "@solana/web3.js";

const glamClient = new GlamClient();
const statePda = new PublicKey("FMHLPaEeCbuivqsAfHrr28FpWJ9oKHTx3jzFbb3tYhq4");

async function main() {
  const vaultPda = glamClient.getVaultPda(statePda);
  const vaultWsolBalance = await glamClient.getVaultTokenBalance(statePda, WSOL);
  
  // Wrap 0.1 SOL
  const txSig = await glamClient.wsol.wrap(statePda, new anchor.BN(100_000_000));
  
  // Check updated balance
  const vaultWsolBalanceAfter = await glamClient.getVaultTokenBalance(statePda, WSOL);
}
```

For detailed API documentation and advanced usage examples, visit our [Developer Documentation](https://docs.glam.systems).
