export type Pricing = {
  "version": "0.1.0",
  "name": "pricing",
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
      "accounts": [],
      "args": []
    },
    {
      "name": "payUsd",
      "accounts": [
        {
          "name": "from",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solUsdPriceAccount",
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
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CustomError",
      "msg": "Custom error message"
    },
    {
      "code": 6001,
      "name": "PriceUnavailable",
      "msg": "Price is currently not available"
    },
    {
      "code": 6002,
      "name": "InvalidPriceFeedId",
      "msg": "Invalid price feed id"
    }
  ]
};

export const IDL: Pricing = {
  "version": "0.1.0",
  "name": "pricing",
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
      "accounts": [],
      "args": []
    },
    {
      "name": "payUsd",
      "accounts": [
        {
          "name": "from",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solUsdPriceAccount",
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
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CustomError",
      "msg": "Custom error message"
    },
    {
      "code": 6001,
      "name": "PriceUnavailable",
      "msg": "Price is currently not available"
    },
    {
      "code": 6002,
      "name": "InvalidPriceFeedId",
      "msg": "Invalid price feed id"
    }
  ]
};
