import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export class AssetMeta {
  pricingAccount: PublicKey = new PublicKey(0);
  programId?: PublicKey;
}

export const ASSETS_MAINNET: Map<string, AssetMeta> = new Map([
  [
    // wSOL
    "So11111111111111111111111111111111111111112",
    {
      pricingAccount: new PublicKey(
        "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG" // pyth
      )
    }
  ],
  [
    // USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    {
      pricingAccount: new PublicKey(
        "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD" // pyth
      )
    }
  ],
  [
    // USDT
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    {
      pricingAccount: new PublicKey(
        "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL" // pyth
      )
    }
  ],
  [
    // PYUSD
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    {
      pricingAccount: new PublicKey(0)
    }
  ],
  [
    // BTC
    "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    {
      pricingAccount: new PublicKey(
        "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr" // pyth
      )
    }
  ],
  [
    // tBTC
    "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
    {
      pricingAccount: new PublicKey(
        "6qCHPXxQiCiM3dEE4W6fpZk17uSZW9WBpD7cyN8Tg2Ac" // pyth
      )
    }
  ],
  [
    // ETH
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    {
      pricingAccount: new PublicKey(
        "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB" // pyth
      )
    }
  ],
  [
    // PYTH
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    {
      pricingAccount: new PublicKey(
        "nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue" // state
      )
    }
  ],
  [
    // BONK
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    {
      pricingAccount: new PublicKey(
        "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN" // state
      )
    }
  ],
  [
    // mSOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    {
      pricingAccount: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC" // state
      )
    }
  ]
]);

export const ASSETS_DEVNET: Map<string, AssetMeta> = new Map([
  [
    // wSOL
    "So11111111111111111111111111111111111111112",
    {
      pricingAccount: new PublicKey(
        "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix" // pyth
      )
    }
  ],
  [
    // USDC (Drift)
    "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2",
    {
      pricingAccount: new PublicKey(
        "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7" // pyth
      )
    }
  ],
  [
    // BTC (Drift)
    "3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv",
    {
      pricingAccount: new PublicKey(
        "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J" // pyth
      )
    }
  ],
  [
    // mSOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    {
      pricingAccount: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC" // state
      )
    }
  ],

  //
  // LOCALNET
  //

  [
    // USDC
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef",
    {
      pricingAccount: new PublicKey(
        "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7" // pyth
      )
    }
  ],
  [
    // BTC
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd",
    {
      pricingAccount: new PublicKey(
        "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J" // pyth
      ),
      programId: TOKEN_2022_PROGRAM_ID
    }
  ],
  [
    // ETH
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m",
    {
      pricingAccount: new PublicKey(
        "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw" // pyth
      )
    }
  ]
]);
