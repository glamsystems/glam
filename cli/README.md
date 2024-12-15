# GLAM CLI

A convenient way of interacting with the GLAM program.

# Build

Clone https://github.com/glamsystems/glam/, enter the repo directory and run:

```
pnpm install && npx nx build cli
```

Invoke the cli by

```
node dist/cli/main.js -h
```

# Setup

The CLI expects a configuration file at `~/.config/glam/cli/config.json` with keys `helius_api_key`, `keypair_path`, and `fund` (optional, can be set later on).

```
{
  "helius_api_key": "<your-api-key>",
  "keypair_path": "/path/to/keypair.json",
  "fund": "optional_fund_pubkey"
}
```

## Docker build

The image should have wallet keypair at `/root/keypair.json` and CLI config at `/root/.config/glam/cli/config.json`.

Make sure `keypair.json` and `config.json` are available in the root dir of the repo before running docker build.

**The produced image will have keypair in it. NEVER distribute it or upload to a remote image repository.**

```
docker build -f ./cli/Dockerfile -t glam-cli .
```

# Commands

- env

  - Description: Displays the environment setup.
  - Example: `node dist/cli/main.js env`

- funds (WIP)

  - Description: Lists funds accessible by the connected wallet.
  - Options:
    - -m, --manager-only: Lists only funds with full manager access.
    - -a, --all: Lists all GLAM funds.

- fund

  - Description: Manages a specific fund. All fund subcommands require the fund to be set as active using `fund set <pubkey>`.
  - Subcommands

    - set \<pubkey>
      - Description: Sets active fund.
      - Example: `node dist/cli/main.js fund set <pubkey>`
    - create \<json>
      - Description: Creates new fund using input from a json file. A few templates are available in `templates/`.
      - Example: `node dist/cli/main.js fund create <json>`
    - close \<pubkey>
      - Description: Closes a fund with the given pubkey.
      - Example: `node dist/cli/main.js fund close <pubkey>`
    - wrap \<amount>
      - Description: Wraps SOL into wSOL.
      - Example: `node dist/cli/main.js fund wrap 0.1`
    - unwrap
      - Description: Unwraps all wSOL into SOL.
      - Example: `node dist/cli/main.js fund unwrap`
    - balances
      - Description: Displays asset balances within the fund.
      - Options
        - -a, --all: Includes token accounts with zero balances
      - Example: `node dist/cli/main.js fund balances -a`
    - swap \<from> \<to> \<amount>
      - Description: Jupiter swap. `from` and `to` should be token mints.
      - Options
        - -m, --max-accounts \<num>: Limits the maximum number of accounts.
        - -s, --slippage-bps \<bps>: Sets allowable slippage basis points.
        - -d, --only-direct-routes: Limits to direct swap routes.
      - Examples:
        - `node dist/cli/main.js fund swap -d -m 20 So11111111111111111111111111111111111111112 jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v 0.2`
    - delegate get
      - Description: Displays all delegates on the active fund.
      - Example: `node dist/cli/main.js fund delegate get`
    - delegate set \<pubkey> \<permissions>
      - Description: Grants fund permissions to a delegate.
      - Examples
        - `node dist/cli/main.js fund delegate set <pubkey> jupiterSwapFundAssets,wSolWrap,wSolUnwrap`
        - `node dist/cli/main.js fund delegate set <pubkey> driftDeposit,driftWithdraw,DriftPlaceOrders`
    - integration get
      - Description: Displays all enabled integrations.
      - Example: `node dist/cli/main.js fund integration get`
    - integration enable \<integ>
      - Description: Enables an integration.
      - Examples
        - `node dist/cli/main.js fund integration enable jupiter`
        - `node dist/cli/main.js fund integration enable drift`
    - integration disable \<integ>
      - Description: Disables an integration.
      - Examples
        - `node dist/cli/main.js fund integration disable jupiter`
        - `node dist/cli/main.js fund integration disable drift`
