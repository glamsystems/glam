/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/glam.json`.
 */
export type Glam = {
  "address": "GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc",
  "metadata": {
    "name": "glam",
    "version": "0.4.0",
    "spec": "0.1.0",
    "description": "Glam Protocol"
  },
  "instructions": [
    {
      "name": "addShareClass",
      "docs": [
        "Share class",
        "Adds a new share class to a fund.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_metadata`: An instance of `ShareClassModel` containing the metadata for the new share class.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        34,
        49,
        47,
        6,
        204,
        166,
        51,
        204
      ],
      "accounts": [
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ]
          }
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "openfundsMetadata",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassMetadata",
          "type": {
            "defined": {
              "name": "shareClassModel"
            }
          }
        }
      ]
    },
    {
      "name": "burnShare",
      "docs": [
        "Burns a specified amount of shares for the given share class.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to burn shares for.",
        "- `amount`: The amount of shares to burn.",
        "",
        "# Permission required",
        "- Permission::BurnShare",
        "",
        "# Integration required",
        "- Integration::Mint"
      ],
      "discriminator": [
        111,
        41,
        160,
        233,
        46,
        233,
        79,
        62
      ],
      "accounts": [
        {
          "name": "fromAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "from"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "from"
        },
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "castVote",
      "docs": [
        "Casts a vote.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `side`: The side to vote for.",
        "",
        "# Permission required",
        "- Permission::VoteOnProposal",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "locker"
        },
        {
          "name": "escrow"
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "vote",
          "writable": true
        },
        {
          "name": "governor"
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "governanceProgram",
          "address": "GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY"
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeShareClass",
      "docs": [
        "Closes a share class and releases its resources.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to be closed.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        35,
        248,
        168,
        150,
        244,
        251,
        61,
        91
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ]
          }
        },
        {
          "name": "metadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeState",
      "docs": [
        "Closes a state account and releases its resources.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        25,
        1,
        184,
        101,
        200,
        245,
        210,
        246
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeTokenAccounts",
      "docs": [
        "Closes token accounts owned by the vault.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        199,
        170,
        37,
        55,
        63,
        183,
        235,
        143
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "deactivateStakeAccounts",
      "docs": [
        "Deactivates stake accounts.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        58,
        18,
        6,
        22,
        226,
        216,
        161,
        193
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "driftCancelOrders",
      "docs": [
        "Cancels drift orders.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `market_type`:",
        "- `market_index`:",
        "- `direction`:",
        "",
        "# Permission required",
        "- Permission::DriftCancelOrders",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        98,
        107,
        48,
        79,
        97,
        60,
        99,
        58
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketType",
          "type": {
            "option": {
              "defined": {
                "name": "marketType"
              }
            }
          }
        },
        {
          "name": "marketIndex",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "direction",
          "type": {
            "option": {
              "defined": {
                "name": "positionDirection"
              }
            }
          }
        }
      ]
    },
    {
      "name": "driftDeleteUser",
      "docs": [
        "Deletes a drift user (sub account).",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::DriftDeleteUser",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        179,
        118,
        20,
        212,
        145,
        146,
        49,
        130
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "driftDeposit",
      "docs": [
        "Deposits to drift.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `market_index`: Index of the drift spot market.",
        "- `amount`: Amount of asset to deposit.",
        "",
        "# Permission required",
        "- Permission::DriftDeposit",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        252,
        63,
        250,
        201,
        98,
        55,
        130,
        12
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "vaultAta",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketIndex",
          "type": "u16"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "driftInitialize",
      "docs": [
        "drift",
        "Initializes a drift account owned by vault and creates a subaccount.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::DriftInitialize",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        21,
        21,
        69,
        55,
        41,
        129,
        44,
        198
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "driftPlaceOrders",
      "docs": [
        "Places orders on drift.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `order_params`: A list of orders.",
        "",
        "# Permissions required",
        "- Permission::DriftPlaceOrders",
        "- Additional permission Permission::DriftSpotMarket or Permission::DriftPerpMarket is required depending on market type.",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        117,
        18,
        210,
        6,
        238,
        174,
        135,
        167
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "orderParams",
          "type": {
            "vec": {
              "defined": {
                "name": "orderParams"
              }
            }
          }
        }
      ]
    },
    {
      "name": "driftUpdateUserCustomMarginRatio",
      "docs": [
        "Updates custom margin ratio.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `sub_account_id`: Sub account.",
        "- `margin_ratio`: Margin ratio.",
        "",
        "# Permission required",
        "- Permission::DriftUpdateUser",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        4,
        47,
        193,
        177,
        128,
        62,
        228,
        14
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        }
      ],
      "args": [
        {
          "name": "subAccountId",
          "type": "u16"
        },
        {
          "name": "marginRatio",
          "type": "u32"
        }
      ]
    },
    {
      "name": "driftUpdateUserDelegate",
      "docs": [
        "Sets a delegate on the specified sub account.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `sub_account_id`: Sub account.",
        "- `delegate`: Delegate's wallet address.",
        "",
        "# Permission required",
        "- Permission::DriftUpdateUser",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        36,
        181,
        34,
        31,
        22,
        77,
        36,
        154
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        }
      ],
      "args": [
        {
          "name": "subAccountId",
          "type": "u16"
        },
        {
          "name": "delegate",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "driftUpdateUserMarginTradingEnabled",
      "docs": [
        "Enables/Disables margin trading.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `sub_account_id`: Sub account.",
        "- `margin_trading_enabled`: Whether to enable or disable margin trading.",
        "",
        "# Permission required",
        "- Permission::DriftUpdateUser",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        157,
        175,
        12,
        19,
        202,
        114,
        17,
        36
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        }
      ],
      "args": [
        {
          "name": "subAccountId",
          "type": "u16"
        },
        {
          "name": "marginTradingEnabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "driftWithdraw",
      "docs": [
        "Withdraws from drift.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `market_index`: Index of the drift spot market.",
        "- `amount`: Amount to withdraw.",
        "",
        "# Permission required",
        "- Permission::DriftWithdraw",
        "",
        "# Integration required",
        "- Integration::Drift"
      ],
      "discriminator": [
        86,
        59,
        186,
        123,
        183,
        181,
        234,
        137
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "driftState",
          "writable": true
        },
        {
          "name": "driftSigner"
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultAta",
          "writable": true
        },
        {
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketIndex",
          "type": "u16"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "forceTransferShare",
      "docs": [
        "Forcefully transfers a specified amount of shares from one account to another.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to transfer shares for.",
        "- `amount`: The amount of shares to transfer.",
        "",
        "# Permission required",
        "- Permission::ForceTransferShare",
        "",
        "# Integration required",
        "- Integration::Mint"
      ],
      "discriminator": [
        71,
        90,
        36,
        42,
        220,
        208,
        46,
        19
      ],
      "accounts": [
        {
          "name": "fromAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "from"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "toAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "to"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "from"
        },
        {
          "name": "to"
        },
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "increaseLockedAmount",
      "docs": [
        "Increases the locked amount (aka stakes JUP).",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount of JUP to stake.",
        "",
        "# Permission required",
        "- Permission::StakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        5,
        168,
        118,
        53,
        72,
        46,
        203,
        146
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrowJupAta",
          "writable": true
        },
        {
          "name": "vaultJupAta",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLockedVoterEscrow",
      "docs": [
        "Initializes a locked voter escrow.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::StakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        148,
        74,
        247,
        66,
        206,
        51,
        119,
        243
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeAndDelegateStake",
      "docs": [
        "Initializes a stake account and delegates it to a validator.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `lamports`: The amount of SOL to initialize the stake account with.",
        "- `stake_account_id`: The ID of the stake account to initialize.",
        "- `stake_account_bump`: The bump seed for the stake account.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        71,
        101,
        230,
        157,
        50,
        23,
        47,
        1
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultStakeAccount",
          "writable": true
        },
        {
          "name": "vote"
        },
        {
          "name": "stakeConfig"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "stakeHistory",
          "address": "SysvarStakeHistory1111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "stakeAccountId",
          "type": "string"
        },
        {
          "name": "stakeAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeState",
      "docs": [
        "State",
        "Initializes a state account from the provided StateModel instance.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `fund`: An instance of `StateModel` containing the details of the state to be initialized.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        190,
        171,
        224,
        219,
        217,
        72,
        199,
        176
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "arg",
                "path": "state_model.created"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "openfundsMetadata",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "stateModel"
            }
          }
        }
      ]
    },
    {
      "name": "jupiterSwap",
      "docs": [
        "Swaps assets using Jupiter.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount of asset to swap.",
        "- `data`: The data for the swap.",
        "",
        "# Permission required",
        "- Any of",
        "- Permission::JupiterSwapAny: no restrictions.",
        "- Permission::JupiterSwapAllowlisted: input and output are in the assets allowlist.",
        "- Permission::JupiterSwapLst: input and output assets are both LST.",
        "",
        "# Integration required",
        "- Integration::JupiterSwap"
      ],
      "discriminator": [
        116,
        207,
        0,
        196,
        252,
        120,
        243,
        18
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "inputVaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "inputTokenProgram"
              },
              {
                "kind": "account",
                "path": "inputMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "outputVaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "outputTokenProgram"
              },
              {
                "kind": "account",
                "path": "outputMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "inputMint"
        },
        {
          "name": "outputMint"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "inputStakePool",
          "optional": true
        },
        {
          "name": "outputStakePool",
          "optional": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "jupiterProgram",
          "address": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "inputTokenProgram"
        },
        {
          "name": "outputTokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "marinadeClaimTickets",
      "docs": [
        "Claims tickets that were unstaked in the previous epoch to get SOL.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::Marinade"
      ],
      "discriminator": [
        14,
        146,
        182,
        30,
        205,
        47,
        134,
        189
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "marinadeState",
          "writable": true
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": []
    },
    {
      "name": "marinadeDelayedUnstake",
      "docs": [
        "Unstakes mSOL to get a ticket that can be claimed at the next epoch.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `msol_amount`: Amount of mSOL to unstake.",
        "- `ticket_id`: Ticket ID.",
        "- `bump`: Bump seed.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::Marinade"
      ],
      "discriminator": [
        117,
        66,
        3,
        222,
        230,
        94,
        129,
        95
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "ticket",
          "writable": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "burnMsolFrom",
          "writable": true
        },
        {
          "name": "marinadeState",
          "writable": true
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": [
        {
          "name": "msolAmount",
          "type": "u64"
        },
        {
          "name": "ticketId",
          "type": "string"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "marinadeDepositSol",
      "docs": [
        "marinade",
        "Deposits SOL to get mSOL.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `lamports`: The amount of SOL to deposit.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::Marinade"
      ],
      "discriminator": [
        64,
        140,
        200,
        40,
        56,
        218,
        181,
        68
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "marinadeState",
          "writable": true
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "msolMintAuthority",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "writable": true
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "msolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marinadeDepositStake",
      "docs": [
        "Deposits a stake account to get mSOL.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `validator_idx`: Validator index.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::Marinade"
      ],
      "discriminator": [
        69,
        207,
        194,
        211,
        186,
        55,
        199,
        130
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "marinadeState",
          "writable": true
        },
        {
          "name": "validatorList",
          "writable": true
        },
        {
          "name": "stakeList",
          "writable": true
        },
        {
          "name": "vaultStakeAccount",
          "writable": true
        },
        {
          "name": "duplicationFlag",
          "writable": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "msolMintAuthority"
        },
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "msolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "validatorIdx",
          "type": "u32"
        }
      ]
    },
    {
      "name": "marinadeLiquidUnstake",
      "docs": [
        "Unstakes mSOL to get SOL immediately.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `msol_amount`: Amount of mSOL to unstake.",
        "",
        "# Permission required",
        "- Permission::LiquidUnstake",
        "",
        "# Integration required",
        "- Integration::Marinade"
      ],
      "discriminator": [
        29,
        146,
        34,
        21,
        26,
        68,
        141,
        161
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "marinadeState",
          "writable": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "writable": true
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "msolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mergePartialUnstaking",
      "docs": [
        "Merges partial unstaking.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::UnstakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        190,
        154,
        163,
        153,
        168,
        115,
        40,
        173
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "partialUnstake",
          "writable": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mergeStakeAccounts",
      "docs": [
        "Merges two stake accounts.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        173,
        206,
        10,
        246,
        109,
        50,
        244,
        110
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "toStake",
          "writable": true
        },
        {
          "name": "fromStake",
          "writable": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeHistory",
          "address": "SysvarStakeHistory1111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintShare",
      "docs": [
        "Mints a specified amount of shares for the given share class.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to mint shares for.",
        "- `amount`: The amount of shares to mint.",
        "",
        "# Permission required",
        "- Permission::MintShare",
        "",
        "# Integration required",
        "- Integration::Mint"
      ],
      "discriminator": [
        145,
        1,
        122,
        214,
        134,
        106,
        116,
        109
      ],
      "accounts": [
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "newVote",
      "docs": [
        "Creates a new vote.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::VoteOnProposal",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        163,
        108,
        157,
        189,
        140,
        80,
        13,
        143
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "vote",
          "writable": true
        },
        {
          "name": "governanceProgram",
          "address": "GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "openPartialUnstaking",
      "docs": [
        "Partially unstakes JUP.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount of JUP to partially unstake.",
        "- `memo`: The memo for the partial unstaking.",
        "",
        "# Permission required",
        "- Permission::UnstakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        201,
        137,
        207,
        175,
        79,
        95,
        220,
        27
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "partialUnstake",
          "writable": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "memo",
          "type": "string"
        }
      ]
    },
    {
      "name": "redeem",
      "docs": [
        "Redeems a specified amount of shares.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount of shares to redeem.",
        "- `in_kind`: Whether to redeem in kind.",
        "- `skip_state`: Should always be true (state check to be implemented)."
      ],
      "discriminator": [
        184,
        12,
        86,
        149,
        70,
        196,
        97,
        225
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "shareClass",
          "writable": true
        },
        {
          "name": "signerShareAta",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signerPolicy",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "signerShareAta"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "inKind",
          "type": "bool"
        },
        {
          "name": "skipState",
          "type": "bool"
        }
      ]
    },
    {
      "name": "redelegateStake",
      "docs": [
        "Redelegates an existing stake account to a new validator (a new stake account will be created).",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `new_stake_account_id`: The ID of the new stake account.",
        "- `new_stake_account_bump`: The bump seed for the new stake account.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        240,
        90,
        140,
        104,
        96,
        8,
        134,
        31
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "existingStake",
          "writable": true
        },
        {
          "name": "newStake",
          "writable": true
        },
        {
          "name": "vote"
        },
        {
          "name": "stakeConfig"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newStakeAccountId",
          "type": "string"
        },
        {
          "name": "newStakeAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setSubscribeRedeemEnabled",
      "docs": [
        "Enables or disables the subscribe and redeem functionality.",
        "",
        "This allows the owner to pause/unpause subscription and redemption of a fund.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `enabled`: A boolean indicating whether to enable or disable the subscribe and redeem functionality.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        189,
        56,
        205,
        172,
        201,
        185,
        34,
        92
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setTokenAccountsStates",
      "docs": [
        "Sets the frozen state of the token accounts for the specified share class.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to set the frozen state for.",
        "- `frozen`: The new frozen state.",
        "",
        "# Permission required",
        "- Permission::SetTokenAccountsStates",
        "",
        "# Integration required",
        "- Integration::Mint"
      ],
      "discriminator": [
        50,
        133,
        45,
        86,
        117,
        66,
        115,
        195
      ],
      "accounts": [
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "frozen",
          "type": "bool"
        }
      ]
    },
    {
      "name": "splitStakeAccount",
      "docs": [
        "Splits from an existing stake account to get a new stake account.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `lamports`: The amount of SOL to split.",
        "- `new_stake_account_id`: The ID of the new stake account.",
        "- `new_stake_account_bump`: The bump seed for the new stake account.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        130,
        42,
        33,
        89,
        117,
        77,
        105,
        194
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "existingStake",
          "writable": true
        },
        {
          "name": "newStake",
          "writable": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "newStakeAccountId",
          "type": "string"
        },
        {
          "name": "newStakeAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "stakePoolDepositSol",
      "docs": [
        "Deposits SOL to a stake pool to get pool token.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `lamports`: The amount of SOL to deposit.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used."
      ],
      "discriminator": [
        147,
        187,
        91,
        151,
        158,
        187,
        247,
        79
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "withdrawAuthority"
        },
        {
          "name": "reserveStake",
          "writable": true
        },
        {
          "name": "poolMint",
          "writable": true
        },
        {
          "name": "feeAccount",
          "writable": true
        },
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "poolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stakePoolDepositStake",
      "docs": [
        "Deposits a stake account to a stake pool to get pool token.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::Stake",
        "",
        "# Integration required",
        "- Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used."
      ],
      "discriminator": [
        212,
        158,
        195,
        174,
        179,
        105,
        9,
        97
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultStakeAccount",
          "writable": true
        },
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "poolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "poolMint",
          "writable": true
        },
        {
          "name": "feeAccount",
          "writable": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "depositAuthority"
        },
        {
          "name": "withdrawAuthority"
        },
        {
          "name": "validatorList",
          "writable": true
        },
        {
          "name": "validatorStakeAccount",
          "writable": true
        },
        {
          "name": "reserveStakeAccount",
          "writable": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeHistory",
          "address": "SysvarStakeHistory1111111111111111111111111"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "stakePoolWithdrawSol",
      "docs": [
        "Unstakes from pool token to get SOL immediately.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `pool_token_amount`: Amount of pool token to unstake.",
        "",
        "# Permission required",
        "- Permission::LiquidUnstake",
        "",
        "# Integration required",
        "- Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used."
      ],
      "discriminator": [
        179,
        100,
        204,
        0,
        192,
        46,
        233,
        181
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "withdrawAuthority"
        },
        {
          "name": "reserveStake",
          "writable": true
        },
        {
          "name": "poolMint",
          "writable": true
        },
        {
          "name": "feeAccount",
          "writable": true
        },
        {
          "name": "poolTokenAta",
          "writable": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeHistory",
          "address": "SysvarStakeHistory1111111111111111111111111"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stakePoolWithdrawStake",
      "docs": [
        "Unstakes from pool token into a stake account.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `pool_token_amount`: Amount of pool token to unstake.",
        "- `stake_account_id`: Stake account ID.",
        "- `stake_account_bump`: Stake account bump seed.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used."
      ],
      "discriminator": [
        7,
        70,
        250,
        22,
        49,
        1,
        143,
        1
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultStakeAccount",
          "writable": true
        },
        {
          "name": "poolMint",
          "writable": true
        },
        {
          "name": "feeAccount",
          "writable": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "withdrawAuthority"
        },
        {
          "name": "validatorList",
          "writable": true
        },
        {
          "name": "validatorStakeAccount",
          "writable": true
        },
        {
          "name": "poolTokenAta",
          "writable": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "stakeAccountId",
          "type": "string"
        },
        {
          "name": "stakeAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "subscribe",
      "docs": [
        "Investor",
        "Subscribes to a specified amount of shares.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount of shares to subscribe.",
        "- `skip_state`: Should always be true (state check to be implemented)."
      ],
      "discriminator": [
        254,
        28,
        191,
        138,
        156,
        179,
        183,
        53
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "signerShareAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "shareClassMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "asset"
        },
        {
          "name": "vaultAta",
          "writable": true
        },
        {
          "name": "signerAssetAta",
          "writable": true
        },
        {
          "name": "signerPolicy",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "signerShareAta"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "skipState",
          "type": "bool"
        }
      ]
    },
    {
      "name": "toggleMaxLock",
      "docs": [
        "Toggles max lock.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `value`: The value to toggle.",
        "",
        "# Permission required",
        "- Permission::UnstakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        163,
        157,
        161,
        132,
        179,
        107,
        127,
        143
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "value",
          "type": "bool"
        }
      ]
    },
    {
      "name": "transferHook",
      "discriminator": [
        105,
        37,
        101,
        197,
        75,
        251,
        102,
        26
      ],
      "accounts": [
        {
          "name": "srcAccount"
        },
        {
          "name": "mint"
        },
        {
          "name": "dstAccount"
        },
        {
          "name": "owner"
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "state"
        },
        {
          "name": "srcAccountPolicy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "srcAccount"
              }
            ]
          }
        },
        {
          "name": "dstAccountPolicy",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "dstAccount"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateShareClass",
      "docs": [
        "Updates an existing share class with new metadata.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `share_class_id`: The id of the share class to be updated.",
        "- `share_class_metadata`: An instance of `ShareClassModel` containing the updated metadata for the new share class.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        196,
        227,
        109,
        174,
        25,
        115,
        15,
        26
      ],
      "accounts": [
        {
          "name": "shareClassMint",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shareClassId",
          "type": "u8"
        },
        {
          "name": "shareClassMetadata",
          "type": {
            "defined": {
              "name": "shareClassModel"
            }
          }
        }
      ]
    },
    {
      "name": "updateState",
      "docs": [
        "Updates an existing state account with new parameters.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `fund`: An instance of `StateModel` containing the updated details of the state.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        135,
        112,
        215,
        75,
        247,
        185,
        53,
        176
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "stateModel"
            }
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw asset from vault into owner's wallet.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `amount`: The amount to withdraw.",
        "",
        "# Permission required",
        "- Owner only, delegates not allowed"
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "asset"
        },
        {
          "name": "vaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "asset"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "signerAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "asset"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawAllStakedJup",
      "docs": [
        "Withdraws all unstaked JUP.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::UnstakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        210,
        124,
        52,
        114,
        25,
        254,
        170,
        52
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "escrowJupAta",
          "writable": true
        },
        {
          "name": "vaultJupAta",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawFromStakeAccounts",
      "docs": [
        "Withdraws SOL from stake accounts.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::Unstake",
        "",
        "# Integration required",
        "- Integration::NativeStaking"
      ],
      "discriminator": [
        93,
        209,
        100,
        231,
        169,
        160,
        192,
        197
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "stakeHistory",
          "address": "SysvarStakeHistory1111111111111111111111111"
        },
        {
          "name": "stakeProgram",
          "address": "Stake11111111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawPartialUnstaking",
      "docs": [
        "Withdraws JUP from partial unstaking.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::UnstakeJup",
        "",
        "# Integration required",
        "- Integration::JupiterVote"
      ],
      "discriminator": [
        201,
        202,
        137,
        124,
        2,
        3,
        245,
        87
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "partialUnstake",
          "writable": true
        },
        {
          "name": "locker",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "escrowJupAta",
          "writable": true
        },
        {
          "name": "vaultJupAta",
          "writable": true
        },
        {
          "name": "lockedVoterProgram",
          "address": "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "wsolUnwrap",
      "docs": [
        "Unwraps all wSOL to get SOL.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "",
        "# Permission required",
        "- Permission::WSolUnwrap"
      ],
      "discriminator": [
        123,
        189,
        16,
        96,
        233,
        186,
        54,
        215
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "wsolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "wsolMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "wsolWrap",
      "docs": [
        "Wraps SOL to get wSOL.",
        "",
        "# Parameters",
        "- `ctx`: The context for the transaction.",
        "- `lamports`: The amount of SOL to wrap.",
        "",
        "# Permission required",
        "- Permission::WSolWrap"
      ],
      "discriminator": [
        26,
        2,
        139,
        159,
        239,
        195,
        193,
        9
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "vaultWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "wsolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "wsolMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "governor",
      "discriminator": [
        37,
        136,
        44,
        80,
        68,
        85,
        213,
        178
      ]
    },
    {
      "name": "locker",
      "discriminator": [
        74,
        246,
        6,
        113,
        249,
        228,
        75,
        169
      ]
    },
    {
      "name": "openfundsMetadataAccount",
      "discriminator": [
        5,
        89,
        20,
        76,
        255,
        158,
        209,
        219
      ]
    },
    {
      "name": "partialUnstaking",
      "discriminator": [
        172,
        146,
        58,
        213,
        40,
        250,
        107,
        63
      ]
    },
    {
      "name": "policyAccount",
      "discriminator": [
        218,
        201,
        183,
        164,
        156,
        127,
        81,
        175
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "stateAccount",
      "discriminator": [
        142,
        247,
        54,
        95,
        85,
        133,
        249,
        103
      ]
    },
    {
      "name": "vote",
      "discriminator": [
        96,
        91,
        104,
        57,
        145,
        35,
        172,
        155
      ]
    }
  ],
  "errors": [
    {
      "code": 48000,
      "name": "notAuthorized",
      "msg": "Signer is not authorized"
    },
    {
      "code": 48001,
      "name": "integrationDisabled",
      "msg": "Integration is disabled"
    },
    {
      "code": 48002,
      "name": "stateAccountDisabled",
      "msg": "State account is disabled"
    },
    {
      "code": 48003,
      "name": "invalidSignerAccount",
      "msg": "Invalid signer ata"
    },
    {
      "code": 49000,
      "name": "invalidAccountType",
      "msg": "Invalid account type"
    },
    {
      "code": 49001,
      "name": "invalidName",
      "msg": "Name too long: max 64 chars"
    },
    {
      "code": 49002,
      "name": "invalidSymbol",
      "msg": "Symbol too long: max 32 chars"
    },
    {
      "code": 49003,
      "name": "invalidUri",
      "msg": "Uri too long: max 128 chars"
    },
    {
      "code": 49004,
      "name": "invalidAssetsLen",
      "msg": "Too many assets: max 100"
    },
    {
      "code": 49005,
      "name": "closeNotEmptyError",
      "msg": "Error closing state account: not empty"
    },
    {
      "code": 49006,
      "name": "noShareClass",
      "msg": "No share class found"
    },
    {
      "code": 49007,
      "name": "shareClassesNotClosed",
      "msg": "Glam state account can't be closed. Close share classes first"
    },
    {
      "code": 49008,
      "name": "invalidShareClass",
      "msg": "Share class not allowed to subscribe"
    },
    {
      "code": 49009,
      "name": "invalidAssetSubscribe",
      "msg": "Asset not allowed to subscribe"
    },
    {
      "code": 49010,
      "name": "invalidPricingOracle",
      "msg": "Invalid oracle for asset price"
    },
    {
      "code": 49011,
      "name": "invalidRemainingAccounts",
      "msg": "Invalid accounts: the transaction is malformed"
    },
    {
      "code": 49012,
      "name": "invalidVaultTokenAccount",
      "msg": "Invalid vault ata"
    },
    {
      "code": 49013,
      "name": "shareClassNotEmpty",
      "msg": "Share class mint supply not zero"
    },
    {
      "code": 50000,
      "name": "withdrawDenied",
      "msg": "Withdraw denied. Only vaults allow withdraws (funds and mints don't)"
    },
    {
      "code": 50001,
      "name": "invalidAssetForSwap",
      "msg": "Asset cannot be swapped"
    },
    {
      "code": 50002,
      "name": "invalidSwap",
      "msg": "Swap failed"
    },
    {
      "code": 50003,
      "name": "invalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 51000,
      "name": "invalidAssetPrice",
      "msg": "Invalid asset price"
    },
    {
      "code": 51001,
      "name": "invalidStableCoinPriceForSubscribe",
      "msg": "Subscription not allowed: invalid stable coin price"
    },
    {
      "code": 51002,
      "name": "subscribeRedeemDisable",
      "msg": "Fund is disabled for subscription and redemption"
    },
    {
      "code": 51003,
      "name": "invalidPolicyAccount",
      "msg": "Policy account is mandatory"
    },
    {
      "code": 51004,
      "name": "priceTooOld",
      "msg": "Price is too old"
    },
    {
      "code": 52000,
      "name": "transfersDisabled",
      "msg": "Policy violation: transfers disabled"
    },
    {
      "code": 52001,
      "name": "amountTooBig",
      "msg": "Policy violation: amount too big"
    },
    {
      "code": 52002,
      "name": "lockUp",
      "msg": "Policy violation: lock-up period"
    }
  ],
  "types": [
    {
      "name": "accountType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "vault"
          },
          {
            "name": "mint"
          },
          {
            "name": "fund"
          }
        ]
      }
    },
    {
      "name": "companyField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "companyFieldName"
              }
            }
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "companyFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "fundGroupName"
          },
          {
            "name": "manCo"
          },
          {
            "name": "domicileOfManCo"
          },
          {
            "name": "bicOfCustodian"
          },
          {
            "name": "collateralManagerName"
          },
          {
            "name": "custodianBankName"
          },
          {
            "name": "domicileOfCustodianBank"
          },
          {
            "name": "fundAdministratorName"
          },
          {
            "name": "fundAdvisorName"
          },
          {
            "name": "fundPromoterName"
          },
          {
            "name": "isSelfManagedInvestmentCompany"
          },
          {
            "name": "leiOfCustodianBank"
          },
          {
            "name": "leiOfManCo"
          },
          {
            "name": "portfolioManagingCompanyName"
          },
          {
            "name": "securitiesLendingCounterpartyName"
          },
          {
            "name": "swapCounterpartyName"
          },
          {
            "name": "addressofManCo"
          },
          {
            "name": "auditorName"
          },
          {
            "name": "cityofManCo"
          },
          {
            "name": "emailAddressOfManCo"
          },
          {
            "name": "fundWebsiteOfManCo"
          },
          {
            "name": "isUnpriSignatory"
          },
          {
            "name": "phoneCountryCodeofManCo"
          },
          {
            "name": "phoneNumberofManCo"
          },
          {
            "name": "subInvestmentAdvisorName"
          },
          {
            "name": "zipCodeofManCo"
          },
          {
            "name": "domicileOfUmbrella"
          },
          {
            "name": "hasUmbrella"
          },
          {
            "name": "leiOfUmbrella"
          },
          {
            "name": "umbrella"
          },
          {
            "name": "globalIntermediaryIdentificationNumberOfUmbrella"
          }
        ]
      }
    },
    {
      "name": "companyModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundGroupName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "manCo",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "domicileOfManCo",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "emailAddressOfManCo",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fundWebsiteOfManCo",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "createdModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "key",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "createdBy",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "delegateAcl",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "permissions",
            "type": {
              "vec": {
                "defined": {
                  "name": "permission"
                }
              }
            }
          },
          {
            "name": "expiresAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "engineField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "engineFieldName"
              }
            }
          },
          {
            "name": "value",
            "type": {
              "defined": {
                "name": "engineFieldValue"
              }
            }
          }
        ]
      }
    },
    {
      "name": "engineFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "shareClassAllowlist"
          },
          {
            "name": "shareClassBlocklist"
          },
          {
            "name": "externalVaultAccounts"
          },
          {
            "name": "lockUp"
          },
          {
            "name": "driftMarketIndexesPerp"
          },
          {
            "name": "driftMarketIndexesSpot"
          },
          {
            "name": "driftOrderTypes"
          }
        ]
      }
    },
    {
      "name": "engineFieldValue",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "boolean",
            "fields": [
              {
                "name": "val",
                "type": "bool"
              }
            ]
          },
          {
            "name": "date",
            "fields": [
              {
                "name": "val",
                "type": "string"
              }
            ]
          },
          {
            "name": "double",
            "fields": [
              {
                "name": "val",
                "type": "i64"
              }
            ]
          },
          {
            "name": "integer",
            "fields": [
              {
                "name": "val",
                "type": "i32"
              }
            ]
          },
          {
            "name": "string",
            "fields": [
              {
                "name": "val",
                "type": "string"
              }
            ]
          },
          {
            "name": "time",
            "fields": [
              {
                "name": "val",
                "type": "string"
              }
            ]
          },
          {
            "name": "u8",
            "fields": [
              {
                "name": "val",
                "type": "u8"
              }
            ]
          },
          {
            "name": "u64",
            "fields": [
              {
                "name": "val",
                "type": "u64"
              }
            ]
          },
          {
            "name": "pubkey",
            "fields": [
              {
                "name": "val",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "percentage",
            "fields": [
              {
                "name": "val",
                "type": "u32"
              }
            ]
          },
          {
            "name": "uri",
            "fields": [
              {
                "name": "val",
                "type": "string"
              }
            ]
          },
          {
            "name": "timestamp",
            "fields": [
              {
                "name": "val",
                "type": "i64"
              }
            ]
          },
          {
            "name": "vecPubkey",
            "fields": [
              {
                "name": "val",
                "type": {
                  "vec": "pubkey"
                }
              }
            ]
          },
          {
            "name": "vecU32",
            "fields": [
              {
                "name": "val",
                "type": {
                  "vec": "u32"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "escrow",
      "docs": [
        "Account: Escrow"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "locker",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "tokens",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "escrowStartedAt",
            "type": "i64"
          },
          {
            "name": "escrowEndsAt",
            "type": "i64"
          },
          {
            "name": "voteDelegate",
            "type": "pubkey"
          },
          {
            "name": "isMaxLock",
            "type": "bool"
          },
          {
            "name": "partialUnstakingAmount",
            "type": "u64"
          },
          {
            "name": "padding",
            "type": "u64"
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u128",
                9
              ]
            }
          }
        ]
      }
    },
    {
      "name": "fundField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "fundFieldName"
              }
            }
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "fundFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "fundDomicileAlpha2"
          },
          {
            "name": "fundDomicileAlpha3"
          },
          {
            "name": "legalFundNameIncludingUmbrella"
          },
          {
            "name": "fiscalYearEnd"
          },
          {
            "name": "fundCurrency"
          },
          {
            "name": "fundLaunchDate"
          },
          {
            "name": "investmentObjective"
          },
          {
            "name": "isEtc"
          },
          {
            "name": "isEuDirectiveRelevant"
          },
          {
            "name": "isFundOfFunds"
          },
          {
            "name": "isPassiveFund"
          },
          {
            "name": "isReit"
          },
          {
            "name": "legalForm"
          },
          {
            "name": "legalFundNameOnly"
          },
          {
            "name": "openEndedOrClosedEndedFundStructure"
          },
          {
            "name": "typeOfEuDirective"
          },
          {
            "name": "ucitsVersion"
          },
          {
            "name": "currencyHedgePortfolio"
          },
          {
            "name": "depositoryName"
          },
          {
            "name": "fundValuationPoint"
          },
          {
            "name": "fundValuationPointTimeZone"
          },
          {
            "name": "fundValuationPointTimeZoneUsingTzDatabase"
          },
          {
            "name": "hasCollateralManager"
          },
          {
            "name": "hasEmbeddedDerivatives"
          },
          {
            "name": "hasSecuritiesLending"
          },
          {
            "name": "hasSwap"
          },
          {
            "name": "isLeveraged"
          },
          {
            "name": "isShariaCompliant"
          },
          {
            "name": "isShort"
          },
          {
            "name": "leIofDepositoryBank"
          },
          {
            "name": "leiOfFund"
          },
          {
            "name": "locationOfBearerShare"
          },
          {
            "name": "locationOfShareRegister"
          },
          {
            "name": "maximumLeverageInFund"
          },
          {
            "name": "miFidSecuritiesClassification"
          },
          {
            "name": "moneyMarketTypeOfFund"
          },
          {
            "name": "trusteeName"
          },
          {
            "name": "auMFund"
          },
          {
            "name": "auMFundDate"
          },
          {
            "name": "noSFund"
          },
          {
            "name": "noSFundDate"
          }
        ]
      }
    },
    {
      "name": "fundManagerField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "fundManagerFieldName"
              }
            }
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "fundManagerFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "portfolioManagerForename"
          },
          {
            "name": "portfolioManagerName"
          },
          {
            "name": "portfolioManagerYearOfBirth"
          },
          {
            "name": "portfolioManagerYearOfExperienceStart"
          },
          {
            "name": "portfolioManagerBriefBiography"
          },
          {
            "name": "portfolioManagerType"
          },
          {
            "name": "portfolioManagerRoleStartingDate"
          },
          {
            "name": "portfolioManagerRoleEndDate"
          }
        ]
      }
    },
    {
      "name": "fundOpenfundsModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundDomicileAlpha2",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "legalFundNameIncludingUmbrella",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fiscalYearEnd",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fundCurrency",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fundLaunchDate",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "investmentObjective",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "isEtc",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isEuDirectiveRelevant",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isFundOfFunds",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isPassiveFund",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isReit",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "legalForm",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "legalFundNameOnly",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "openEndedOrClosedEndedFundStructure",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "typeOfEuDirective",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "ucitsVersion",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "governanceParameters",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingDelay",
            "type": "u64"
          },
          {
            "name": "votingPeriod",
            "type": "u64"
          },
          {
            "name": "quorumVotes",
            "type": "u64"
          },
          {
            "name": "timelockDelaySeconds",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "governor",
      "docs": [
        "Account: Governor"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "proposalCount",
            "type": "u64"
          },
          {
            "name": "locker",
            "type": "pubkey"
          },
          {
            "name": "smartWallet",
            "type": "pubkey"
          },
          {
            "name": "params",
            "type": {
              "defined": {
                "name": "governanceParameters"
              }
            }
          },
          {
            "name": "votingReward",
            "type": {
              "defined": {
                "name": "votingReward"
              }
            }
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u128",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "integration",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "drift"
          },
          {
            "name": "splStakePool"
          },
          {
            "name": "sanctumStakePool"
          },
          {
            "name": "nativeStaking"
          },
          {
            "name": "marinade"
          },
          {
            "name": "jupiterSwap"
          },
          {
            "name": "jupiterVote"
          }
        ]
      }
    },
    {
      "name": "locker",
      "docs": [
        "Account: Locker"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "lockedSupply",
            "type": "u64"
          },
          {
            "name": "totalEscrow",
            "type": "u64"
          },
          {
            "name": "governor",
            "type": "pubkey"
          },
          {
            "name": "params",
            "type": {
              "defined": {
                "name": "lockerParams"
              }
            }
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u128",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "lockerParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxStakeVoteMultiplier",
            "type": "u8"
          },
          {
            "name": "minStakeDuration",
            "type": "u64"
          },
          {
            "name": "maxStakeDuration",
            "type": "u64"
          },
          {
            "name": "proposalActivationMinVotes",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "managerKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "wallet"
          },
          {
            "name": "squads"
          }
        ]
      }
    },
    {
      "name": "managerModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioManagerName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "pubkey",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "kind",
            "type": {
              "option": {
                "defined": {
                  "name": "managerKind"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "marketType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "spot"
          },
          {
            "name": "perp"
          }
        ]
      }
    },
    {
      "name": "metadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "template",
            "type": {
              "defined": {
                "name": "metadataTemplate"
              }
            }
          },
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "metadataTemplate",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "openfunds"
          }
        ]
      }
    },
    {
      "name": "openfundsMetadataAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundId",
            "type": "pubkey"
          },
          {
            "name": "company",
            "type": {
              "vec": {
                "defined": {
                  "name": "companyField"
                }
              }
            }
          },
          {
            "name": "fund",
            "type": {
              "vec": {
                "defined": {
                  "name": "fundField"
                }
              }
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": {
                "vec": {
                  "defined": {
                    "name": "shareClassField"
                  }
                }
              }
            }
          },
          {
            "name": "fundManagers",
            "type": {
              "vec": {
                "vec": {
                  "defined": {
                    "name": "fundManagerField"
                  }
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "orderParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderType",
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          },
          {
            "name": "marketType",
            "type": {
              "defined": {
                "name": "marketType"
              }
            }
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "positionDirection"
              }
            }
          },
          {
            "name": "userOrderId",
            "type": "u8"
          },
          {
            "name": "baseAssetAmount",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "marketIndex",
            "type": "u16"
          },
          {
            "name": "reduceOnly",
            "type": "bool"
          },
          {
            "name": "postOnly",
            "type": {
              "defined": {
                "name": "postOnlyParam"
              }
            }
          },
          {
            "name": "immediateOrCancel",
            "type": "bool"
          },
          {
            "name": "maxTs",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "triggerPrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "triggerCondition",
            "type": {
              "defined": {
                "name": "orderTriggerCondition"
              }
            }
          },
          {
            "name": "oraclePriceOffset",
            "type": {
              "option": "i32"
            }
          },
          {
            "name": "auctionDuration",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "auctionStartPrice",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "auctionEndPrice",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "orderTriggerCondition",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "above"
          },
          {
            "name": "below"
          },
          {
            "name": "triggeredAbove"
          },
          {
            "name": "triggeredBelow"
          }
        ]
      }
    },
    {
      "name": "orderType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "market"
          },
          {
            "name": "limit"
          },
          {
            "name": "triggerMarket"
          },
          {
            "name": "triggerLimit"
          },
          {
            "name": "oracle"
          }
        ]
      }
    },
    {
      "name": "partialUnstaking",
      "docs": [
        "Account: PartialUnstaking"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "expiration",
            "type": "i64"
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u128",
                6
              ]
            }
          },
          {
            "name": "memo",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "permission",
      "docs": [
        "* Delegate ACL"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "driftInitialize"
          },
          {
            "name": "driftUpdateUser"
          },
          {
            "name": "driftDeleteUser"
          },
          {
            "name": "driftDeposit"
          },
          {
            "name": "driftWithdraw"
          },
          {
            "name": "driftPlaceOrders"
          },
          {
            "name": "driftCancelOrders"
          },
          {
            "name": "driftPerpMarket"
          },
          {
            "name": "driftSpotMarket"
          },
          {
            "name": "stake"
          },
          {
            "name": "unstake"
          },
          {
            "name": "liquidUnstake"
          },
          {
            "name": "jupiterSwapAllowlisted"
          },
          {
            "name": "jupiterSwapAny"
          },
          {
            "name": "wSolWrap"
          },
          {
            "name": "wSolUnwrap"
          },
          {
            "name": "mintShare"
          },
          {
            "name": "burnShare"
          },
          {
            "name": "forceTransferShare"
          },
          {
            "name": "setTokenAccountsStates"
          },
          {
            "name": "stakeJup"
          },
          {
            "name": "voteOnProposal"
          },
          {
            "name": "unstakeJup"
          },
          {
            "name": "jupiterSwapLst"
          }
        ]
      }
    },
    {
      "name": "policyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lockedUntilTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "long"
          },
          {
            "name": "short"
          }
        ]
      }
    },
    {
      "name": "postOnlyParam",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "mustPostOnly"
          },
          {
            "name": "tryPostOnly"
          },
          {
            "name": "slide"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "docs": [
        "Account: Proposal"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governor",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "quorumVotes",
            "type": "u64"
          },
          {
            "name": "maxOption",
            "type": "u8"
          },
          {
            "name": "optionVotes",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "canceledAt",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "activatedAt",
            "type": "i64"
          },
          {
            "name": "votingEndsAt",
            "type": "i64"
          },
          {
            "name": "queuedAt",
            "type": "i64"
          },
          {
            "name": "queuedTransaction",
            "type": "pubkey"
          },
          {
            "name": "votingReward",
            "type": {
              "defined": {
                "name": "votingReward"
              }
            }
          },
          {
            "name": "totalClaimedReward",
            "type": "u64"
          },
          {
            "name": "proposalType",
            "type": "u8"
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u128",
                10
              ]
            }
          },
          {
            "name": "instructions",
            "type": {
              "vec": {
                "defined": {
                  "name": "proposalInstruction"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposalAccountMeta",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "isSigner",
            "type": "bool"
          },
          {
            "name": "isWritable",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "proposalInstruction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "type": "pubkey"
          },
          {
            "name": "keys",
            "type": {
              "vec": {
                "defined": {
                  "name": "proposalAccountMeta"
                }
              }
            }
          },
          {
            "name": "data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "shareClassField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "shareClassFieldName"
              }
            }
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "shareClassFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "isin"
          },
          {
            "name": "shareClassCurrency"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "currencyOfMinimalSubscription"
          },
          {
            "name": "fullShareClassName"
          },
          {
            "name": "hasPerformanceFee"
          },
          {
            "name": "hasSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "investmentStatus"
          },
          {
            "name": "managementFeeApplied"
          },
          {
            "name": "managementFeeAppliedReferenceDate"
          },
          {
            "name": "managementFeeMaximum"
          },
          {
            "name": "maximumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "minimalInitialSubscriptionCategory"
          },
          {
            "name": "minimalInitialSubscriptionInAmount"
          },
          {
            "name": "minimalInitialSubscriptionInShares"
          },
          {
            "name": "minimalSubsequentSubscriptionCategory"
          },
          {
            "name": "minimalSubsequentSubscriptionInAmount"
          },
          {
            "name": "minimalSubsequentSubscriptionInShares"
          },
          {
            "name": "minimumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "shareClassDistributionPolicy"
          },
          {
            "name": "shareClassExtension"
          },
          {
            "name": "shareClassLaunchDate"
          },
          {
            "name": "shareClassLifecycle"
          },
          {
            "name": "srri"
          },
          {
            "name": "launchPrice"
          },
          {
            "name": "launchPriceCurrency"
          },
          {
            "name": "launchPriceDate"
          },
          {
            "name": "hasAppliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "maximumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "hasAppliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "maximumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "currencyOfMinimalOrMaximumRedemption"
          },
          {
            "name": "cutOffDateOffsetForRedemption"
          },
          {
            "name": "cutOffDateOffsetForSubscription"
          },
          {
            "name": "cutOffTimeForRedemption"
          },
          {
            "name": "cutOffTimeForSubscription"
          },
          {
            "name": "hasLockUpForRedemption"
          },
          {
            "name": "hasRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "isValidIsin"
          },
          {
            "name": "lockUpComment"
          },
          {
            "name": "lockUpPeriodInDays"
          },
          {
            "name": "managementFeeMinimum"
          },
          {
            "name": "maximalNumberOfPossibleDecimalsAmount"
          },
          {
            "name": "maximalNumberOfPossibleDecimalsNav"
          },
          {
            "name": "maximalNumberOfPossibleDecimalsShares"
          },
          {
            "name": "maximumInitialRedemptionInAmount"
          },
          {
            "name": "maximumInitialRedemptionInShares"
          },
          {
            "name": "maximumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "maximumSubsequentRedemptionInAmount"
          },
          {
            "name": "maximumSubsequentRedemptionInShares"
          },
          {
            "name": "minimalInitialRedemptionInAmount"
          },
          {
            "name": "minimalInitialRedemptionInShares"
          },
          {
            "name": "minimalRedemptionCategory"
          },
          {
            "name": "minimalSubsequentRedemptionInAmount"
          },
          {
            "name": "minimalSubsequentRedemptionInShares"
          },
          {
            "name": "minimumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "minimumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "minimumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "performanceFeeMinimum"
          },
          {
            "name": "roundingMethodForPrices"
          },
          {
            "name": "roundingMethodForRedemptionInAmount"
          },
          {
            "name": "roundingMethodForRedemptionInShares"
          },
          {
            "name": "roundingMethodForSubscriptionInAmount"
          },
          {
            "name": "roundingMethodForSubscriptionInShares"
          },
          {
            "name": "shareClassDividendType"
          },
          {
            "name": "cusip"
          },
          {
            "name": "valor"
          },
          {
            "name": "fundId"
          },
          {
            "name": "imageUri"
          }
        ]
      }
    },
    {
      "name": "shareClassModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "uri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "statePubkey",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "asset",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "imageUri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "allowlist",
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "blocklist",
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "lockUpPeriodInSeconds",
            "type": {
              "option": "i32"
            }
          },
          {
            "name": "permanentDelegate",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "defaultAccountStateFrozen",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isRawOpenfunds",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "rawOpenfunds",
            "type": {
              "option": {
                "defined": {
                  "name": "shareClassOpenfundsModel"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "shareClassOpenfundsModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isin",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassCurrency",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "currencyOfMinimalSubscription",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fullShareClassName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "investmentStatus",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalInitialSubscriptionCategory",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalInitialSubscriptionInAmount",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalInitialSubscriptionInShares",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassDistributionPolicy",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassExtension",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassLaunchDate",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassLifecycle",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "launchPrice",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "launchPriceCurrency",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "launchPriceDate",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "currencyOfMinimalOrMaximumRedemption",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "hasLockUpForRedemption",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "isValidIsin",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "lockUpComment",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "lockUpPeriodInDays",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximumInitialRedemptionInAmount",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximumInitialRedemptionInShares",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalInitialRedemptionInAmount",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalInitialRedemptionInShares",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "minimalRedemptionCategory",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "shareClassDividendType",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "cusip",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "valor",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "stateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "accountType",
            "type": {
              "defined": {
                "name": "accountType"
              }
            }
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "created",
            "type": {
              "defined": {
                "name": "createdModel"
              }
            }
          },
          {
            "name": "engine",
            "type": "pubkey"
          },
          {
            "name": "mints",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "metadata",
            "type": {
              "option": {
                "defined": {
                  "name": "metadata"
                }
              }
            }
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "assets",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "delegateAcls",
            "type": {
              "vec": {
                "defined": {
                  "name": "delegateAcl"
                }
              }
            }
          },
          {
            "name": "integrations",
            "type": {
              "vec": {
                "defined": {
                  "name": "integration"
                }
              }
            }
          },
          {
            "name": "params",
            "type": {
              "vec": {
                "vec": {
                  "defined": {
                    "name": "engineField"
                  }
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "stateModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "accountType",
            "type": {
              "option": {
                "defined": {
                  "name": "accountType"
                }
              }
            }
          },
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "uri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "enabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "assets",
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "externalVaultAccounts",
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "mints",
            "type": {
              "option": {
                "vec": {
                  "defined": {
                    "name": "shareClassModel"
                  }
                }
              }
            }
          },
          {
            "name": "company",
            "type": {
              "option": {
                "defined": {
                  "name": "companyModel"
                }
              }
            }
          },
          {
            "name": "owner",
            "type": {
              "option": {
                "defined": {
                  "name": "managerModel"
                }
              }
            }
          },
          {
            "name": "created",
            "type": {
              "option": {
                "defined": {
                  "name": "createdModel"
                }
              }
            }
          },
          {
            "name": "delegateAcls",
            "type": {
              "option": {
                "vec": {
                  "defined": {
                    "name": "delegateAcl"
                  }
                }
              }
            }
          },
          {
            "name": "integrations",
            "type": {
              "option": {
                "vec": {
                  "defined": {
                    "name": "integration"
                  }
                }
              }
            }
          },
          {
            "name": "driftMarketIndexesPerp",
            "type": {
              "option": {
                "vec": "u32"
              }
            }
          },
          {
            "name": "driftMarketIndexesSpot",
            "type": {
              "option": {
                "vec": "u32"
              }
            }
          },
          {
            "name": "driftOrderTypes",
            "type": {
              "option": {
                "vec": "u32"
              }
            }
          },
          {
            "name": "metadata",
            "type": {
              "option": {
                "defined": {
                  "name": "metadata"
                }
              }
            }
          },
          {
            "name": "rawOpenfunds",
            "type": {
              "option": {
                "defined": {
                  "name": "fundOpenfundsModel"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "vote",
      "docs": [
        "Account: Vote"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "buffers",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "votingReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardMint",
            "type": "pubkey"
          },
          {
            "name": "rewardVault",
            "type": "pubkey"
          },
          {
            "name": "rewardPerProposal",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seedMetadata",
      "type": "string",
      "value": "\"metadata\""
    },
    {
      "name": "seedMint",
      "type": "string",
      "value": "\"mint\""
    },
    {
      "name": "seedState",
      "type": "string",
      "value": "\"state\""
    },
    {
      "name": "seedVault",
      "type": "string",
      "value": "\"vault\""
    }
  ]
};
