# GLAM CLI

A convenient way of interacting with the GLAM program.

## Build

Clone https://github.com/glamsystems/glam/, enter the repo and run:

```
pnpm install && pnpm run cli-build
```

## config.json

The CLI expects a configuration file at `~/.config/glam/cli/config.json` by default.

```
{
  "helius_api_key": "<your-helius-api-key>",
  "keypair_path": "/path/to/keypair.json",
  "priority_fee_level": "Low",
  "fund": "optional_base58_fund_pubkey"
}
```

`priority_fee_level`: optional. Default value is "Low". Other options are "Min", "Medium", "High", "VeryHigh", "UnsafeMax", "Default" (more info can be found [here](https://docs.helius.dev/solana-apis/priority-fee-api)).

`fund`: optional. If provided, the CLI will use this fund as the active fund. Active fund can be set using `fund set <pubkey>` command later on.

## Run the CLI

```
node dist/cli/main.js -h
```

# Docker

## Build docker image

Run the following command from the root of the repo:

```
docker build -f ./cli/Dockerfile -t glam-cli .
```

This builds a docker image and tags it as `glam-cli`.

We have a pre-built docker image available at https://github.com/glamsystems/glam/pkgs/container/glam-cli. To pull the latest image, run:

```
docker pull ghcr.io/glamsystems/glam-cli
```

## Run the CLI in docker container

The docker image doesn't come with a configuration file or the keypair. They needed be provided to the container by mounting a volume from a local directory to the container's `/workspace` directory.

Create a local directory (for example, `$HOME/.glam-cli-docker`) and drop both the configuration file and keypair into it. Assuming the keypair filename is `keypair.json`, the configuration file should look like:

```
$ ls $HOME/.glam-cli-docker
config.json  keypair.json

$ cat $HOME/.glam-cli-docker/config.json
{
  "helius_api_key": "[redacted]",
  "keypair_path": "/workspace/keypair.json",
  "priority_fee_level": "Low",
  "fund": "[redacted]"
}
```

Run the following command to start the container and get the cli ready to use:

```
docker run -it --rm -v $HOME/.glam-cli-docker:/workspace glam-cli bash
```

Replace `glam-cli` with `ghcr.io/glamsystems/glam-cli` if using the pre-built docker image.

Example usage:

```
$ docker run -it --rm -v $HOME/.glam-cli-docker:/workspace glam-cli bash

root@af07b0e1891d:/mnt/glam# node dist/cli/main.js env

Wallet connected: [redacted]
RPC endpoint: https://mainnet.helius-rpc.com/?api-key=[redacted]
Priority fee level: Low
Active fund: [redacted]
Vault: [redacted]
```

# Available Commands

- env

  - Description: Displays the environment setup.
  - Example: `node dist/cli/main.js env`

- funds

  - Description: Lists funds accessible by the connected wallet.
  - Options (-m not supported yet):
    - -m, --manager-only: Lists only funds with full manager access.
    - -a, --all: Lists all GLAM funds.

- fund

  - Description: Manages a specific fund. All fund subcommands require an active fund that can be set using `fund set <pubkey>`.
  - Subcommands

    - set \<pubkey>

      - Description: Sets active fund.
      - Example: `node dist/cli/main.js fund set <pubkey>`

    - create \<json>

      - Description: Creates a new fund from a json file. A few templates are available in `templates/`.
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
        - `node dist/cli/main.js fund swap -s 50 -m 20 So11111111111111111111111111111111111111112 jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v 0.2`

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
