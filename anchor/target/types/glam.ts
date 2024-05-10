export type Glam = {
  "version": "0.2.0",
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
          "name": "openfunds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
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
        }
      ],
      "args": [
        {
          "name": "fund",
          "type": {
            "defined": "FundModel"
          }
        }
      ]
    },
    {
      "name": "addShareClass",
      "accounts": [
        {
          "name": "shareClassMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fund",
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
        }
      ],
      "args": [
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
          "name": "shareClassSymbol",
          "type": "string"
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
    },
    {
      "name": "marinadeDeposit",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
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
        }
      ],
      "args": [
        {
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marinadeLiquidUnstake",
      "accounts": [
        {
          "name": "manager",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marinadeDelayedUnstake",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
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
          "name": "marinadeProgram",
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
          "name": "ticketBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "marinadeClaim",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
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
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fundAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "openfunds",
            "type": "publicKey"
          },
          {
            "name": "openfundsUri",
            "type": "string"
          },
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "engine",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "fundMetadataAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundPubkey",
            "type": "publicKey"
          },
          {
            "name": "company",
            "type": {
              "vec": {
                "defined": "CompanyField"
              }
            }
          },
          {
            "name": "fund",
            "type": {
              "vec": {
                "defined": "FundField"
              }
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": {
                "vec": {
                  "defined": "ShareClassField"
                }
              }
            }
          },
          {
            "name": "fundManagers",
            "type": {
              "vec": {
                "vec": {
                  "defined": "FundManagerField"
                }
              }
            }
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
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "assets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "assetsWeights",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "shareClassesBumps",
            "type": "bytes"
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
        "fields": []
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
      "name": "FundModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": {
              "option": "publicKey"
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
            "name": "openfundsUri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "isEnabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "assets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "assetsWeights",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": {
                "defined": "ShareClassModel"
              }
            }
          },
          {
            "name": "company",
            "type": {
              "option": {
                "defined": "CompanyModel"
              }
            }
          },
          {
            "name": "manager",
            "type": {
              "option": {
                "defined": "ManagerModel"
              }
            }
          },
          {
            "name": "created",
            "type": {
              "option": {
                "defined": "CreatedModel"
              }
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
                "defined": "FundOpenfundsModel"
              }
            }
          }
        ]
      }
    },
    {
      "name": "FundOpenfundsModel",
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
      "name": "CreatedModel",
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
            "name": "manager",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "ShareClassModel",
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
            "name": "fundId",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "asset",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "imageUri",
            "type": {
              "option": "string"
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
                "defined": "ShareClassOpenfundsModel"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ShareClassOpenfundsModel",
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
            "name": "fullShareClassName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "hasPerformanceFee",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "investmentStatus",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeApplied",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeAppliedReferenceDate",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeMaximum",
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
            "name": "managementFeeMinimum",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsAmount",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsNav",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsShares",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "CompanyModel",
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
      "name": "ManagerModel",
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
              "option": "publicKey"
            }
          },
          {
            "name": "kind",
            "type": {
              "option": {
                "defined": "ManagerKind"
              }
            }
          }
        ]
      }
    },
    {
      "name": "CompanyField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "CompanyFieldName"
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
      "name": "FundField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "FundFieldName"
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
      "name": "FundManagerField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "FundManagerFieldName"
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
      "name": "ShareClassField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "ShareClassFieldName"
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
      "name": "InvestorError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundNotActive"
          },
          {
            "name": "InvalidShareClass"
          },
          {
            "name": "InvalidAssetSubscribe"
          },
          {
            "name": "InvalidPricingOracle"
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
      "name": "FundError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NoShareClassInFund"
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
    },
    {
      "name": "ManagerKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Wallet"
          },
          {
            "name": "Squads"
          }
        ]
      }
    },
    {
      "name": "CompanyFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundGroupName"
          },
          {
            "name": "ManCo"
          },
          {
            "name": "DomicileOfManCo"
          },
          {
            "name": "BICOfCustodian"
          },
          {
            "name": "CollateralManagerName"
          },
          {
            "name": "CustodianBankName"
          },
          {
            "name": "DomicileOfCustodianBank"
          },
          {
            "name": "FundAdministratorName"
          },
          {
            "name": "FundAdvisorName"
          },
          {
            "name": "FundPromoterName"
          },
          {
            "name": "IsSelfManagedInvestmentCompany"
          },
          {
            "name": "LEIOfCustodianBank"
          },
          {
            "name": "LEIOfManCo"
          },
          {
            "name": "PortfolioManagingCompanyName"
          },
          {
            "name": "SecuritiesLendingCounterpartyName"
          },
          {
            "name": "SwapCounterpartyName"
          },
          {
            "name": "AddressofManCo"
          },
          {
            "name": "AuditorName"
          },
          {
            "name": "CityofManCo"
          },
          {
            "name": "EmailAddressOfManCo"
          },
          {
            "name": "FundWebsiteofManCo"
          },
          {
            "name": "IsUNPRISignatory"
          },
          {
            "name": "PhoneCountryCodeofManCo"
          },
          {
            "name": "PhoneNumberofManCo"
          },
          {
            "name": "SubInvestmentAdvisorName"
          },
          {
            "name": "ZIPCodeofManCo"
          },
          {
            "name": "DomicileOfUmbrella"
          },
          {
            "name": "HasUmbrella"
          },
          {
            "name": "LEIOfUmbrella"
          },
          {
            "name": "Umbrella"
          },
          {
            "name": "GlobalIntermediaryIdentificationNumberOfUmbrella"
          }
        ]
      }
    },
    {
      "name": "FundFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundDomicileAlpha2"
          },
          {
            "name": "FundDomicileAlpha3"
          },
          {
            "name": "LegalFundNameIncludingUmbrella"
          },
          {
            "name": "FiscalYearEnd"
          },
          {
            "name": "FundCurrency"
          },
          {
            "name": "FundLaunchDate"
          },
          {
            "name": "InvestmentObjective"
          },
          {
            "name": "IsETC"
          },
          {
            "name": "IsEUDirectiveRelevant"
          },
          {
            "name": "IsFundOfFunds"
          },
          {
            "name": "IsPassiveFund"
          },
          {
            "name": "IsREIT"
          },
          {
            "name": "LegalForm"
          },
          {
            "name": "LegalFundNameOnly"
          },
          {
            "name": "OpenEndedOrClosedEndedFundStructure"
          },
          {
            "name": "TypeOfEUDirective"
          },
          {
            "name": "UCITSVersion"
          },
          {
            "name": "CurrencyHedgePortfolio"
          },
          {
            "name": "DepositoryName"
          },
          {
            "name": "FundValuationPoint"
          },
          {
            "name": "FundValuationPointTimeZone"
          },
          {
            "name": "FundValuationPointTimeZoneUsingTZDatabase"
          },
          {
            "name": "HasCollateralManager"
          },
          {
            "name": "HasEmbeddedDerivatives"
          },
          {
            "name": "HasSecuritiesLending"
          },
          {
            "name": "HasSwap"
          },
          {
            "name": "IsLeveraged"
          },
          {
            "name": "IsShariaCompliant"
          },
          {
            "name": "IsShort"
          },
          {
            "name": "LEIofDepositoryBank"
          },
          {
            "name": "LEIOfFund"
          },
          {
            "name": "LocationOfBearerShare"
          },
          {
            "name": "LocationOfShareRegister"
          },
          {
            "name": "MaximumLeverageInFund"
          },
          {
            "name": "MiFIDSecuritiesClassification"
          },
          {
            "name": "MoneyMarketTypeOfFund"
          },
          {
            "name": "TrusteeName"
          },
          {
            "name": "AuMFund"
          },
          {
            "name": "AuMFundDate"
          },
          {
            "name": "NoSFund"
          },
          {
            "name": "NoSFundDate"
          }
        ]
      }
    },
    {
      "name": "FundManagerFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PortfolioManagerForename"
          },
          {
            "name": "PortfolioManagerName"
          },
          {
            "name": "PortfolioManagerYearOfBirth"
          },
          {
            "name": "PortfolioManagerYearOfExperienceStart"
          },
          {
            "name": "PortfolioManagerBriefBiography"
          },
          {
            "name": "PortfolioManagerType"
          },
          {
            "name": "PortfolioManagerRoleStartingDate"
          },
          {
            "name": "PortfolioManagerRoleEndDate"
          }
        ]
      }
    },
    {
      "name": "ShareClassFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ISIN"
          },
          {
            "name": "ShareClassCurrency"
          },
          {
            "name": "AllInFeeApplied"
          },
          {
            "name": "AllInFeeDate"
          },
          {
            "name": "AllInFeeIncludesTransactionCosts"
          },
          {
            "name": "AllInFeeMaximum"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "Benchmark"
          },
          {
            "name": "CountryLegalRegistration"
          },
          {
            "name": "CountryMarketingDistribution"
          },
          {
            "name": "CurrencyHedgeShareClass"
          },
          {
            "name": "CurrencyOfMinimalSubscription"
          },
          {
            "name": "DistributionDeclarationFrequency"
          },
          {
            "name": "FullShareClassName"
          },
          {
            "name": "HasAllInFee"
          },
          {
            "name": "HasOngoingCharges"
          },
          {
            "name": "HasPerformanceFee"
          },
          {
            "name": "HasSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "InvestmentStatus"
          },
          {
            "name": "IsETF"
          },
          {
            "name": "IsRDRCompliant"
          },
          {
            "name": "IsTrailerFeeClean"
          },
          {
            "name": "ManagementFeeApplied"
          },
          {
            "name": "ManagementFeeAppliedReferenceDate"
          },
          {
            "name": "ManagementFeeMaximum"
          },
          {
            "name": "MaximumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "MinimalInitialSubscriptionCategory"
          },
          {
            "name": "MinimalInitialSubscriptionInAmount"
          },
          {
            "name": "MinimalInitialSubscriptionInShares"
          },
          {
            "name": "MinimalSubsequentSubscriptionCategory"
          },
          {
            "name": "MinimalSubsequentSubscriptionInAmount"
          },
          {
            "name": "MinimalSubsequentSubscriptionInShares"
          },
          {
            "name": "MinimumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "OngoingCharges"
          },
          {
            "name": "OngoingChargesDate"
          },
          {
            "name": "PerformanceFeeApplied"
          },
          {
            "name": "PerformanceFeeAppliedReferenceDate"
          },
          {
            "name": "PerformanceFeeInProspectus"
          },
          {
            "name": "PerformanceFeeInProspectusReferenceDate"
          },
          {
            "name": "RecordDateForSRRI"
          },
          {
            "name": "ShareClassDistributionPolicy"
          },
          {
            "name": "ShareClassExtension"
          },
          {
            "name": "ShareClassLaunchDate"
          },
          {
            "name": "ShareClassLifecycle"
          },
          {
            "name": "SRRI"
          },
          {
            "name": "TERExcludingPerformanceFee"
          },
          {
            "name": "TERExcludingPerformanceFeeDate"
          },
          {
            "name": "TERIncludingPerformanceFee"
          },
          {
            "name": "TERIncludingPerformanceFeeDate"
          },
          {
            "name": "TransferAgentName"
          },
          {
            "name": "BICOfTransferAgent"
          },
          {
            "name": "DomicileOfTransferAgent"
          },
          {
            "name": "FormOfShare"
          },
          {
            "name": "HasDurationHedge"
          },
          {
            "name": "TypeOfEqualization"
          },
          {
            "name": "IsMultiseries"
          },
          {
            "name": "SeriesIssuance"
          },
          {
            "name": "SeriesFrequency"
          },
          {
            "name": "DoesFundIssueSidePocket"
          },
          {
            "name": "HasRedemptionGates"
          },
          {
            "name": "TypeOfAlternativeFundStructureVehicle"
          },
          {
            "name": "BloombergCode"
          },
          {
            "name": "FIGICode"
          },
          {
            "name": "AbbreviatedShareClassName"
          },
          {
            "name": "ValuationFrequency"
          },
          {
            "name": "NAVPublicationTime"
          },
          {
            "name": "IsShareClassEligibleForUCITS"
          },
          {
            "name": "InvestmentStatusDate"
          },
          {
            "name": "LaunchPrice"
          },
          {
            "name": "LaunchPriceCurrency"
          },
          {
            "name": "LaunchPriceDate"
          },
          {
            "name": "EFAMAMainEFCCategory"
          },
          {
            "name": "EFAMAEFCClassificationType"
          },
          {
            "name": "EFAMAActiveEFCClassification"
          },
          {
            "name": "EFAMAEFCInvestmentTheme"
          },
          {
            "name": "PricingMethodology"
          },
          {
            "name": "SinglePricingType"
          },
          {
            "name": "SwingFactor"
          },
          {
            "name": "StandardMinimumRemainingAmount"
          },
          {
            "name": "StandardMinimumRemainingShares"
          },
          {
            "name": "CurrencyOfMinimumRemainingAmount"
          },
          {
            "name": "StandardMinimumRemainingCategory"
          },
          {
            "name": "HurdleRate"
          },
          {
            "name": "HighWaterMark"
          },
          {
            "name": "HasAppliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "MaximumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "HasAppliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "MaximumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "EquivalentTrailerFeeCleanISIN"
          },
          {
            "name": "HasSeparateDistributionFee"
          },
          {
            "name": "DistributionFee"
          },
          {
            "name": "DistributionFeeMaximum"
          },
          {
            "name": "IASector"
          },
          {
            "name": "AbsorbingFundFullShareClassName"
          },
          {
            "name": "AbsorbingFundShareClassISIN"
          },
          {
            "name": "AdministrationFeeMaximum"
          },
          {
            "name": "AnnualDistributionAtFiscalYearEnd"
          },
          {
            "name": "AnnualDistributionYieldAtFiscalYearEnd"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "BankDetailsSSIForPaymentsProvision"
          },
          {
            "name": "BankDetailsLevelApplication"
          },
          {
            "name": "BenchmarkBloombergTicker"
          },
          {
            "name": "CalculationDateOffsetForRedemption"
          },
          {
            "name": "CalculationDateOffsetForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForCutOffDateOffsetForRedemption"
          },
          {
            "name": "CalendarOrBusinessDaysForCutOffDateOffsetForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForPrePaymentDaysForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForSettlementPeriodForRedemption"
          },
          {
            "name": "CalendarOrBusinessDaysForSettlementPeriodForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForTransactions"
          },
          {
            "name": "CFICode"
          },
          {
            "name": "ContingentDeferredSalesChargeExitFee"
          },
          {
            "name": "ContingentDeferredSalesChargeUpfrontFee"
          },
          {
            "name": "CountryISOCodeAlpha2"
          },
          {
            "name": "CountryISOCodeAlpha3"
          },
          {
            "name": "CountryName"
          },
          {
            "name": "CurrenciesOfMulticurrencyShareClass"
          },
          {
            "name": "CurrencyOfMinimalOrMaximumRedemption"
          },
          {
            "name": "CustodianFeeApplied"
          },
          {
            "name": "CustodianFeeAppliedReferenceDate"
          },
          {
            "name": "CustodianFeeMaximum"
          },
          {
            "name": "CutOffDateOffsetForRedemption"
          },
          {
            "name": "CutOffDateOffsetForSubscription"
          },
          {
            "name": "CutOffTimeForRedemption"
          },
          {
            "name": "CutOffTimeForSubscription"
          },
          {
            "name": "CutOffTimeForSwitchIn"
          },
          {
            "name": "CutOffTimeForSwitchOut"
          },
          {
            "name": "DealingDaysOfMultipleRedemptionTradeCycles"
          },
          {
            "name": "DealingDaysOfMultipleSubscriptionTradeCycles"
          },
          {
            "name": "DisseminationRecipient"
          },
          {
            "name": "DistributionFeeReferenceDate"
          },
          {
            "name": "DoesShareClassApplyMandatoryConversion"
          },
          {
            "name": "DoesShareClassApplyPartialDealingDays"
          },
          {
            "name": "DoesShareClassApplyPartialPaymentDays"
          },
          {
            "name": "DormantEndDate"
          },
          {
            "name": "DormantStartDate"
          },
          {
            "name": "ExDividendDateCalendar"
          },
          {
            "name": "ExitCostDescription"
          },
          {
            "name": "HasContingentDeferredSalesChargeFee"
          },
          {
            "name": "HasDilutionLevyAppliedByFund"
          },
          {
            "name": "HasEqualizationMethodForDistribution"
          },
          {
            "name": "HasEqualizationMethodForPerformanceFee"
          },
          {
            "name": "HasForcedRedemption"
          },
          {
            "name": "HasForwardPricing"
          },
          {
            "name": "HasHighWaterMark"
          },
          {
            "name": "HasLockUpForRedemption"
          },
          {
            "name": "HasPreNoticeForSwitchIn"
          },
          {
            "name": "HasPreNoticeForSwitchOut"
          },
          {
            "name": "HasPrePaymentForSubscription"
          },
          {
            "name": "HasRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "HasTripartiteReport"
          },
          {
            "name": "InvestmentStatusDescription"
          },
          {
            "name": "IrregularRedemptionDealingDays"
          },
          {
            "name": "IrregularSubscriptionDealingDays"
          },
          {
            "name": "IsMulticurrencyShareClass"
          },
          {
            "name": "IsRestrictedToSeparateFeeArrangement"
          },
          {
            "name": "IsStructuredFinanceProduct"
          },
          {
            "name": "IsValidISIN"
          },
          {
            "name": "LiquidationStartDate"
          },
          {
            "name": "LockUpComment"
          },
          {
            "name": "LockUpPeriodInDays"
          },
          {
            "name": "ManagementFeeMinimum"
          },
          {
            "name": "MandatoryShareConversionDescriptionDetails"
          },
          {
            "name": "MarketsRelevantToFundTradingCalendar"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsAmount"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsNAV"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsShares"
          },
          {
            "name": "MaximumInitialRedemptionInAmount"
          },
          {
            "name": "MaximumInitialRedemptionInShares"
          },
          {
            "name": "MaximumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "MaximumSubsequentRedemptionInAmount"
          },
          {
            "name": "MaximumSubsequentRedemptionInShares"
          },
          {
            "name": "MergerRatio"
          },
          {
            "name": "MinimalInitialRedemptionInAmount"
          },
          {
            "name": "MinimalInitialRedemptionInShares"
          },
          {
            "name": "MinimalRedemptionCategory"
          },
          {
            "name": "MinimalSubsequentRedemptionInAmount"
          },
          {
            "name": "MinimalSubsequentRedemptionInShares"
          },
          {
            "name": "MinimumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "MinimumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "MinimumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "MonthlyRedemptionDealingDays"
          },
          {
            "name": "MonthlySubscriptionDealingDays"
          },
          {
            "name": "NasdaqFundNetworkNFNIdentifier"
          },
          {
            "name": "NoTradingDate"
          },
          {
            "name": "NumberOfPossibleRedemptionsWithinPeriod"
          },
          {
            "name": "NumberOfPossibleSubscriptionsWithinPeriod"
          },
          {
            "name": "PartialDealingDaysDateAndTime"
          },
          {
            "name": "PartialPaymentDaysDateAndTime"
          },
          {
            "name": "PaymentDateCalendar"
          },
          {
            "name": "PerformanceFeeMinimum"
          },
          {
            "name": "PreNoticeCutOffForRedemption"
          },
          {
            "name": "PreNoticeCutOffForSubscription"
          },
          {
            "name": "PrePaymentCutOffTimeForSubscription"
          },
          {
            "name": "PrePaymentDaysForSubscription"
          },
          {
            "name": "RecordDateCalendar"
          },
          {
            "name": "RedemptionTradeCyclePeriod"
          },
          {
            "name": "RoundingMethodForPrices"
          },
          {
            "name": "RoundingMethodForRedemptionInAmount"
          },
          {
            "name": "RoundingMethodForRedemptionInShares"
          },
          {
            "name": "RoundingMethodForSubscriptionInAmount"
          },
          {
            "name": "RoundingMethodForSubscriptionInShares"
          },
          {
            "name": "SettlementPeriodForRedemption"
          },
          {
            "name": "SettlementPeriodForSubscription"
          },
          {
            "name": "SettlementPeriodForSwitchIn"
          },
          {
            "name": "SettlementPeriodForSwitchOut"
          },
          {
            "name": "ShareClassDividendType"
          },
          {
            "name": "SingleRegisterAccountRestrictions"
          },
          {
            "name": "SubscriptionPeriodEndDate"
          },
          {
            "name": "SubscriptionPeriodStartDate"
          },
          {
            "name": "SubscriptionTradeCyclePeriod"
          },
          {
            "name": "SwitchInNoticePeriod"
          },
          {
            "name": "SwitchOutNoticePeriod"
          },
          {
            "name": "TerminationDate"
          },
          {
            "name": "TimeZoneForCutOff"
          },
          {
            "name": "TimeZoneForCutOffUsingTZDatabase"
          },
          {
            "name": "ValuationFrequencyDetail"
          },
          {
            "name": "ValuationReduction"
          },
          {
            "name": "WeeklyRedemptionDealingDays"
          },
          {
            "name": "WeeklySubscriptionDealingDays"
          },
          {
            "name": "YearlyRedemptionDealingDays"
          },
          {
            "name": "YearlySubscriptionDealingDays"
          },
          {
            "name": "FundId"
          },
          {
            "name": "ShareClassCurrencyId"
          },
          {
            "name": "ImageUri"
          }
        ]
      }
    },
    {
      "name": "ShareClassDynamicFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AskNAV"
          },
          {
            "name": "AskNAVDate"
          },
          {
            "name": "AuMShareClass"
          },
          {
            "name": "AuMShareClassDate"
          },
          {
            "name": "BidNAV"
          },
          {
            "name": "BidNAVDate"
          },
          {
            "name": "DividendAnnouncementDate"
          },
          {
            "name": "DividendCurrency"
          },
          {
            "name": "DividendExDate"
          },
          {
            "name": "DividendGross"
          },
          {
            "name": "DividendNet"
          },
          {
            "name": "DividendPaymentDate"
          },
          {
            "name": "DividendRecordDate"
          },
          {
            "name": "DynamicCurrency"
          },
          {
            "name": "DynamicDataType"
          },
          {
            "name": "DynamicValue"
          },
          {
            "name": "EqualisationRate"
          },
          {
            "name": "GeneralReferenceDate"
          },
          {
            "name": "IsDividendFinal"
          },
          {
            "name": "NoSShareClass"
          },
          {
            "name": "NoSShareClassDate"
          },
          {
            "name": "SplitRatio"
          },
          {
            "name": "SplitReferenceDate"
          },
          {
            "name": "TaxDeductedReinvestedAmount"
          },
          {
            "name": "TaxDeductedReinvestedAmountReferenceDate"
          },
          {
            "name": "TaxableIncomeperDividend"
          },
          {
            "name": "TaxableIncomeperShareEU"
          },
          {
            "name": "TransactionNAV"
          },
          {
            "name": "TransactionNAVDate"
          },
          {
            "name": "ValuationNAV"
          },
          {
            "name": "ValuationNAVDate"
          },
          {
            "name": "YieldOneDayGross"
          },
          {
            "name": "YieldOneDayNet"
          },
          {
            "name": "YieldSevenDayGross"
          },
          {
            "name": "YieldSevenDayNet"
          },
          {
            "name": "YieldThirtyDayGross"
          },
          {
            "name": "YieldThirtyDayNet"
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
  "version": "0.2.0",
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
          "name": "openfunds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
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
        }
      ],
      "args": [
        {
          "name": "fund",
          "type": {
            "defined": "FundModel"
          }
        }
      ]
    },
    {
      "name": "addShareClass",
      "accounts": [
        {
          "name": "shareClassMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fund",
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
        }
      ],
      "args": [
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
          "name": "shareClassSymbol",
          "type": "string"
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
    },
    {
      "name": "marinadeDeposit",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
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
        }
      ],
      "args": [
        {
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marinadeLiquidUnstake",
      "accounts": [
        {
          "name": "manager",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marinadeDelayedUnstake",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
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
          "name": "marinadeProgram",
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
          "name": "ticketBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "marinadeClaim",
      "accounts": [
        {
          "name": "manager",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fund",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
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
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fundAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "openfunds",
            "type": "publicKey"
          },
          {
            "name": "openfundsUri",
            "type": "string"
          },
          {
            "name": "manager",
            "type": "publicKey"
          },
          {
            "name": "engine",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "fundMetadataAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundPubkey",
            "type": "publicKey"
          },
          {
            "name": "company",
            "type": {
              "vec": {
                "defined": "CompanyField"
              }
            }
          },
          {
            "name": "fund",
            "type": {
              "vec": {
                "defined": "FundField"
              }
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": {
                "vec": {
                  "defined": "ShareClassField"
                }
              }
            }
          },
          {
            "name": "fundManagers",
            "type": {
              "vec": {
                "vec": {
                  "defined": "FundManagerField"
                }
              }
            }
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
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "assets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "assetsWeights",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "shareClassesBumps",
            "type": "bytes"
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
        "fields": []
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
      "name": "FundModel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": {
              "option": "publicKey"
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
            "name": "openfundsUri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "isEnabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "assets",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "assetsWeights",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": {
                "defined": "ShareClassModel"
              }
            }
          },
          {
            "name": "company",
            "type": {
              "option": {
                "defined": "CompanyModel"
              }
            }
          },
          {
            "name": "manager",
            "type": {
              "option": {
                "defined": "ManagerModel"
              }
            }
          },
          {
            "name": "created",
            "type": {
              "option": {
                "defined": "CreatedModel"
              }
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
                "defined": "FundOpenfundsModel"
              }
            }
          }
        ]
      }
    },
    {
      "name": "FundOpenfundsModel",
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
      "name": "CreatedModel",
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
            "name": "manager",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "ShareClassModel",
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
            "name": "fundId",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "asset",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "imageUri",
            "type": {
              "option": "string"
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
                "defined": "ShareClassOpenfundsModel"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ShareClassOpenfundsModel",
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
            "name": "fullShareClassName",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "hasPerformanceFee",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "investmentStatus",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeApplied",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeAppliedReferenceDate",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "managementFeeMaximum",
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
            "name": "managementFeeMinimum",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsAmount",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsNav",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "maximalNumberOfPossibleDecimalsShares",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    },
    {
      "name": "CompanyModel",
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
      "name": "ManagerModel",
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
              "option": "publicKey"
            }
          },
          {
            "name": "kind",
            "type": {
              "option": {
                "defined": "ManagerKind"
              }
            }
          }
        ]
      }
    },
    {
      "name": "CompanyField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "CompanyFieldName"
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
      "name": "FundField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "FundFieldName"
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
      "name": "FundManagerField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "FundManagerFieldName"
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
      "name": "ShareClassField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": "ShareClassFieldName"
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
      "name": "InvestorError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundNotActive"
          },
          {
            "name": "InvalidShareClass"
          },
          {
            "name": "InvalidAssetSubscribe"
          },
          {
            "name": "InvalidPricingOracle"
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
      "name": "FundError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NoShareClassInFund"
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
    },
    {
      "name": "ManagerKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Wallet"
          },
          {
            "name": "Squads"
          }
        ]
      }
    },
    {
      "name": "CompanyFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundGroupName"
          },
          {
            "name": "ManCo"
          },
          {
            "name": "DomicileOfManCo"
          },
          {
            "name": "BICOfCustodian"
          },
          {
            "name": "CollateralManagerName"
          },
          {
            "name": "CustodianBankName"
          },
          {
            "name": "DomicileOfCustodianBank"
          },
          {
            "name": "FundAdministratorName"
          },
          {
            "name": "FundAdvisorName"
          },
          {
            "name": "FundPromoterName"
          },
          {
            "name": "IsSelfManagedInvestmentCompany"
          },
          {
            "name": "LEIOfCustodianBank"
          },
          {
            "name": "LEIOfManCo"
          },
          {
            "name": "PortfolioManagingCompanyName"
          },
          {
            "name": "SecuritiesLendingCounterpartyName"
          },
          {
            "name": "SwapCounterpartyName"
          },
          {
            "name": "AddressofManCo"
          },
          {
            "name": "AuditorName"
          },
          {
            "name": "CityofManCo"
          },
          {
            "name": "EmailAddressOfManCo"
          },
          {
            "name": "FundWebsiteofManCo"
          },
          {
            "name": "IsUNPRISignatory"
          },
          {
            "name": "PhoneCountryCodeofManCo"
          },
          {
            "name": "PhoneNumberofManCo"
          },
          {
            "name": "SubInvestmentAdvisorName"
          },
          {
            "name": "ZIPCodeofManCo"
          },
          {
            "name": "DomicileOfUmbrella"
          },
          {
            "name": "HasUmbrella"
          },
          {
            "name": "LEIOfUmbrella"
          },
          {
            "name": "Umbrella"
          },
          {
            "name": "GlobalIntermediaryIdentificationNumberOfUmbrella"
          }
        ]
      }
    },
    {
      "name": "FundFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FundDomicileAlpha2"
          },
          {
            "name": "FundDomicileAlpha3"
          },
          {
            "name": "LegalFundNameIncludingUmbrella"
          },
          {
            "name": "FiscalYearEnd"
          },
          {
            "name": "FundCurrency"
          },
          {
            "name": "FundLaunchDate"
          },
          {
            "name": "InvestmentObjective"
          },
          {
            "name": "IsETC"
          },
          {
            "name": "IsEUDirectiveRelevant"
          },
          {
            "name": "IsFundOfFunds"
          },
          {
            "name": "IsPassiveFund"
          },
          {
            "name": "IsREIT"
          },
          {
            "name": "LegalForm"
          },
          {
            "name": "LegalFundNameOnly"
          },
          {
            "name": "OpenEndedOrClosedEndedFundStructure"
          },
          {
            "name": "TypeOfEUDirective"
          },
          {
            "name": "UCITSVersion"
          },
          {
            "name": "CurrencyHedgePortfolio"
          },
          {
            "name": "DepositoryName"
          },
          {
            "name": "FundValuationPoint"
          },
          {
            "name": "FundValuationPointTimeZone"
          },
          {
            "name": "FundValuationPointTimeZoneUsingTZDatabase"
          },
          {
            "name": "HasCollateralManager"
          },
          {
            "name": "HasEmbeddedDerivatives"
          },
          {
            "name": "HasSecuritiesLending"
          },
          {
            "name": "HasSwap"
          },
          {
            "name": "IsLeveraged"
          },
          {
            "name": "IsShariaCompliant"
          },
          {
            "name": "IsShort"
          },
          {
            "name": "LEIofDepositoryBank"
          },
          {
            "name": "LEIOfFund"
          },
          {
            "name": "LocationOfBearerShare"
          },
          {
            "name": "LocationOfShareRegister"
          },
          {
            "name": "MaximumLeverageInFund"
          },
          {
            "name": "MiFIDSecuritiesClassification"
          },
          {
            "name": "MoneyMarketTypeOfFund"
          },
          {
            "name": "TrusteeName"
          },
          {
            "name": "AuMFund"
          },
          {
            "name": "AuMFundDate"
          },
          {
            "name": "NoSFund"
          },
          {
            "name": "NoSFundDate"
          }
        ]
      }
    },
    {
      "name": "FundManagerFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PortfolioManagerForename"
          },
          {
            "name": "PortfolioManagerName"
          },
          {
            "name": "PortfolioManagerYearOfBirth"
          },
          {
            "name": "PortfolioManagerYearOfExperienceStart"
          },
          {
            "name": "PortfolioManagerBriefBiography"
          },
          {
            "name": "PortfolioManagerType"
          },
          {
            "name": "PortfolioManagerRoleStartingDate"
          },
          {
            "name": "PortfolioManagerRoleEndDate"
          }
        ]
      }
    },
    {
      "name": "ShareClassFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ISIN"
          },
          {
            "name": "ShareClassCurrency"
          },
          {
            "name": "AllInFeeApplied"
          },
          {
            "name": "AllInFeeDate"
          },
          {
            "name": "AllInFeeIncludesTransactionCosts"
          },
          {
            "name": "AllInFeeMaximum"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "Benchmark"
          },
          {
            "name": "CountryLegalRegistration"
          },
          {
            "name": "CountryMarketingDistribution"
          },
          {
            "name": "CurrencyHedgeShareClass"
          },
          {
            "name": "CurrencyOfMinimalSubscription"
          },
          {
            "name": "DistributionDeclarationFrequency"
          },
          {
            "name": "FullShareClassName"
          },
          {
            "name": "HasAllInFee"
          },
          {
            "name": "HasOngoingCharges"
          },
          {
            "name": "HasPerformanceFee"
          },
          {
            "name": "HasSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "InvestmentStatus"
          },
          {
            "name": "IsETF"
          },
          {
            "name": "IsRDRCompliant"
          },
          {
            "name": "IsTrailerFeeClean"
          },
          {
            "name": "ManagementFeeApplied"
          },
          {
            "name": "ManagementFeeAppliedReferenceDate"
          },
          {
            "name": "ManagementFeeMaximum"
          },
          {
            "name": "MaximumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "MinimalInitialSubscriptionCategory"
          },
          {
            "name": "MinimalInitialSubscriptionInAmount"
          },
          {
            "name": "MinimalInitialSubscriptionInShares"
          },
          {
            "name": "MinimalSubsequentSubscriptionCategory"
          },
          {
            "name": "MinimalSubsequentSubscriptionInAmount"
          },
          {
            "name": "MinimalSubsequentSubscriptionInShares"
          },
          {
            "name": "MinimumSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "OngoingCharges"
          },
          {
            "name": "OngoingChargesDate"
          },
          {
            "name": "PerformanceFeeApplied"
          },
          {
            "name": "PerformanceFeeAppliedReferenceDate"
          },
          {
            "name": "PerformanceFeeInProspectus"
          },
          {
            "name": "PerformanceFeeInProspectusReferenceDate"
          },
          {
            "name": "RecordDateForSRRI"
          },
          {
            "name": "ShareClassDistributionPolicy"
          },
          {
            "name": "ShareClassExtension"
          },
          {
            "name": "ShareClassLaunchDate"
          },
          {
            "name": "ShareClassLifecycle"
          },
          {
            "name": "SRRI"
          },
          {
            "name": "TERExcludingPerformanceFee"
          },
          {
            "name": "TERExcludingPerformanceFeeDate"
          },
          {
            "name": "TERIncludingPerformanceFee"
          },
          {
            "name": "TERIncludingPerformanceFeeDate"
          },
          {
            "name": "TransferAgentName"
          },
          {
            "name": "BICOfTransferAgent"
          },
          {
            "name": "DomicileOfTransferAgent"
          },
          {
            "name": "FormOfShare"
          },
          {
            "name": "HasDurationHedge"
          },
          {
            "name": "TypeOfEqualization"
          },
          {
            "name": "IsMultiseries"
          },
          {
            "name": "SeriesIssuance"
          },
          {
            "name": "SeriesFrequency"
          },
          {
            "name": "DoesFundIssueSidePocket"
          },
          {
            "name": "HasRedemptionGates"
          },
          {
            "name": "TypeOfAlternativeFundStructureVehicle"
          },
          {
            "name": "BloombergCode"
          },
          {
            "name": "FIGICode"
          },
          {
            "name": "AbbreviatedShareClassName"
          },
          {
            "name": "ValuationFrequency"
          },
          {
            "name": "NAVPublicationTime"
          },
          {
            "name": "IsShareClassEligibleForUCITS"
          },
          {
            "name": "InvestmentStatusDate"
          },
          {
            "name": "LaunchPrice"
          },
          {
            "name": "LaunchPriceCurrency"
          },
          {
            "name": "LaunchPriceDate"
          },
          {
            "name": "EFAMAMainEFCCategory"
          },
          {
            "name": "EFAMAEFCClassificationType"
          },
          {
            "name": "EFAMAActiveEFCClassification"
          },
          {
            "name": "EFAMAEFCInvestmentTheme"
          },
          {
            "name": "PricingMethodology"
          },
          {
            "name": "SinglePricingType"
          },
          {
            "name": "SwingFactor"
          },
          {
            "name": "StandardMinimumRemainingAmount"
          },
          {
            "name": "StandardMinimumRemainingShares"
          },
          {
            "name": "CurrencyOfMinimumRemainingAmount"
          },
          {
            "name": "StandardMinimumRemainingCategory"
          },
          {
            "name": "HurdleRate"
          },
          {
            "name": "HighWaterMark"
          },
          {
            "name": "HasAppliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedSubscriptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "MaximumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "HasAppliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfFund"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfFundReferenceDate"
          },
          {
            "name": "MaximumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "EquivalentTrailerFeeCleanISIN"
          },
          {
            "name": "HasSeparateDistributionFee"
          },
          {
            "name": "DistributionFee"
          },
          {
            "name": "DistributionFeeMaximum"
          },
          {
            "name": "IASector"
          },
          {
            "name": "AbsorbingFundFullShareClassName"
          },
          {
            "name": "AbsorbingFundShareClassISIN"
          },
          {
            "name": "AdministrationFeeMaximum"
          },
          {
            "name": "AnnualDistributionAtFiscalYearEnd"
          },
          {
            "name": "AnnualDistributionYieldAtFiscalYearEnd"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "AppliedRedemptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "BankDetailsSSIForPaymentsProvision"
          },
          {
            "name": "BankDetailsLevelApplication"
          },
          {
            "name": "BenchmarkBloombergTicker"
          },
          {
            "name": "CalculationDateOffsetForRedemption"
          },
          {
            "name": "CalculationDateOffsetForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForCutOffDateOffsetForRedemption"
          },
          {
            "name": "CalendarOrBusinessDaysForCutOffDateOffsetForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForPrePaymentDaysForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForSettlementPeriodForRedemption"
          },
          {
            "name": "CalendarOrBusinessDaysForSettlementPeriodForSubscription"
          },
          {
            "name": "CalendarOrBusinessDaysForTransactions"
          },
          {
            "name": "CFICode"
          },
          {
            "name": "ContingentDeferredSalesChargeExitFee"
          },
          {
            "name": "ContingentDeferredSalesChargeUpfrontFee"
          },
          {
            "name": "CountryISOCodeAlpha2"
          },
          {
            "name": "CountryISOCodeAlpha3"
          },
          {
            "name": "CountryName"
          },
          {
            "name": "CurrenciesOfMulticurrencyShareClass"
          },
          {
            "name": "CurrencyOfMinimalOrMaximumRedemption"
          },
          {
            "name": "CustodianFeeApplied"
          },
          {
            "name": "CustodianFeeAppliedReferenceDate"
          },
          {
            "name": "CustodianFeeMaximum"
          },
          {
            "name": "CutOffDateOffsetForRedemption"
          },
          {
            "name": "CutOffDateOffsetForSubscription"
          },
          {
            "name": "CutOffTimeForRedemption"
          },
          {
            "name": "CutOffTimeForSubscription"
          },
          {
            "name": "CutOffTimeForSwitchIn"
          },
          {
            "name": "CutOffTimeForSwitchOut"
          },
          {
            "name": "DealingDaysOfMultipleRedemptionTradeCycles"
          },
          {
            "name": "DealingDaysOfMultipleSubscriptionTradeCycles"
          },
          {
            "name": "DisseminationRecipient"
          },
          {
            "name": "DistributionFeeReferenceDate"
          },
          {
            "name": "DoesShareClassApplyMandatoryConversion"
          },
          {
            "name": "DoesShareClassApplyPartialDealingDays"
          },
          {
            "name": "DoesShareClassApplyPartialPaymentDays"
          },
          {
            "name": "DormantEndDate"
          },
          {
            "name": "DormantStartDate"
          },
          {
            "name": "ExDividendDateCalendar"
          },
          {
            "name": "ExitCostDescription"
          },
          {
            "name": "HasContingentDeferredSalesChargeFee"
          },
          {
            "name": "HasDilutionLevyAppliedByFund"
          },
          {
            "name": "HasEqualizationMethodForDistribution"
          },
          {
            "name": "HasEqualizationMethodForPerformanceFee"
          },
          {
            "name": "HasForcedRedemption"
          },
          {
            "name": "HasForwardPricing"
          },
          {
            "name": "HasHighWaterMark"
          },
          {
            "name": "HasLockUpForRedemption"
          },
          {
            "name": "HasPreNoticeForSwitchIn"
          },
          {
            "name": "HasPreNoticeForSwitchOut"
          },
          {
            "name": "HasPrePaymentForSubscription"
          },
          {
            "name": "HasRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "HasTripartiteReport"
          },
          {
            "name": "InvestmentStatusDescription"
          },
          {
            "name": "IrregularRedemptionDealingDays"
          },
          {
            "name": "IrregularSubscriptionDealingDays"
          },
          {
            "name": "IsMulticurrencyShareClass"
          },
          {
            "name": "IsRestrictedToSeparateFeeArrangement"
          },
          {
            "name": "IsStructuredFinanceProduct"
          },
          {
            "name": "IsValidISIN"
          },
          {
            "name": "LiquidationStartDate"
          },
          {
            "name": "LockUpComment"
          },
          {
            "name": "LockUpPeriodInDays"
          },
          {
            "name": "ManagementFeeMinimum"
          },
          {
            "name": "MandatoryShareConversionDescriptionDetails"
          },
          {
            "name": "MarketsRelevantToFundTradingCalendar"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsAmount"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsNAV"
          },
          {
            "name": "MaximalNumberOfPossibleDecimalsShares"
          },
          {
            "name": "MaximumInitialRedemptionInAmount"
          },
          {
            "name": "MaximumInitialRedemptionInShares"
          },
          {
            "name": "MaximumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "MaximumSubsequentRedemptionInAmount"
          },
          {
            "name": "MaximumSubsequentRedemptionInShares"
          },
          {
            "name": "MergerRatio"
          },
          {
            "name": "MinimalInitialRedemptionInAmount"
          },
          {
            "name": "MinimalInitialRedemptionInShares"
          },
          {
            "name": "MinimalRedemptionCategory"
          },
          {
            "name": "MinimalSubsequentRedemptionInAmount"
          },
          {
            "name": "MinimalSubsequentRedemptionInShares"
          },
          {
            "name": "MinimumRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "MinimumRedemptionFeeInFavourOfFund"
          },
          {
            "name": "MinimumSubscriptionFeeInFavourOfFund"
          },
          {
            "name": "MonthlyRedemptionDealingDays"
          },
          {
            "name": "MonthlySubscriptionDealingDays"
          },
          {
            "name": "NasdaqFundNetworkNFNIdentifier"
          },
          {
            "name": "NoTradingDate"
          },
          {
            "name": "NumberOfPossibleRedemptionsWithinPeriod"
          },
          {
            "name": "NumberOfPossibleSubscriptionsWithinPeriod"
          },
          {
            "name": "PartialDealingDaysDateAndTime"
          },
          {
            "name": "PartialPaymentDaysDateAndTime"
          },
          {
            "name": "PaymentDateCalendar"
          },
          {
            "name": "PerformanceFeeMinimum"
          },
          {
            "name": "PreNoticeCutOffForRedemption"
          },
          {
            "name": "PreNoticeCutOffForSubscription"
          },
          {
            "name": "PrePaymentCutOffTimeForSubscription"
          },
          {
            "name": "PrePaymentDaysForSubscription"
          },
          {
            "name": "RecordDateCalendar"
          },
          {
            "name": "RedemptionTradeCyclePeriod"
          },
          {
            "name": "RoundingMethodForPrices"
          },
          {
            "name": "RoundingMethodForRedemptionInAmount"
          },
          {
            "name": "RoundingMethodForRedemptionInShares"
          },
          {
            "name": "RoundingMethodForSubscriptionInAmount"
          },
          {
            "name": "RoundingMethodForSubscriptionInShares"
          },
          {
            "name": "SettlementPeriodForRedemption"
          },
          {
            "name": "SettlementPeriodForSubscription"
          },
          {
            "name": "SettlementPeriodForSwitchIn"
          },
          {
            "name": "SettlementPeriodForSwitchOut"
          },
          {
            "name": "ShareClassDividendType"
          },
          {
            "name": "SingleRegisterAccountRestrictions"
          },
          {
            "name": "SubscriptionPeriodEndDate"
          },
          {
            "name": "SubscriptionPeriodStartDate"
          },
          {
            "name": "SubscriptionTradeCyclePeriod"
          },
          {
            "name": "SwitchInNoticePeriod"
          },
          {
            "name": "SwitchOutNoticePeriod"
          },
          {
            "name": "TerminationDate"
          },
          {
            "name": "TimeZoneForCutOff"
          },
          {
            "name": "TimeZoneForCutOffUsingTZDatabase"
          },
          {
            "name": "ValuationFrequencyDetail"
          },
          {
            "name": "ValuationReduction"
          },
          {
            "name": "WeeklyRedemptionDealingDays"
          },
          {
            "name": "WeeklySubscriptionDealingDays"
          },
          {
            "name": "YearlyRedemptionDealingDays"
          },
          {
            "name": "YearlySubscriptionDealingDays"
          },
          {
            "name": "FundId"
          },
          {
            "name": "ShareClassCurrencyId"
          },
          {
            "name": "ImageUri"
          }
        ]
      }
    },
    {
      "name": "ShareClassDynamicFieldName",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AskNAV"
          },
          {
            "name": "AskNAVDate"
          },
          {
            "name": "AuMShareClass"
          },
          {
            "name": "AuMShareClassDate"
          },
          {
            "name": "BidNAV"
          },
          {
            "name": "BidNAVDate"
          },
          {
            "name": "DividendAnnouncementDate"
          },
          {
            "name": "DividendCurrency"
          },
          {
            "name": "DividendExDate"
          },
          {
            "name": "DividendGross"
          },
          {
            "name": "DividendNet"
          },
          {
            "name": "DividendPaymentDate"
          },
          {
            "name": "DividendRecordDate"
          },
          {
            "name": "DynamicCurrency"
          },
          {
            "name": "DynamicDataType"
          },
          {
            "name": "DynamicValue"
          },
          {
            "name": "EqualisationRate"
          },
          {
            "name": "GeneralReferenceDate"
          },
          {
            "name": "IsDividendFinal"
          },
          {
            "name": "NoSShareClass"
          },
          {
            "name": "NoSShareClassDate"
          },
          {
            "name": "SplitRatio"
          },
          {
            "name": "SplitReferenceDate"
          },
          {
            "name": "TaxDeductedReinvestedAmount"
          },
          {
            "name": "TaxDeductedReinvestedAmountReferenceDate"
          },
          {
            "name": "TaxableIncomeperDividend"
          },
          {
            "name": "TaxableIncomeperShareEU"
          },
          {
            "name": "TransactionNAV"
          },
          {
            "name": "TransactionNAVDate"
          },
          {
            "name": "ValuationNAV"
          },
          {
            "name": "ValuationNAVDate"
          },
          {
            "name": "YieldOneDayGross"
          },
          {
            "name": "YieldOneDayNet"
          },
          {
            "name": "YieldSevenDayGross"
          },
          {
            "name": "YieldSevenDayNet"
          },
          {
            "name": "YieldThirtyDayGross"
          },
          {
            "name": "YieldThirtyDayNet"
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
