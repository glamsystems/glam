<p align="center">
 <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_dark.svg">
    <img alt="GLAM *.+ The New Standard for Asset Management." src="https://raw.githubusercontent.com/glamsystems/brand_assets/main/github/github_banner_dark.svg">
  </picture>
<br>
    <a href="https://glam.systems" target="_blank">Website</a> |
    <a href="mailto:dev@glam.systems" target="_blank">Contact</a> |
    <a href="https://x.com/glamsystems" target="_blank">X</a>
    <br>
    <br>
    <br>
</p>

---

<br>

GLAM is a decentralized on-chain asset management protocol on Solana that enables efficient management & operations of investment products, empowering investors to have greater control & equity in their financial futures.

## Dev

This project was generated with the [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp) generator using React preset.

### Prerequisites

- Node v20.11.0 or higher
- Pnpm v8.15.1 or higher
- Rust v1.75.0 or higher
- Anchor CLI 0.29.0 or higher
- Solana CLI 1.18.7

Recommended:

```shell
sh -c "$(curl -sSfL https://release.solana.com/v1.18.7/install)"
```

### Installation

```shell
git clone ...
cd glam

pnpm install
```

(Internal team only: get `keypairs.zip` and unpack it into `./anchor/target/deploy`)

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
pnpm run anchor-build
pnpm run anchor-test
```

### Start the web app

```shell
pnpm run dev
```

### Start the api server

```shell
pnpm run api-serve
```
