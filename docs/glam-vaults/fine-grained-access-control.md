# Fine-Grained Access Control

## Delegate Permissions

| Permission Enum       | Description                                  |
| --------------------- | -------------------------------------------- |
| DriftInitialize       | Initialize and add a Drift user              |
| DriftUpdateUser       | Update a drift user                          |
| DriftDeleteUser       | Delete a drift user                          |
| DriftDeposit          | Deposit to Drift                             |
| DriftWithdraw         | Withdraw from Drift                          |
| DriftPlaceOrders      | Place orders                                 |
| DriftCancelOrders     | Cancel orders                                |
| DriftPerpMarket       | Trade on perp markets                        |
| DriftSpotMarket       | Trade on spot markets                        |
| Stake                 | Stake to LSTs                                |
| Unstake               | Unstake from LSTs                            |
| LiquidUnstake         | Liquid unstake from LSTs                     |
| JupiterSwapFundAssets | Swap allowed assets on Jupiter (recommended) |
| JupiterSwapAnyAsset   | Swap any assets on Jupiter (dangerous)       |
| WSolWrap              | Wrap SOL to wSOL                             |
| WSolUnwrap            | Unwrap wSOL to SOL                           |
| StakeJup              | Stake JUP                                    |
| UnstakeJup            | Unstake JUP                                  |
| VoteOnProposal        | Vote on Jupiter DAO proposals                |

## Integrations Allowlist

| Integration Enum | Description        |
| ---------------- | ------------------ |
| Drift            | Drift              |
| SplStakePool     | SPL stake pool     |
| SanctumStakePool | Sanctum stake pool |
| NativeStaking    | Native staking     |
| Marinade         | Marinade staking   |
| Jupiter          | Jupiter swap       |
| JupiterVote      | Jupiter DAO        |

