# Key Concepts

Vault

* A GLAM vault is like a secure program wallet that can hold any onchain assets. You can transfer tokens to the vault and interact with DeFi protocols such as Jupiter, Drift, Liquid Staking, Native Staking etc via the vault.

Mint

* Mint is a program account that represents a specific token. It serves as the blueprint or definition for a token, including its supply, decimal places, and other configurations.

Fund

* Each vault or mint has a unique Fund account that stores vault/mint states & access control policies onchain.

Owner / Manager

* Vault owner has full control of the vault. Typically the owner is the person (represented by a pubkey) that created the vault. GLAM allows changes in the ownership.

Delegate

* A delegate is someone the vault owner trusts and grants permissions to. A vault can have as many as delegates (the limit is determined by [account max size](https://solana.com/docs/core/accounts#accountinfo))

Integration

* Protocols supported by GLAM are also called Integrations. If a vault needs to interact with Jupiter, the `jupiter`  integration must be enabled.

Fine Grained Access Control (FGAC)

* FGAC is a way to control who can do what in a system, but with very detailed rules.

Access Control List (ACL)

* ACL is a way to control who can do what in a system, but with very detailed rules.
