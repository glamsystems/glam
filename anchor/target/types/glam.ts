/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/glam.json`.
 */
export type Glam = {
  "address": "GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP",
  "metadata": {
    "name": "glam",
    "version": "0.2.9",
    "spec": "0.1.0",
    "description": "Glam Protocol"
  },
  "instructions": [
    {
      "name": "addShareClass",
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
          "name": "fund",
          "writable": true
        },
        {
          "name": "openfunds",
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
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
      "name": "closeFund",
      "discriminator": [
        230,
        183,
        3,
        112,
        236,
        252,
        5,
        185
      ],
      "accounts": [
        {
          "name": "fund",
          "writable": true
        },
        {
          "name": "openfunds",
          "writable": true
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
          "name": "manager",
          "writable": true,
          "signer": true,
          "relations": [
            "fund"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeShareClass",
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
          "name": "fund",
          "writable": true
        },
        {
          "name": "shareClass",
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
                "path": "shareClass"
              }
            ]
          }
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
      "name": "deactivateStakeAccounts",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
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
      "name": "driftDeleteUser",
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
          "name": "fund"
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
          "name": "state",
          "writable": true
        },
        {
          "name": "treasury",
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
      "args": [
        {
          "name": "subAccountId",
          "type": "u16"
        }
      ]
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
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "treasury",
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
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "treasuryAta",
          "writable": true
        },
        {
          "name": "manager",
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
          "name": "subAccountId",
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
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "treasury",
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
      "args": []
    },
    {
      "name": "driftUpdateUserCustomMarginRatio",
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
          "name": "fund"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "treasury",
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
          "name": "fund"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "treasury",
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
          "name": "fund"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "treasury",
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
          "name": "user",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "treasury",
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
          "name": "treasuryAta",
          "writable": true
        },
        {
          "name": "driftAta",
          "writable": true
        },
        {
          "name": "driftSigner"
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
          "name": "subAccountId",
          "type": "u16"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeAndDelegateStake",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
        },
        {
          "name": "treasuryStakeAccount",
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
      "name": "initializeFund",
      "discriminator": [
        212,
        42,
        24,
        245,
        146,
        141,
        78,
        198
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
                "path": "fund_model.created"
              }
            ]
          }
        },
        {
          "name": "openfunds",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  102,
                  117,
                  110,
                  100,
                  115
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fund",
          "type": {
            "defined": {
              "name": "fundModel"
            }
          }
        }
      ]
    },
    {
      "name": "jupiterSwap",
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
          "name": "fund",
          "writable": true
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
          "name": "inputTreasuryAta",
          "docs": [
            "input_treasury_ata to input_signer_ata"
          ],
          "writable": true
        },
        {
          "name": "inputSignerAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
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
          "name": "outputSignerAta",
          "writable": true
        },
        {
          "name": "outputTreasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
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
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "marinadeClaimTickets",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
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
                "path": "treasury"
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
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
          "name": "treasuryStakeAccount",
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
                "path": "treasury"
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
          "name": "manager",
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
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
      "name": "mergeStakeAccounts",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
      "name": "splitStakeAccount",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
        },
        {
          "name": "stakePoolProgram"
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
                "path": "treasury"
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
        "Deposit a stake account into the stake pool and receive pool token"
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
        },
        {
          "name": "treasuryStakeAccount",
          "writable": true
        },
        {
          "name": "mintTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
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
          "name": "stakePoolProgram"
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund"
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
          },
          "relations": [
            "fund"
          ]
        },
        {
          "name": "stakePoolProgram"
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
        },
        {
          "name": "treasuryStakeAccount",
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
          "name": "stakePoolProgram"
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
          "name": "shareClass",
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
                "path": "shareClass"
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
          "name": "treasuryAta",
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
          "name": "fund"
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
      "name": "updateFund",
      "discriminator": [
        132,
        171,
        13,
        83,
        34,
        122,
        82,
        155
      ],
      "accounts": [
        {
          "name": "fund",
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
          "name": "fund",
          "type": {
            "defined": {
              "name": "fundModel"
            }
          }
        }
      ]
    },
    {
      "name": "withdrawFromStakeAccounts",
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
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "fund",
          "writable": true
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
          },
          "relations": [
            "fund"
          ]
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
      "name": "wsolUnwrap",
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
          "name": "fund"
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
          "name": "treasuryWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
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
          "name": "fund"
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
          "name": "treasuryWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
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
      "name": "fundAccount",
      "discriminator": [
        49,
        104,
        168,
        214,
        134,
        180,
        173,
        154
      ]
    },
    {
      "name": "fundMetadataAccount",
      "discriminator": [
        214,
        24,
        35,
        92,
        16,
        104,
        166,
        6
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
    }
  ],
  "errors": [
    {
      "code": 6000,
<<<<<<< HEAD
<<<<<<< HEAD
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
    },
    {
      "code": 6007,
      "name": "invalidAssetForSwap",
      "msg": "Asset cannot be swapped"
    },
    {
      "code": 6008,
      "name": "invalidSwap",
      "msg": "Swap failed"
=======
      "name": "fundNotActive",
      "msg": "Fund is not active"
=======
      "name": "transfersDisabled",
      "msg": "Policy violation: transfers disabled"
>>>>>>> fe953d9 (activated stake calc)
    },
    {
      "code": 6001,
      "name": "amountTooBig",
      "msg": "Policy violation: amount too big"
    },
    {
      "code": 6002,
<<<<<<< HEAD
      "name": "invalidAssetSubscribe",
      "msg": "Asset not allowed to subscribe"
    },
    {
      "code": 6003,
      "name": "invalidPricingOracle",
      "msg": "Invalid oracle for asset price"
    },
    {
      "code": 6004,
      "name": "invalidRemainingAccounts",
      "msg": "Invalid accounts: the transaction is malformed"
    },
    {
      "code": 6005,
      "name": "invalidTreasuryAccount",
      "msg": "Invalid treasury ata"
    },
    {
      "code": 6006,
      "name": "invalidSignerAccount",
      "msg": "Invalid signer ata"
    },
    {
      "code": 6007,
      "name": "invalidAssetPrice",
      "msg": "Invalid asset price"
    },
    {
      "code": 6008,
      "name": "invalidStableCoinPriceForSubscribe",
      "msg": "Subscription not allowed: invalid stable coin price"
    },
    {
      "code": 6009,
      "name": "subscribeRedeemPaused",
      "msg": "Fund is paused for subscription and redemption"
    },
    {
      "code": 6010,
      "name": "invalidPolicyAccount",
      "msg": "Policy account is mandatory"
>>>>>>> 601e7b9 (anchor: aum from external accounts)
=======
      "name": "lockOut",
      "msg": "Policy violation: lock out period"
>>>>>>> fe953d9 (activated stake calc)
    }
  ],
  "types": [
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
            "name": "fundWebsiteofManCo"
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
            "name": "manager",
            "type": {
              "option": "pubkey"
            }
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
            "name": "timeCreated"
          },
          {
            "name": "isEnabled"
          },
          {
            "name": "assets"
          },
          {
            "name": "assetsWeights"
          },
          {
            "name": "shareClassAllowlist"
          },
          {
            "name": "shareClassBlocklist"
          },
          {
            "name": "delegateAcls"
          },
          {
            "name": "integrationAcls"
          },
          {
            "name": "externalTreasuryAccounts"
          },
          {
            "name": "lockUp"
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
          },
          {
            "name": "vecDelegateAcl",
            "fields": [
              {
                "name": "val",
                "type": {
                  "vec": {
                    "defined": {
                      "name": "delegateAcl"
                    }
                  }
                }
              }
            ]
          },
          {
            "name": "vecIntegrationAcl",
            "fields": [
              {
                "name": "val",
                "type": {
                  "vec": {
                    "defined": {
                      "name": "integrationAcl"
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "fundAccount",
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
            "name": "openfunds",
            "type": "pubkey"
          },
          {
            "name": "engine",
            "type": "pubkey"
          },
          {
            "name": "shareClasses",
            "type": {
              "vec": "pubkey"
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
            "name": "openfundsUri",
            "type": "string"
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
      "name": "fundMetadataAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundPubkey",
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
      "name": "fundModel",
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
              "vec": "pubkey"
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
                "defined": {
                  "name": "shareClassModel"
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
            "name": "manager",
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
              "vec": {
                "defined": {
                  "name": "delegateAcl"
                }
              }
            }
          },
          {
            "name": "integrationAcls",
            "type": {
              "vec": {
                "defined": {
                  "name": "integrationAcl"
                }
              }
            }
          },
          {
            "name": "isRawOpenfunds",
            "type": "bool"
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
      "name": "integrationAcl",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "defined": {
                "name": "integrationName"
              }
            }
          },
          {
            "name": "features",
            "type": {
              "vec": {
                "defined": {
                  "name": "integrationFeature"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "integrationFeature",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "all"
          }
        ]
      }
    },
    {
      "name": "integrationName",
      "docs": [
        "* Integration ACL"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "drift"
          },
          {
            "name": "stakePool"
          },
          {
            "name": "nativeStaking"
          },
          {
            "name": "marinade"
          },
          {
            "name": "jupiter"
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
      "name": "permission",
      "docs": [
        "* Delegate ACL"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "driftDeposit"
          },
          {
            "name": "driftWithdraw"
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
            "name": "jupiterSwapFundAssets"
          },
          {
            "name": "jupiterSwapAnyAsset"
          },
          {
            "name": "wSolWrap"
          },
          {
            "name": "wSolUnwrap"
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
            "name": "allInFeeApplied"
          },
          {
            "name": "allInFeeDate"
          },
          {
            "name": "allInFeeIncludesTransactionCosts"
          },
          {
            "name": "allInFeeMaximum"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfDistributor"
          },
          {
            "name": "appliedSubscriptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "benchmark"
          },
          {
            "name": "countryLegalRegistration"
          },
          {
            "name": "countryMarketingDistribution"
          },
          {
            "name": "currencyHedgeShareClass"
          },
          {
            "name": "currencyOfMinimalSubscription"
          },
          {
            "name": "distributionDeclarationFrequency"
          },
          {
            "name": "fullShareClassName"
          },
          {
            "name": "hasAllInFee"
          },
          {
            "name": "hasOngoingCharges"
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
            "name": "isEtf"
          },
          {
            "name": "isRdrCompliant"
          },
          {
            "name": "isTrailerFeeClean"
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
            "name": "ongoingCharges"
          },
          {
            "name": "ongoingChargesDate"
          },
          {
            "name": "performanceFeeApplied"
          },
          {
            "name": "performanceFeeAppliedReferenceDate"
          },
          {
            "name": "performanceFeeInProspectus"
          },
          {
            "name": "performanceFeeInProspectusReferenceDate"
          },
          {
            "name": "recordDateForSrri"
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
            "name": "terExcludingPerformanceFee"
          },
          {
            "name": "terExcludingPerformanceFeeDate"
          },
          {
            "name": "terIncludingPerformanceFee"
          },
          {
            "name": "terIncludingPerformanceFeeDate"
          },
          {
            "name": "transferAgentName"
          },
          {
            "name": "bicOfTransferAgent"
          },
          {
            "name": "domicileOfTransferAgent"
          },
          {
            "name": "formOfShare"
          },
          {
            "name": "hasDurationHedge"
          },
          {
            "name": "typeOfEqualization"
          },
          {
            "name": "isMultiseries"
          },
          {
            "name": "seriesIssuance"
          },
          {
            "name": "seriesFrequency"
          },
          {
            "name": "doesFundIssueSidePocket"
          },
          {
            "name": "hasRedemptionGates"
          },
          {
            "name": "typeOfAlternativeFundStructureVehicle"
          },
          {
            "name": "bloombergCode"
          },
          {
            "name": "figiCode"
          },
          {
            "name": "abbreviatedShareClassName"
          },
          {
            "name": "valuationFrequency"
          },
          {
            "name": "navPublicationTime"
          },
          {
            "name": "isShareClassEligibleForUcits"
          },
          {
            "name": "investmentStatusDate"
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
            "name": "efamaMainEfcCategory"
          },
          {
            "name": "efamaefcClassificationType"
          },
          {
            "name": "efamaActiveEfcClassification"
          },
          {
            "name": "efamaefcInvestmentTheme"
          },
          {
            "name": "pricingMethodology"
          },
          {
            "name": "singlePricingType"
          },
          {
            "name": "swingFactor"
          },
          {
            "name": "standardMinimumRemainingAmount"
          },
          {
            "name": "standardMinimumRemainingShares"
          },
          {
            "name": "currencyOfMinimumRemainingAmount"
          },
          {
            "name": "standardMinimumRemainingCategory"
          },
          {
            "name": "hurdleRate"
          },
          {
            "name": "highWaterMark"
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
            "name": "equivalentTrailerFeeCleanIsin"
          },
          {
            "name": "hasSeparateDistributionFee"
          },
          {
            "name": "distributionFee"
          },
          {
            "name": "distributionFeeMaximum"
          },
          {
            "name": "iaSector"
          },
          {
            "name": "absorbingFundFullShareClassName"
          },
          {
            "name": "absorbingFundShareClassIsin"
          },
          {
            "name": "administrationFeeMaximum"
          },
          {
            "name": "annualDistributionAtFiscalYearEnd"
          },
          {
            "name": "annualDistributionYieldAtFiscalYearEnd"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "appliedRedemptionFeeInFavourOfDistributorReferenceDate"
          },
          {
            "name": "bankDetailsSsiForPaymentsProvision"
          },
          {
            "name": "bankDetailsLevelApplication"
          },
          {
            "name": "benchmarkBloombergTicker"
          },
          {
            "name": "calculationDateOffsetForRedemption"
          },
          {
            "name": "calculationDateOffsetForSubscription"
          },
          {
            "name": "calendarOrBusinessDaysForCutOffDateOffsetForRedemption"
          },
          {
            "name": "calendarOrBusinessDaysForCutOffDateOffsetForSubscription"
          },
          {
            "name": "calendarOrBusinessDaysForPrePaymentDaysForSubscription"
          },
          {
            "name": "calendarOrBusinessDaysForSettlementPeriodForRedemption"
          },
          {
            "name": "calendarOrBusinessDaysForSettlementPeriodForSubscription"
          },
          {
            "name": "calendarOrBusinessDaysForTransactions"
          },
          {
            "name": "cfiCode"
          },
          {
            "name": "contingentDeferredSalesChargeExitFee"
          },
          {
            "name": "contingentDeferredSalesChargeUpfrontFee"
          },
          {
            "name": "countryIsoCodeAlpha2"
          },
          {
            "name": "countryIsoCodeAlpha3"
          },
          {
            "name": "countryName"
          },
          {
            "name": "currenciesOfMulticurrencyShareClass"
          },
          {
            "name": "currencyOfMinimalOrMaximumRedemption"
          },
          {
            "name": "custodianFeeApplied"
          },
          {
            "name": "custodianFeeAppliedReferenceDate"
          },
          {
            "name": "custodianFeeMaximum"
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
            "name": "cutOffTimeForSwitchIn"
          },
          {
            "name": "cutOffTimeForSwitchOut"
          },
          {
            "name": "dealingDaysOfMultipleRedemptionTradeCycles"
          },
          {
            "name": "dealingDaysOfMultipleSubscriptionTradeCycles"
          },
          {
            "name": "disseminationRecipient"
          },
          {
            "name": "distributionFeeReferenceDate"
          },
          {
            "name": "doesShareClassApplyMandatoryConversion"
          },
          {
            "name": "doesShareClassApplyPartialDealingDays"
          },
          {
            "name": "doesShareClassApplyPartialPaymentDays"
          },
          {
            "name": "dormantEndDate"
          },
          {
            "name": "dormantStartDate"
          },
          {
            "name": "exDividendDateCalendar"
          },
          {
            "name": "exitCostDescription"
          },
          {
            "name": "hasContingentDeferredSalesChargeFee"
          },
          {
            "name": "hasDilutionLevyAppliedByFund"
          },
          {
            "name": "hasEqualizationMethodForDistribution"
          },
          {
            "name": "hasEqualizationMethodForPerformanceFee"
          },
          {
            "name": "hasForcedRedemption"
          },
          {
            "name": "hasForwardPricing"
          },
          {
            "name": "hasHighWaterMark"
          },
          {
            "name": "hasLockUpForRedemption"
          },
          {
            "name": "hasPreNoticeForSwitchIn"
          },
          {
            "name": "hasPreNoticeForSwitchOut"
          },
          {
            "name": "hasPrePaymentForSubscription"
          },
          {
            "name": "hasRedemptionFeeInFavourOfDistributor"
          },
          {
            "name": "hasTripartiteReport"
          },
          {
            "name": "investmentStatusDescription"
          },
          {
            "name": "irregularRedemptionDealingDays"
          },
          {
            "name": "irregularSubscriptionDealingDays"
          },
          {
            "name": "isMulticurrencyShareClass"
          },
          {
            "name": "isRestrictedToSeparateFeeArrangement"
          },
          {
            "name": "isStructuredFinanceProduct"
          },
          {
            "name": "isValidIsin"
          },
          {
            "name": "liquidationStartDate"
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
            "name": "mandatoryShareConversionDescriptionDetails"
          },
          {
            "name": "marketsRelevantToFundTradingCalendar"
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
            "name": "mergerRatio"
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
            "name": "monthlyRedemptionDealingDays"
          },
          {
            "name": "monthlySubscriptionDealingDays"
          },
          {
            "name": "nasdaqFundNetworkNfnIdentifier"
          },
          {
            "name": "noTradingDate"
          },
          {
            "name": "numberOfPossibleRedemptionsWithinPeriod"
          },
          {
            "name": "numberOfPossibleSubscriptionsWithinPeriod"
          },
          {
            "name": "partialDealingDaysDateAndTime"
          },
          {
            "name": "partialPaymentDaysDateAndTime"
          },
          {
            "name": "paymentDateCalendar"
          },
          {
            "name": "performanceFeeMinimum"
          },
          {
            "name": "preNoticeCutOffForRedemption"
          },
          {
            "name": "preNoticeCutOffForSubscription"
          },
          {
            "name": "prePaymentCutOffTimeForSubscription"
          },
          {
            "name": "prePaymentDaysForSubscription"
          },
          {
            "name": "recordDateCalendar"
          },
          {
            "name": "redemptionTradeCyclePeriod"
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
            "name": "settlementPeriodForRedemption"
          },
          {
            "name": "settlementPeriodForSubscription"
          },
          {
            "name": "settlementPeriodForSwitchIn"
          },
          {
            "name": "settlementPeriodForSwitchOut"
          },
          {
            "name": "shareClassDividendType"
          },
          {
            "name": "singleRegisterAccountRestrictions"
          },
          {
            "name": "subscriptionPeriodEndDate"
          },
          {
            "name": "subscriptionPeriodStartDate"
          },
          {
            "name": "subscriptionTradeCyclePeriod"
          },
          {
            "name": "switchInNoticePeriod"
          },
          {
            "name": "switchOutNoticePeriod"
          },
          {
            "name": "terminationDate"
          },
          {
            "name": "timeZoneForCutOff"
          },
          {
            "name": "timeZoneForCutOffUsingTzDatabase"
          },
          {
            "name": "valuationFrequencyDetail"
          },
          {
            "name": "valuationReduction"
          },
          {
            "name": "weeklyRedemptionDealingDays"
          },
          {
            "name": "weeklySubscriptionDealingDays"
          },
          {
            "name": "yearlyRedemptionDealingDays"
          },
          {
            "name": "yearlySubscriptionDealingDays"
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
            "name": "fundId",
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
            "name": "isRawOpenfunds",
            "type": "bool"
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
          },
          {
            "name": "allowlist",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "blocklist",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "lockUpPeriodInSeconds",
            "type": "i32"
          },
          {
            "name": "permanentDelegate",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "defaultAccountStateFrozen",
            "type": "bool"
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
