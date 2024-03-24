# GLAM *.+

The BlackRock For Solana.

GLAM is a decentralized protocol for asset management on Solana.

## Dev

This project is generated with the [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp) generator using React preset.

### Prerequisites

- Node v20.11.0 or higher
- Pnpm v8.15.1 or higher
- Rust v1.75.0 or higher
- Anchor CLI 0.29.0 or higher
- Solana CLI 1.17.0 or higher

Recommended:
```sh -c "$(curl -sSfL https://release.solana.com/v1.17.22/install)"```

### Installation

```shell
git clone ...
cd glam

pnpm install
```

Get `keypairs.zip` and unpack it into `./anchor/target/deploy`.

### Run the tests

```shell
cd anchor
anchor build
# ^ this will create target/deploy
cd target/deploy
unzip /path/to/keypairs.zip
cd -
anchor test
```

This should also work:

```shell
pnpm run anchor-test
```

### Start the web app

```shell
pnpm run dev
```
