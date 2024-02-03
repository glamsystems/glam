# GLAM *.+

The BlackRock For Solana.

GLAM is a decentralized protocol for asset management on Solana.

## Dev

This project is generated with the [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp) generator.

### Prerequisites

- Node v20.11.0 or higher
- Pnpm v8.15.1 or higher
- Rust v1.75.0 or higher
- Anchor CLI 0.29.0 or higher
- Solana CLI 1.17.0 or higher

### Installation

```shell
git clone ...
cd glam

pnpm run install
```

### Start the web app

```shell
pnpm run dev
```

## Anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the command with `npm run`, eg: `npm run anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program.

You will manually need to update the constant in `anchor/lib/counter-exports.ts` to match the new program id.

```shell
pnpm run anchor keys sync
```

#### Build the program:

```shell
pnpm run anchor-build
```

#### Start the test validator with the program deployed:

```shell
pnpm run anchor-localnet
```

#### Run the tests

```shell
pnpm run anchor-test
```

#### Deploy to Devnet

```shell
pnpm run anchor deploy --provider.cluster devnet
```
