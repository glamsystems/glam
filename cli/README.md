# GLAM CLI

A convenient way of interacting with the GLAM program.

## Installation

```bash
npm install -g @glamsystems/glam-cli
```

After installation, you can use the CLI with the `glam-cli` command.

## Configure

The CLI expects a configuration file at `~/.config/glam/config.json`. The file should contain the following content:

```json
{
  "cluster": "",
  "json_rpc_url": "",
  "tx_rpc_url": "",
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
- `tx_rpc_url`: Optional. If not set it will default to `json_rpc_url`. Use this to specify a separate RPC endpoint you want to use for sending transactions.
- `keypair_path`: Path to your keypair JSON file.
- `priority_fee`:
  - `micro_lamports`: Optional (defaults to 0). If provided, `level` and `helius_api_key` will be ignored.
  - `level`: Optional (defaults to `Min`). Only applied if cluster is `mainnet-beta`. Other options are `Min`, `Medium`, `High`, `VeryHigh`, `UnsafeMax`, `Default` (more info can be found [here](https://docs.helius.dev/solana-apis/priority-fee-api)).
  - `helius_api_key`: Optional. Only applied if cluster is `mainnet-beta`. If not provided `level` will be ignored. The API key is needed to fetch the priority fee estimate from Helius.
- `glam_state`: Optional. If you want to set a default active GLAM state, you can do so here. Alternatively, you can use the `set` command to set the active GLAM state later on.

## Commands

Run `glam-cli --help` to see all available commands. Here are the main command categories:

### General Commands

- `glam-cli env` - Show environment setup
- `glam-cli list` - List GLAM products the wallet has access to
  - `-o, --owner-only` - Only list products the wallet owns
  - `-a, --all` - List all GLAM products

### Product Management

- `glam-cli view [state]` - View a GLAM product by its state pubkey
  - `-c, --compact` - Compact output
- `glam-cli set <state>` - Set active GLAM product
- `glam-cli create <path>` - Create a new GLAM product from a JSON file
- `glam-cli close [state]` - Close a GLAM product
  - `-y, --yes` - Skip confirmation prompt
- `glam-cli update-owner <new-owner-pubkey>` - Update the owner of a GLAM product (**dangerous! may lead to loss of assets if you don't control the new owner wallet**)
  - `-y, --yes` - Skip confirmation prompt
- `glam-cli withdraw <asset> <amount>` - Withdraw asset (mint address) from the vault
  - `-y, --yes` - Skip confirmation prompt

### Delegate Management

- `glam-cli delegate list` - List delegates and permissions
- `glam-cli delegate set <pubkey> <permissions...>` - Set delegate permissions
- `glam-cli delegate delete <pubkey>` - Revoke all delegate permissions for a pubkey

### Integration Management

- `glam-cli integration list` - List all enabled integrations
- `glam-cli integration enable <name>` - Enable an integration
- `glam-cli integration disable <name>` - Disable an integration

### Token Operations

- `glam-cli swap <from> <to> <amount>` - Swap assets held in the vault
  - `-m, --max-accounts <num>` - Specify max accounts allowed
  - `-s, --slippage-bps <bps>` - Specify slippage bps
  - `-d, --only-direct-routes` - Direct routes only

### Liquid Staking

- `glam-cli lst stake <stakepool> <amount>` - Stake `<amount>` SOL into `<stakepool>`
- `glam-cli lst unstake <asset> <amount>` - Unstake `<amount>` worth of `<asset>` (mint address)
- `glam-cli lst list` - List all stake accounts
- `glam-cli lst withdraw <accounts...>` - Withdraw staking accounts (space-separated pubkeys)
- `glam-cli lst marinade-list` - List all Marinade tickets
- `glam-cli lst marinade-claim <tickets...>` - Claim Marinade tickets (space-separated)

### Jupiter (JUP) Staking

- `glam-cli jup stake <amount>` - Stake JUP tokens
- `glam-cli jup unstake` - Unstake all JUP tokens
- `glam-cli jup withdraw` - Withdraw all unstaked JUP

### Governance

- `glam-cli vote <proposal> <side>` - Vote on a proposal

## Development

### Build from Source

Clone https://github.com/glamsystems/glam/, enter the repo and run:

```bash
pnpm install && pnpm run cli-build
```

### Run in Development Mode

```bash
npx nx run cli:dev -- --args="command [options]"
```

## Docker Support

### Build Docker Image

From the root of the repo:

```bash
docker build -f ./cli/Dockerfile -t glam-cli .
```

We have a pre-built docker image available at https://github.com/glamsystems/glam/pkgs/container/glam-cli. To pull the latest image:

```bash
docker pull ghcr.io/glamsystems/glam-cli
```

### Run in Docker Container

Mount your configuration directory to the container's `/workspace`:

```bash
docker run -v $HOME/.glam-cli-docker:/workspace glam-cli [command] [options]
```

The mounted directory should contain:

- `config.json` - CLI configuration file
- `keypair.json` - Your Solana keypair file

Example config for Docker:

```json
{
  "cluster": "mainnet-beta",
  "json_rpc_url": "[your-rpc-url]",
  "keypair_path": "/workspace/keypair.json",
  "priority_fee": {
    "micro_lamports": 0
  }
}
```
