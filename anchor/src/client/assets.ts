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
      ),
    },
  ],
  [
    // USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    {
      pricingAccount: new PublicKey(
        "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD" // pyth
      ),
    },
  ],
  [
    // USDT
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    {
      pricingAccount: new PublicKey(
        "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL" // pyth
      ),
    },
  ],
  [
    // PYUSD
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    {
      pricingAccount: new PublicKey(0),
    },
  ],
  [
    // BTC
    "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    {
      pricingAccount: new PublicKey(
        "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr" // pyth
      ),
    },
  ],
  [
    // tBTC
    "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
    {
      pricingAccount: new PublicKey(
        "6qCHPXxQiCiM3dEE4W6fpZk17uSZW9WBpD7cyN8Tg2Ac" // pyth
      ),
    },
  ],
  [
    // ETH
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    {
      pricingAccount: new PublicKey(
        "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB" // pyth
      ),
    },
  ],
  [
    // PYTH
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    {
      pricingAccount: new PublicKey(
        "nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue" // pyth
      ),
    },
  ],
  [
    // BONK
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    {
      pricingAccount: new PublicKey(
        "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN" // pyth
      ),
    },
  ],
  [
    // mSOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    {
      pricingAccount: new PublicKey(
        "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9" // pyth
      ),
    },
  ],

  //
  // LST - autogen
  //
  [
    // fpSOL - FP SOL
    "fpSoL8EJ7UA5yJxFKWk1MFiWi35w8CbH36G5B9d7DsV",
    {
      pricingAccount: new PublicKey(
        "GutG5bcmEZw15WmPHNVMWHU77c6t8CEinUEdPLYz3doa" // state
      ),
    },
  ],
  [
    // wifSOL - dogwifSOL
    "Fi5GayacZzUrfaCRCJtBz2vSYkGF56xjgCceZx5SbXwq",
    {
      pricingAccount: new PublicKey(
        "9Z8yimuc3bQCWLDyMhe6jfWqNk9EggyJZUo8TLnYsqhN" // state
      ),
    },
  ],
  [
    // pathSOL - Pathfinders SOL
    "pathdXw4He1Xk3eX84pDdDZnGKEme3GivBamGCVPZ5a",
    {
      pricingAccount: new PublicKey(
        "GM7TwD34n8HmDP9XcT6bD3JJuNniKJkrKQinHqmqHarz" // state
      ),
    },
  ],
  [
    // JupSOL - Jupiter Staked SOL
    "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
    {
      pricingAccount: new PublicKey(
        "8VpRhuxa7sUUepdY3kQiTmX9rS5vx4WgaXiAnXq4KCtr" // state
      ),
    },
  ],
  [
    // juicingJupSOL - Juicing Jupiter SOL
    "BgYgFYq4A9a2o5S1QbWkmYVFBh7LBQL8YvugdhieFg38",
    {
      pricingAccount: new PublicKey(
        "4mBwcXKJN2vz6MJikNTgVBSY5vYnyjZk7txd8j3K46Ei" // state
      ),
    },
  ],
  [
    // phaseSOL - Phase Labs SOL
    "phaseZSfPxTDBpiVb96H4XFSD8xHeHxZre5HerehBJG",
    {
      pricingAccount: new PublicKey(
        "phasejkG1akKgqkLvfWzWY17evnH6mSWznnUspmpyeG" // state
      ),
    },
  ],
  [
    // banxSOL - banxSOL
    "BANXyWgPpa519e2MtQF1ecRbKYKKDMXPF1dyBxUq9NQG",
    {
      pricingAccount: new PublicKey(
        "4fdMvFuyNboQ5Kr93X16f1tFcTeEkvfNwNAeSrzY3afb" // state
      ),
    },
  ],
  [
    // iceSOL - iceSOL
    "iceSdwqztAQFuH6En49HWwMxwthKMnGzLFQcMN3Bqhj",
    {
      pricingAccount: new PublicKey(
        "EVXQHaLSJyUNrnBGfXUnvEi4DvVz4UJ3GnoKGVQVxrjr" // state
      ),
    },
  ],
  [
    // fmSOL - SolanaFM Staked SOL
    "fmSoLKzBY6h9b5RQ67UVs7xE3Ym6mx2ChpPxHdoaVho",
    {
      pricingAccount: new PublicKey(
        "5FYTvZgc7QEGZSDmbJn5hrtjtRtyFZo5vR7gL1jJYanE" // state
      ),
    },
  ],
  [
    // BurnSOL - BurnDAO
    "AxM7a5HNmRNHbND6h5ZMSsU8n3NLa1tskoN6m5mAgVvL",
    {
      pricingAccount: new PublicKey(
        "CAEsfzw43mvaVauCxXCSJh8DvnFsTMiTyeL1kjs6UwaT" // state
      ),
    },
  ],
  [
    // mallowSOL - mallowSOL
    "MLLWWq9TLHK3oQznWqwPyqD7kH4LXTHSKXK4yLz7LjD",
    {
      pricingAccount: new PublicKey(
        "7thbAQrn9oRJsbz2CchoPSujGYpu4hCHnVrniBHupQsx" // state
      ),
    },
  ],
  [
    // pwrSOL - Power Staked SOL
    "pWrSoLAhue6jUxUkbWgmEy5rD9VJzkFmvfTDV5KgNuu",
    {
      pricingAccount: new PublicKey(
        "DfiQgSvpW3Dy4gKfhtdHnWGHwFUrE8exvaxqjtMtAVxk" // state
      ),
    },
  ],
  [
    // superSOL - Superfast Staked SOL
    "suPer8CPwxoJPQ7zksGMwFvjBQhjAHwUMmPV4FVatBw",
    {
      pricingAccount: new PublicKey(
        "4dZDUL3BFJUFeqS3Y3cwkc84Rs6mgVHRYGt1LJvhooW4" // state
      ),
    },
  ],
  [
    // jucySOL - Juicy SOL
    "jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC",
    {
      pricingAccount: new PublicKey(
        "AZGSr2fUyKkPLMhAW6WUEKEsQiRMAFKf8Fjnt4MFFaGv" // state
      ),
    },
  ],
  [
    // bonkSOL - bonkSOL
    "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
    {
      pricingAccount: new PublicKey(
        "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC" // state
      ),
    },
  ],
  [
    // dSOL - Drift Staked SOL
    "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ",
    {
      pricingAccount: new PublicKey(
        "9mhGNSPArRMHpLDMSmxAvuoizBqtBGqYdT8WGuqgxNdn" // state
      ),
    },
  ],
  [
    // compassSOL - Compass SOL
    "Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h",
    {
      pricingAccount: new PublicKey(
        "AwDeTcW6BovNYR34Df1TPm4bFwswa4CJY4YPye2LXtPS" // state
      ),
    },
  ],
  [
    // picoSOL - picoSOL
    "picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX",
    {
      pricingAccount: new PublicKey(
        "8Dv3hNYcEWEaa4qVx9BTN1Wfvtha1z8cWDUXb7KVACVe" // state
      ),
    },
  ],
  [
    // clockSOL - Overclock SOL
    "GRJQtWwdJmp5LLpy8JWjPgn5FnLyqSJGNhn5ZnCTFUwM",
    {
      pricingAccount: new PublicKey(
        "6e2LpgytfG3RqMdYuPr3dnedv6bmHQUk9hH9h2fzVk9o" // state
      ),
    },
  ],
  [
    // hubSOL - SolanaHub staked SOL
    "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
    {
      pricingAccount: new PublicKey(
        "ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB" // state
      ),
    },
  ],
  [
    // strongSOL - Stronghold LST
    "strng7mqqc1MBJJV6vMzYbEqnwVGvKKGKedeCvtktWA",
    {
      pricingAccount: new PublicKey(
        "GZDX5JYXDzCEDL3kybhjN7PSixL4ams3M2G4CvWmMmm5" // state
      ),
    },
  ],
  [
    // lanternSOL - Lantern Staked SOL
    "LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZCWg",
    {
      pricingAccount: new PublicKey(
        "LW3qEdGWdVrxNgxSXW8vZri7Jifg4HuKEQ1UABLxs3C" // state
      ),
    },
  ],
  [
    // stakeSOL - Stake City SOL
    "st8QujHLPsX3d6HG9uQg9kJ91jFxUgruwsb1hyYXSNd",
    {
      pricingAccount: new PublicKey(
        "2jjK1MsLgsPgVjnp97HUJeovNj3jp4XgyQ3nuiWMwiS8" // state
      ),
    },
  ],
  [
    // pumpkinSOL - Pumpkin's Staked SOL
    "pumpkinsEq8xENVZE6QgTS93EN4r9iKvNxNALS1ooyp",
    {
      pricingAccount: new PublicKey(
        "8WHCJsUduwDBhPL9uVADQSdWkUi2LPZNFAMyX1n2HGMD" // state
      ),
    },
  ],
  [
    // hSOL - Helius Staked SOL
    "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
    {
      pricingAccount: new PublicKey(
        "3wK2g8ZdzAH8FJ7PKr2RcvGh7V9VYson5hrVsJM5Lmws" // state
      ),
    },
  ],
  [
    // lifSOL - Lifinity Staked SOL
    "LSoLi4A4Pk4i8DPFYcfHziRdEbH9otvSJcSrkMVq99c",
    {
      pricingAccount: new PublicKey(
        "HSDnqBq7EnfcKpnw52DTAZrP38tf8rdWLiRhQo4qGTUa" // state
      ),
    },
  ],
  [
    // cgntSOL - Cogent SOL
    "CgnTSoL3DgY9SFHxcLj6CgCgKKoTBr6tp4CPAEWy25DE",
    {
      pricingAccount: new PublicKey(
        "CgntPoLka5pD5fesJYhGmUCF8KU1QS1ZmZiuAuMZr2az" // state
      ),
    },
  ],
  [
    // laineSOL - Laine Stake Token
    "LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X",
    {
      pricingAccount: new PublicKey(
        "2qyEeSAWKfU18AFthrF7JA8z8ZCi1yt76Tqs917vwQTV" // state
      ),
    },
  ],
  [
    // vSOL - The Vault
    "vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7",
    {
      pricingAccount: new PublicKey(
        "Fu9BYC6tWBo1KMKaP3CFoKfRhqv9akmy3DuYwnCyWiyC" // state
      ),
    },
  ],
  [
    // bSOL - BlazeStake Staked SOL
    "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
    {
      pricingAccount: new PublicKey(
        "stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi" // state
      ),
    },
  ],
  [
    // daoSOL - daoSOL
    "GEJpt3Wjmr628FqXxTgxMce1pLntcPV4uFi8ksxMyPQh",
    {
      pricingAccount: new PublicKey(
        "7ge2xKsZXmqPxa3YmXxXmzCp9Hc2ezrTxh6PECaxCwrL" // state
      ),
    },
  ],
  [
    // JitoSOL - Jito Staked SOL
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    {
      pricingAccount: new PublicKey(
        "7yyaeuJ1GGtVBLT2z2xub5ZWYKaNhF28mj1RdV4VDFVk" // pyth
      ),
    },
  ],
  [
    // JSOL - JPOOL Solana Token
    "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn",
    {
      pricingAccount: new PublicKey(
        "CtMyWsrUtAwXWiGr9WjHT5fC3p3fgV8cyGpLTo2LJzG1" // state
      ),
    },
  ],
  [
    // LST - Liquid Staking Token
    "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
    {
      pricingAccount: new PublicKey(
        "DqhH94PjkZsjAqEze2BEkWhFQJ6EyU6MdtMphMgnXqeK" // state
      ),
    },
  ],
  [
    // zippySOL - Zippy Staked SOL
    "Zippybh3S5xYYam2nvL6hVJKz1got6ShgV4DyD1XQYF",
    {
      pricingAccount: new PublicKey(
        "DxRFpqBQBC2nKcvh14gD1eizCj9Xi7ruMR3nCR3Hvw8f" // state
      ),
    },
  ],
  [
    // edgeSOL - Edgevana Staked SOL
    "edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt",
    {
      pricingAccount: new PublicKey(
        "edgejNWAqkePLpi5sHRxT9vHi7u3kSHP9cocABPKiWZ" // state
      ),
    },
  ],
  [
    // thugSOL - Thugbirdz Staked SOL
    "ThUGsoLWtoTCfb24AmQTKDVjTTUBbNrUrozupJeyPsy",
    {
      pricingAccount: new PublicKey(
        "G9WdMBxWSo1X3fKxbuyGrv1nGXrVqGg5zBKAkBFkb37g" // state
      ),
    },
  ],
  [
    // wenSOL - Wen Staked SOL
    "WensoLXxZJnev2YvihHFchn1dVVFnFLYvgomXWvvwRu",
    {
      pricingAccount: new PublicKey(
        "CWM1VcNPd2A5WF2x2mmEUCgA1PGSKNZCGAH5GsoQw7h8" // state
      ),
    },
  ],
  [
    // camaoSOL - camaoSOL
    "camaK1kryp4KJ2jS1HDiZuxmK7S6dyEtr9DA7NsuAAB",
    {
      pricingAccount: new PublicKey(
        "2RUTyfN8iq7Hsd2s9rLgrRT9VhHLuqkx2mGNgbuzbhTc" // state
      ),
    },
  ],
  [
    // dainSOL - dainSOL
    "2LuXDpkn7ZWMqufwgUv7ZisggGkSE5FpeHCHBsRgLg3m",
    {
      pricingAccount: new PublicKey(
        "7qJ34Vq7nGZvk5YExkJsDZB6to6vz9RpcPmNEK84HjrV" // state
      ),
    },
  ],
  [
    // digitSOL - digitSOL
    "D1gittVxgtszzY4fMwiTfM4Hp7uL5Tdi1S9LYaepAUUm",
    {
      pricingAccount: new PublicKey(
        "4qYufFsPQETukkXd5z9fxDsdwm8AEaSqzYpuzmZzCJxR" // state
      ),
    },
  ],
  [
    // digitalSOL - digitalSOL
    "3bfv2scCdbvumVBc3Sar5QhYXx7Ecsi8EFF2akjxe329",
    {
      pricingAccount: new PublicKey(
        "Fwy2jGmRCDjKpWTacMVvnLp66Fg4L5yhVCfahHsbjMGf" // state
      ),
    },
  ],
  [
    // dlgtSOL - Delegate Liquid Staking SOL
    "DLGToUUnqy9hXxpJTm5VaiBKqnw9Zt1qzvrpwKwUmuuZ",
    {
      pricingAccount: new PublicKey(
        "9pffpv2w65TSeZpD988hAjvvzUiF1KZN1Swx5j2zPCdy" // state
      ),
    },
  ],
  [
    // dualSOL - Dual SOL
    "DUAL6T9pATmQUFPYmrWq2BkkGdRxLtERySGScYmbHMER",
    {
      pricingAccount: new PublicKey(
        "BmEgS5XpWJJDqT3FVfB6ZmoELQrWkJxDXo3cNoJVsNFK" // state
      ),
    },
  ],
  [
    // haSOL - Hanabi Staked SOL
    "haSo1Vz5aTsqEnz8nisfnEsipvbAAWpgzRDh2WhhMEh",
    {
      pricingAccount: new PublicKey(
        "9ovWYMZp18Qn7UVbyUvwqLSBBSEPDDA5q9pUgDFy6R23" // state
      ),
    },
  ],
  [
    // hausSOL - StakeHaus Staked SOL
    "HausGKcq9G9zM3azwNmgZyzUvYeeqR8h8663PmZpxuDj",
    {
      pricingAccount: new PublicKey(
        "5bzgfi7nidWWrp3DCwPwLzepw7PGgawRmMH9tqqXMZRj" // state
      ),
    },
  ],
  [
    // kumaSOL - kumaSOL
    "KUMAgSzADhUmwXwNiUbNHYnMBnd89u4t9obZThJ4dqg",
    {
      pricingAccount: new PublicKey(
        "Fvy5L7f3rduuYfRf9GR9fDqEgmJkYagDPh3Ddkp5jcoP" // state
      ),
    },
  ],
  [
    // mallowSOL - mallowSOL
    "MLLWfi8yLTzsjzKeHN3881qWM1eDM1kTfC59aD4tiP2",
    {
      pricingAccount: new PublicKey(
        "9dP2MvpoFuVgW31NbwyRJzybcjH2gMZS5YkSWEC7NDhD" // state
      ),
    },
  ],
  [
    // nordSOL - Nordic Staked SOL
    "nordEhq2BnR6weCyrdezNVk7TwC3Ej94znPZxdBnfLM",
    {
      pricingAccount: new PublicKey(
        "GrrASJmjz19gHDsUUGv9y3gtRAwYJcdrtFESCRAosd44" // state
      ),
    },
  ],
  [
    // polarSOL - polarSOL
    "PoLaRbHgtHnmeSohWQN83LkwA4xnQt91VUqL5hx5VTc",
    {
      pricingAccount: new PublicKey(
        "EYwMHf8Ajnpvy3PqMMkq1MPkTyhCsBEesXFgnK9BZfmu" // state
      ),
    },
  ],
  [
    // rkSOL - StaRKe SOL
    "EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL",
    {
      pricingAccount: new PublicKey(
        "6LXCxeyQZqdAL4yLCtgATFYF6dcayWvsiwjtBFYVfb1N" // state
      ),
    },
  ],
  [
    // rSOL - reflectSOL
    "RSoLp7kddnNwvvvaz4b1isQy8vcqdSwXjgm1wXaMhD8",
    {
      pricingAccount: new PublicKey(
        "4gT1GaFtJK5pnX3CnjnSYwy8VUV9UdmozoQV9GCNk9RQ" // state
      ),
    },
  ],
  [
    // spikySOL - Hedgehog Spiky SOL
    "spkyB5SzVaz2x3nNzSBuhpLSEF8otbRDbufc73fuLXg",
    {
      pricingAccount: new PublicKey(
        "GEGRQNw17Y5s44dRH69sk8bvhyj3i6VwgqGmN1MBHKHp" // state
      ),
    },
  ],
  [
    // stakrSOL - STAKR.space SOL
    "stkrHcjQGytQggswj3tCF77yriaJYYhrRxisRqe9AiZ",
    {
      pricingAccount: new PublicKey(
        "9j2mFdABTCCnWnzLtpMjp86AEcm4e3XistVeuujds7Au" // state
      ),
    },
  ],
  [
    // xSOL - ElagabalX Staked SOL
    "B5GgNAZQDN8vPrQ15jPrXmJxVtManHLqHogj9B9i4zSs",
    {
      pricingAccount: new PublicKey(
        "DYuSikgwzHidFo2b8jqrViW1psAb7hpawJnszBothRzp" // state
      ),
    },
  ],
  [
    // fuseSOL - Fuse Staked SOL
    "fuseYvhNJbSzdDByyTCrLcogsoNwAviB1WeewhbqgFc",
    {
      pricingAccount: new PublicKey(
        "pjwKqvtt4ij6VJW4HxNxSaufSrkWHRc6iCTHoC4gFs4" // state
      ),
    },
  ],
  [
    // mangoSOL - Mango SOL
    "MangmsBgFqJhW4cLUR9LxfVgMboY1xAoP8UUBiWwwuY",
    {
      pricingAccount: new PublicKey(
        "9jWbABPXfc75wseAbLEkBCb1NRaX9EbJZJTDQnbtpzc1" // state
      ),
    },
  ],
  [
    // apySOL - apySOL
    "apySoLhdVa6QbvNyEjXCbET3FdUm9cCdEvYyjCU7icM",
    {
      pricingAccount: new PublicKey(
        "FxhzbU8rn4MhZxmeH2u7M18qkvFH3LjkWk8z9686TE45" // state
      ),
    },
  ],
]);

export const ASSETS_TESTS: Map<string, AssetMeta> = new Map([
  [
    // USDC (Drift)
    "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2",
    {
      pricingAccount: new PublicKey(
        "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD" // pyth
      ),
    },
  ],
  [
    // BTC (Drift)
    "3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv",
    {
      pricingAccount: new PublicKey(
        "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr" // pyth
      ),
    },
  ],

  //
  // LOCALNET
  //

  [
    // USDC
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef",
    {
      pricingAccount: new PublicKey(
        "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD" // pyth
      ),
    },
  ],
  [
    // BTC
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd",
    {
      pricingAccount: new PublicKey(
        "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr" // pyth
      ),
      programId: TOKEN_2022_PROGRAM_ID,
    },
  ],
  [
    // ETH
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m",
    {
      pricingAccount: new PublicKey(
        "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB" // pyth
      ),
    },
  ],
]);
