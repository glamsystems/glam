export type Glam = {
  "version": "0.1.0",
  "name": "glam",
  "constants": [
    {
      "name": "SEED",
      "type": "string",
      "value": "\"anchor\""
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "share",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
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
            "defined": "ShareClassMetadata"
          }
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
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
    },
    {
      "name": "close",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "subscribe",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "shareClass",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerShareAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerAssetAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "token2022Program",
          "isMut": false,
          "isSigner": false
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
      "name": "redeem",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "shareClass",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerShareAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "token2022Program",
          "isMut": false,
          "isSigner": false
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
      "name": "driftInitialize",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "driftUpdateDelegatedTrader",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "driftDeposit",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "driftWithdraw",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "driftClose",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fund",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "assetsLen",
            "type": "u8"
          },
          {
            "name": "assets",
            "type": {
              "array": [
                "publicKey",
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
                "publicKey",
                3
              ]
            }
          },
          {
            "name": "shareClassesMetadata",
            "type": {
              "array": [
                {
                  "defined": "ShareClassMetadata"
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
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "fund",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ShareClassMetadata",
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
            "type": "publicKey"
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
      "name": "InvestorError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundNotActive"
          },
          {
            "name": "InvalidAssetSubscribe"
          },
          {
            "name": "InvalidAssetsRedeem"
          },
          {
            "name": "InvalidTreasuryAccount"
          }
        ]
      }
    },
    {
      "name": "PolicyError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TransfersDisabled"
          },
          {
            "name": "AmountTooBig"
          },
          {
            "name": "LockOut"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CloseNotEmptyError",
      "msg": "Error closing account: not empty"
    },
    {
      "code": 6001,
      "name": "NotAuthorizedError",
      "msg": "Error: not authorized"
    },
    {
      "code": 6002,
      "name": "InvalidFundName",
      "msg": "Invalid fund name: max 30 chars"
    },
    {
      "code": 6003,
      "name": "InvalidFundSymbol",
      "msg": "Too many assets: max 50"
    },
    {
      "code": 6004,
      "name": "InvalidFundUri",
      "msg": "Too many assets: max 20"
    },
    {
      "code": 6005,
      "name": "InvalidAssetsLen",
      "msg": "Too many assets: max 100"
    },
    {
      "code": 6006,
      "name": "InvalidAssetsWeights",
      "msg": "Number of weights should match number of assets"
    }
  ]
};

export const IDL: Glam = {
  "version": "0.1.0",
  "name": "glam",
  "constants": [
    {
      "name": "SEED",
      "type": "string",
      "value": "\"anchor\""
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "share",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
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
            "defined": "ShareClassMetadata"
          }
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
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
    },
    {
      "name": "close",
      "accounts": [
        {
          "name": "fund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "subscribe",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "shareClass",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerShareAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerAssetAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "token2022Program",
          "isMut": false,
          "isSigner": false
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
      "name": "redeem",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "shareClass",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signerShareAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "token2022Program",
          "isMut": false,
          "isSigner": false
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
      "name": "driftInitialize",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "driftUpdateDelegatedTrader",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "trader",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "driftDeposit",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "driftWithdraw",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "driftAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "driftClose",
      "accounts": [
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "driftProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fund",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "assetsLen",
            "type": "u8"
          },
          {
            "name": "assets",
            "type": {
              "array": [
                "publicKey",
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
                "publicKey",
                3
              ]
            }
          },
          {
            "name": "shareClassesMetadata",
            "type": {
              "array": [
                {
                  "defined": "ShareClassMetadata"
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
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "fund",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ShareClassMetadata",
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
            "type": "publicKey"
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
      "name": "InvestorError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundNotActive"
          },
          {
            "name": "InvalidAssetSubscribe"
          },
          {
            "name": "InvalidAssetsRedeem"
          },
          {
            "name": "InvalidTreasuryAccount"
          }
        ]
      }
    },
    {
      "name": "PolicyError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TransfersDisabled"
          },
          {
            "name": "AmountTooBig"
          },
          {
            "name": "LockOut"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CloseNotEmptyError",
      "msg": "Error closing account: not empty"
    },
    {
      "code": 6001,
      "name": "NotAuthorizedError",
      "msg": "Error: not authorized"
    },
    {
      "code": 6002,
      "name": "InvalidFundName",
      "msg": "Invalid fund name: max 30 chars"
    },
    {
      "code": 6003,
      "name": "InvalidFundSymbol",
      "msg": "Too many assets: max 50"
    },
    {
      "code": 6004,
      "name": "InvalidFundUri",
      "msg": "Too many assets: max 20"
    },
    {
      "code": 6005,
      "name": "InvalidAssetsLen",
      "msg": "Too many assets: max 100"
    },
    {
      "code": 6006,
      "name": "InvalidAssetsWeights",
      "msg": "Number of weights should match number of assets"
    }
  ]
};
