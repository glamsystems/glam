export type Policy = {
  "version": "0.1.0",
  "name": "policy",
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

export const IDL: Policy = {
  "version": "0.1.0",
  "name": "policy",
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
