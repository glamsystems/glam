/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/glam.json`.
 */
export type Glam = {
  "address": "Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc",
  "metadata": {
    "name": "glam",
    "version": "0.2.0",
    "spec": "0.1.0",
    "description": "Glam Protocol"
  },
  "instructions": [
    {
      "name": "close",
      "discriminator": [
        98,
        165,
        201,
        177,
        108,
        65,
        206,
        96
      ],
      "accounts": [
        {
          "name": "fund",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "driftClose",
      "discriminator": [
        23,
        133,
        219,
        157,
        137,
        34,
        93,
        58
      ],
      "accounts": [
        {
          "name": "fund"
        },
        {
          "name": "treasury"
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
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
          "name": "fund"
        },
        {
          "name": "treasury"
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "treasuryAta",
          "writable": true
        },
        {
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "driftInitialize",
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
          "name": "fund"
        },
        {
          "name": "treasury"
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
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
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "driftUpdateDelegatedTrader",
      "discriminator": [
        98,
        66,
        206,
        146,
        109,
        215,
        206,
        57
      ],
      "accounts": [
        {
          "name": "fund"
        },
        {
          "name": "treasury"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
        },
        {
          "name": "driftProgram",
          "address": "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
        }
      ],
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "driftWithdraw",
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
          "name": "fund"
        },
        {
          "name": "treasury"
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "driftSigner"
        },
        {
          "name": "treasuryAta",
          "writable": true
        },
        {
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "fund",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "manager"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "fund"
              }
            ]
          }
        },
        {
          "name": "share",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  45,
                  48
                ]
              },
              {
                "kind": "account",
                "path": "fund"
              }
            ]
          }
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fundName",
          "type": "string"
        },
        {
          "name": "fundSymbol",
          "type": "string"
        },
        {
          "name": "fundUri",
          "type": "string"
        },
        {
          "name": "assetWeights",
          "type": {
            "vec": "u32"
          }
        },
        {
          "name": "activate",
          "type": "bool"
        },
        {
          "name": "shareClassMetadata",
          "type": {
            "defined": {
              "name": "shareClassMetadata"
            }
          }
        }
      ]
    },
    {
      "name": "redeem",
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
          "name": "fund"
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
          "name": "treasury"
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
      "name": "subscribe",
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
          "name": "fund"
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
          "name": "asset",
          "writable": true
        },
        {
          "name": "treasuryAta",
          "writable": true
        },
        {
          "name": "signerAssetAta",
          "writable": true
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
      "name": "update",
      "discriminator": [
        219,
        200,
        88,
        176,
        158,
        63,
        253,
        127
      ],
      "accounts": [
        {
          "name": "fund",
          "writable": true
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
        }
      ],
      "args": [
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
          "name": "assetWeights",
          "type": {
            "option": {
              "vec": "u32"
            }
          }
        },
        {
          "name": "activate",
          "type": {
            "option": "bool"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "fund",
      "discriminator": [
        62,
        128,
        183,
        208,
        91,
        31,
        212,
        209
      ]
    },
    {
      "name": "state",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "closeNotEmptyError",
      "msg": "Error closing account: not empty"
    },
    {
      "code": 6001,
      "name": "notAuthorizedError",
      "msg": "Error: not authorized"
    },
    {
      "code": 6002,
      "name": "invalidFundName",
      "msg": "Invalid fund name: max 30 chars"
    },
    {
      "code": 6003,
      "name": "invalidFundSymbol",
      "msg": "Too many assets: max 50"
    },
    {
      "code": 6004,
      "name": "invalidFundUri",
      "msg": "Too many assets: max 20"
    },
    {
      "code": 6005,
      "name": "invalidAssetsLen",
      "msg": "Too many assets: max 100"
    },
    {
      "code": 6006,
      "name": "invalidAssetsWeights",
      "msg": "Number of weights should match number of assets"
    }
  ],
  "types": [
    {
      "name": "feeStructure",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeTiers",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "feeTier"
                  }
                },
                10
              ]
            }
          },
          {
            "name": "fillerRewardStructure",
            "type": {
              "defined": {
                "name": "orderFillerRewardStructure"
              }
            }
          },
          {
            "name": "referrerRewardEpochUpperBound",
            "type": "u64"
          },
          {
            "name": "flatFillerFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "feeTier",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeNumerator",
            "type": "u32"
          },
          {
            "name": "feeDenominator",
            "type": "u32"
          },
          {
            "name": "makerRebateNumerator",
            "type": "u32"
          },
          {
            "name": "makerRebateDenominator",
            "type": "u32"
          },
          {
            "name": "referrerRewardNumerator",
            "type": "u32"
          },
          {
            "name": "referrerRewardDenominator",
            "type": "u32"
          },
          {
            "name": "refereeFeeNumerator",
            "type": "u32"
          },
          {
            "name": "refereeFeeDenominator",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "fund",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "assetsLen",
            "type": "u8"
          },
          {
            "name": "assets",
            "type": {
              "array": [
                "pubkey",
                5
              ]
            }
          },
          {
            "name": "assetsWeights",
            "type": {
              "array": [
                "u32",
                5
              ]
            }
          },
          {
            "name": "shareClassesLen",
            "type": "u8"
          },
          {
            "name": "shareClasses",
            "type": {
              "array": [
                "pubkey",
                3
              ]
            }
          },
          {
            "name": "shareClassesMetadata",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "shareClassMetadata"
                  }
                },
                3
              ]
            }
          },
          {
            "name": "shareClassesBumps",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "timeCreated",
            "type": "i64"
          },
          {
            "name": "bumpFund",
            "type": "u8"
          },
          {
            "name": "bumpTreasury",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "oracleGuardRails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceDivergence",
            "type": {
              "defined": {
                "name": "priceDivergenceGuardRails"
              }
            }
          },
          {
            "name": "validity",
            "type": {
              "defined": {
                "name": "validityGuardRails"
              }
            }
          }
        ]
      }
    },
    {
      "name": "orderFillerRewardStructure",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardNumerator",
            "type": "u32"
          },
          {
            "name": "rewardDenominator",
            "type": "u32"
          },
          {
            "name": "timeBasedRewardLowerBound",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "priceDivergenceGuardRails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "markOraclePercentDivergence",
            "type": "u64"
          },
          {
            "name": "oracleTwap5minPercentDivergence",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "shareClassMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "shareClassAsset",
            "type": "string"
          },
          {
            "name": "shareClassAssetId",
            "type": "pubkey"
          },
          {
            "name": "isin",
            "type": "string"
          },
          {
            "name": "status",
            "type": "string"
          },
          {
            "name": "feeManagement",
            "type": "i32"
          },
          {
            "name": "feePerformance",
            "type": "i32"
          },
          {
            "name": "policyDistribution",
            "type": "string"
          },
          {
            "name": "extension",
            "type": "string"
          },
          {
            "name": "launchDate",
            "type": "string"
          },
          {
            "name": "lifecycle",
            "type": "string"
          },
          {
            "name": "imageUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "state",
      "docs": [
        "Account: State"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "whitelistMint",
            "type": "pubkey"
          },
          {
            "name": "discountMint",
            "type": "pubkey"
          },
          {
            "name": "signer",
            "type": "pubkey"
          },
          {
            "name": "srmVault",
            "type": "pubkey"
          },
          {
            "name": "perpFeeStructure",
            "type": {
              "defined": {
                "name": "feeStructure"
              }
            }
          },
          {
            "name": "spotFeeStructure",
            "type": {
              "defined": {
                "name": "feeStructure"
              }
            }
          },
          {
            "name": "oracleGuardRails",
            "type": {
              "defined": {
                "name": "oracleGuardRails"
              }
            }
          },
          {
            "name": "numberOfAuthorities",
            "type": "u64"
          },
          {
            "name": "numberOfSubAccounts",
            "type": "u64"
          },
          {
            "name": "lpCooldownTime",
            "type": "u64"
          },
          {
            "name": "liquidationMarginBufferRatio",
            "type": "u32"
          },
          {
            "name": "settlementDuration",
            "type": "u16"
          },
          {
            "name": "numberOfMarkets",
            "type": "u16"
          },
          {
            "name": "numberOfSpotMarkets",
            "type": "u16"
          },
          {
            "name": "signerNonce",
            "type": "u8"
          },
          {
            "name": "minPerpAuctionDuration",
            "type": "u8"
          },
          {
            "name": "defaultMarketOrderTimeInForce",
            "type": "u8"
          },
          {
            "name": "defaultSpotAuctionDuration",
            "type": "u8"
          },
          {
            "name": "exchangeStatus",
            "type": "u8"
          },
          {
            "name": "liquidationDuration",
            "type": "u8"
          },
          {
            "name": "initialPctToLiquidate",
            "type": "u16"
          },
          {
            "name": "maxNumberOfSubAccounts",
            "type": "u16"
          },
          {
            "name": "maxInitializeUserFee",
            "type": "u16"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                10
              ]
            }
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "pubkey"
          },
          {
            "name": "fund",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "validityGuardRails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slotsBeforeStaleForAmm",
            "type": "i64"
          },
          {
            "name": "slotsBeforeStaleForMargin",
            "type": "i64"
          },
          {
            "name": "confidenceIntervalMaxSize",
            "type": "u64"
          },
          {
            "name": "tooVolatileRatio",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    }
  ]
};
