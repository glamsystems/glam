# GLAM CLI

A convenient way of interacting with the GLAM program.

# Build

Enter the glam repo directory and run:

```
pnpm install && npx nx build cli
```

Invoke the cli by

```
node dist/cli/main.js -h
```

# Setup

The CLI expects a configuration file (config.json) in ~/.config/glam/cli/ with details like json_rpc_url, keypair_path, and fund address (optional, can be set later on).

```
{
  "json_rpc_url": "https://mainnet.helius-rpc.com/?api-key=<api-key>",
  "keypair_path": "/path/to/keypair.json"
}
```

# Commands

- env

  - Description: Displays the environment setup.

- funds

  - Description: Lists funds accessible by the connected wallet.
  - Options:
    - -m, --manager-only: Lists only funds with full manager access.
    - -a, --all: Lists all GLAM funds.

- fund
  - Description: Manages a specific fund. All fund subcommands require the fund to be set as active using `fund set <fund>`.
  - Subcommands
    - set \<fund>
    - create \<fund>
    - close \<fund>
    - wrap \<amount>
    - unwrap
    - blances
      - Options
        - -a, --all: Includes token accounts with zero balances
    - swap \<from> \<to> \<amount>
      - Description: Jupiter swap. `from` and `to` should be token mints.
      - Options
        - -m, --max-accounts \<num>: Limits the maximum number of accounts.
        - -s, --slippage-bps \<bps>: Sets allowable slippage basis points.
        - -d, --only-direct-routes: Limits to direct swap routes.
      - Examples:
        - `node dist/cli/main.js fund swap -d -m 20 So11111111111111111111111111111111111111112 jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v 0.2`
    - delegate get
    - delegate set \<pubkey> \<permissions>
      - Examples
        - `node dist/cli/main.js fund delegate set <pubkey> jupiterSwapFundAssets,wSolWrap,wSolUnwrap`
    - integration get
    - integration enable \<integ>
      - Examples
        - `node dist/cli/main.js fund integration enable jupiter`
    - integration disable \<integ>
      - Examples
        - `node dist/cli/main.js fund integration disable drift`
