# GLAM CLI

A convenient way of interacting with the GLAM program.

- [Build](#build)
- [Configure](#configure)
- [Docker](#docker)
- [Usage](#usage)
  - [General Commands](#general-commands)
  - [Managing Products](#managing-products)
  - [Delegate Management](#delegate-management)
  - [Integration Management](#integration-management)
  - [Token Operations](#token-operations)
  - [Liquid Staking](#liquid-staking)
  - [Jupiter (JUP) Staking](#jupiter-jup-staking)

## Build

Clone https://github.com/glamsystems/glam/, enter the repo and run:

```bash
pnpm install && pnpm run cli-build
```

## Configure

The CLI expects a configuration file at `~/.config/glam/config.json`. The file should contain the following content:

```json
{
  "cluster": "",
  "json_rpc_url": "",
  "keypair_path": "",
  "priority_fee": {
    "micro_lamports": 0,
    "level": "",
    "helius_api_key": ""
  },
  "glam_state": ""
}
```

Here's a quick explanation of each field:

- `cluster`: Value must be one of `mainnet-beta`, `devnet`, or `localnet`.
- `json_rpc_url`: The URL of your preferred Solana JSON RPC endpoint.
- `keypair_path`: Path to your keypair JSON file.
- `priority_fee`:
  - `micro_lamports`: Optional (defaults to 0). If provided, `level` and `helius_api_key` will be ignored.
  - `level`: Optional (defaults to `Min`). Only applied if cluster is `mainnet-beta`. Other options are `Min`, `Medium`, `High`, `VeryHigh`, `UnsafeMax`, `Default` (more info can be found [here](https://docs.helius.dev/solana-apis/priority-fee-api)).
  - `helius_api_key`: Optional. Only applied if cluster is `mainnet-beta`. If not provided `level` will be ignored. The API key is needed to fetch the priority fee estimate from Helius.
- `glam_state`: Optional. If you want to set a default active GLAM state, you can do so here. Alternatively, you can use the `set` command to set the active GLAM state later on.

## Run the CLI

```bash
node dist/cli/main.js -h
```

To run the CLI in development mode:

```bash
npx nx run cli:dev -- --args="command [options]"
```

## Docker

### Build docker image

From the root of the repo:

```bash
docker build -f ./cli/Dockerfile -t glam-cli .
```

This builds a docker image and tags it as `glam-cli`.

We have a pre-built docker image available at https://github.com/glamsystems/glam/pkgs/container/glam-cli. To pull the latest image, run:

```bash
docker pull ghcr.io/glamsystems/glam-cli
```

### Run the CLI in docker container

The docker image doesn't come with a configuration file or a keypair. Instead, you'll need to provide them to the container by mounting a volume from a host directory to the container's `/workspace` directory.

Create a local directory (for example, `$HOME/.glam-cli-docker`) and place both the configuration file and keypair into it. Assuming your keypair filename is `keypair.json`, the directory and the config file should look like the following:

```bash
$ ls $HOME/.glam-cli-docker
config.json  keypair.json

$ cat $HOME/.glam-cli-docker/config.json
{
  "cluster": "mainnet-beta",
  "json_rpc_url": "[redacted]",
  "keypair_path": "/workspace/keypair.json",
  "priority_fee": {
    "level": "Min",
    "helius_api_key": "[redacted]"
  },
  "glam_state": "[redacted]"
}
```

To start the container and get the cli ready to use:

```bash
docker run -it --rm -v $HOME/.glam-cli-docker:/workspace glam-cli bash
```

Replace `glam-cli` with `ghcr.io/glamsystems/glam-cli` if using the pre-built docker image.

Example usage:

```bash
$ docker run -it --rm -v $HOME/.glam-cli-docker:/workspace glam-cli bash

root@af07b0e1891d:/mnt/glam# node dist/cli/main.js env
Wallet connected: [redacted]
RPC endpoint: [redacted]
Priority fee: {
  level: 'Min',
  helius_api_key: '[redacted]'
}
```

## Usage

### General Commands

- **View Environment Setup**:

  ```bash
  glam-cli env
  ```

- **Set Active GLAM Product**:

  ```bash
  glam-cli set <state>
  ```

- **View a GLAM Product**:

  - `--compact`: if set the output will be a compact json blob
  - `state`: if not set the current active GLAM product will be used

  ```bash
  glam-cli view [--compact] [state]
  ```

### Managing Products

- **List Products**:

  - By default only products the wallet has access to (either as owner or delegate) will be listed
  - `--owner-only`: if set only products owned by the wallet will be listed
  - `--all`: if set all products will be listed

  ```bash
  glam-cli list [--owner-only] [--all]
  ```

- **Create a New Product**:

  - See the `templates/` directory for available templates

  ```bash
  glam-cli create <path-to-json>
  ```

- **Close a Product**:

  - `state`: if not set the current active GLAM product will be used
  - `--yes`: if set, no confirmation prompt will be shown

  ```bash
  glam-cli close [state] [--yes]
  ```

### Delegate Management

- **List Delegates**:

  ```bash
  glam-cli delegate list
  ```

- **Set Delegate Permissions**:

  - `pubkey`: Public key of the delegate
  - `permissions...`: A space-separated list of permissions. Available permissions can be found in `anchor/programs/glam/src/state/acl.rs`

  ```bash
  glam-cli delegate set <pubkey> <permissions...>
  ```

- **Revoke Delegate Permissions**:
  ```bash
  glam-cli delegate delete <pubkey>
  ```

### Integration Management

- **List Enabled Integrations**:

  ```bash
  glam-cli integration list
  ```

- **Enable an Integration**:

  - `integration`: Name of the integration. Available integrations can be found in `anchor/programs/glam/src/state/acl.rs`

  ```bash
  glam-cli integration enable <integration>
  ```

- **Disable an Integration**:

  - `integration`: Name of the integration. Available integrations can be found in `anchor/programs/glam/src/state/acl.rs`

  ```bash
  glam-cli integration disable <integration>
  ```

### Token Operations

- **View Balances**:

  - `--all`: if set all token accounts will be listed, including those with zero balances

  ```bash
  glam-cli balances [--all]
  ```

- **Wrap SOL**:

  ```bash
  glam-cli wrap <amount>
  ```

- **Unwrap wSOL**:

  - Unwraps all wSOL into SOL

  ```bash
  glam-cli unwrap
  ```

- **Swap Tokens**:

  - `from`: Source token mint
  - `to`: Destination token mint
  - `amount`: Amount to swap
  - `--max-accounts`: Specify max accounts allowed
  - `--slippage-bps`: Specify slippage bps
  - `--only-direct-routes`: Direct routes only if set

  ```bash
  glam-cli swap <from> <to> <amount> [--max-accounts <num>] [--slippage-bps <bps>] [--only-direct-routes]
  ```

- **Withdraw from Vault**:

  - `asset`: Asset (token mint) to withdraw
  - `amount`: Amount to withdraw
  - `--yes`: Skip confirmation prompt

  ```bash
  glam-cli withdraw <asset> <amount> [--yes]
  ```

### Liquid Staking

- **Stake into a Stake Pool**:

  ```bash
  glam-cli lst stake <stakepool> <amount>
  ```

- **Unstake Tokens**:

  - Unstakes from a stake pool and gets tokens into a stake account (or a marinade ticket if asset is mSOL)
  - `asset`: Asset (pool token mint) to unstake

  ```bash
  glam-cli lst unstake <asset> <amount>
  ```

- **List Stake Accounts**:

  ```bash
  glam-cli lst list
  ```

- **Withdraw Stake Accounts**:

  - Withdraws SOL from stake accounts
  - `accounts...`: A space-separated list of stake account pubkeys

  ```bash
  glam-cli lst withdraw <accounts...>
  ```

- **Manage Marinade Tickets**:

  - List Tickets:

    ```bash
    glam-cli lst marinade-list
    ```

  - Claim Tickets:
    ```bash
    glam-cli lst marinade-claim <tickets...>
    ```

### Jupiter (JUP) Staking

- **Stake JUP Tokens**:

  ```bash
  glam-cli jup stake <amount>
  ```

- **Unstake JUP Tokens**:

  - Unstakes all JUP

  ```bash
  glam-cli jup unstake
  ```

- **Vote on Proposals**:
  ```bash
  glam-cli vote <proposal> <side>
  ```
