export type Strategy = {
  "version": "0.1.0",
  "name": "strategy",
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
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CustomError",
      "msg": "Custom error message"
    }
  ]
};

export const IDL: Strategy = {
  "version": "0.1.0",
  "name": "strategy",
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
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CustomError",
      "msg": "Custom error message"
    }
  ]
};
