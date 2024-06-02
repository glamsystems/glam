use anchor_lang::prelude::*;
use phf::phf_map;

use crate::error::InvestorError;

pub struct AssetInfo<'a> {
    pub decimals: u8,
    pub is_stable_coin: bool,
    pub pyth_account: &'a str,
    pub staking_state: &'a str,
}
impl<'a> AssetInfo<'a> {
    pub fn get(name: &str) -> Result<&AssetInfo> {
        ASSETS
            .get(name)
            .map_or(Err(InvestorError::InvalidAssetSubscribe.into()), |asset| {
                Ok(asset)
            })
    }
}

static ASSETS: phf::Map<&'static str, AssetInfo> = phf_map! {
    // wSOL
    "So11111111111111111111111111111111111111112" =>
    AssetInfo {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
        staking_state: "",
    },
    // USDC
    // "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" =>
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef" =>
    AssetInfo {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7",
        staking_state: "",
    },
    // USDT (TODO)
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" =>
    AssetInfo {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL",
        staking_state: "",
    },
    // PYUSD (TODO)
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo" =>
    AssetInfo {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "",
        staking_state: "",
    },
    // BTC (Portal)
    // "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh" =>
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd" =>
    AssetInfo {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
        staking_state: "",
    },
    // tBTC (TODO)
    "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU" =>
    AssetInfo {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "6qCHPXxQiCiM3dEE4W6fpZk17uSZW9WBpD7cyN8Tg2Ac",
        staking_state: "",
    },
    // ETH (Portal)
    // "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs" =>
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m" =>
    AssetInfo {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
        staking_state: "",
    },
    // PYTH
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" =>
    AssetInfo {
        decimals: 6,
        is_stable_coin: false,
        pyth_account: "nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue",
        staking_state: "",
    },
    // BONK
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" =>
    AssetInfo {
        decimals: 5,
        is_stable_coin: false,
        pyth_account: "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN",
        staking_state: "",
    },
    // Marinade staked SOL (mSOL)
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" =>
    AssetInfo {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
        staking_state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
    },
};

// static ASSETS: phf::Map<&'static str, AssetInfo> = phf_map! {
//     // wSOL
//     "So11111111111111111111111111111111111111112" =>
//     AssetInfo {
//         decimals: 9,
//         is_stable_coin: false,
//         pyth_account: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
//         staking_state: "",
//     },
//     // USDC
//     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" =>
//     AssetInfo {
//         decimals: 6,
//         is_stable_coin: true,
//         pyth_account: "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD",
//         staking_state: "",
//     },
//     // USDT
//     "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" =>
//     AssetInfo {
//         decimals: 6,
//         is_stable_coin: true,
//         pyth_account: "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL",
//         staking_state: "",
//     },
//     // PYUSD
//     "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo" =>
//     AssetInfo {
//         decimals: 6,
//         is_stable_coin: true,
//         pyth_account: "",
//         staking_state: "",
//     },
//     // BTC (Portal)
//     "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh" =>
//     AssetInfo {
//         decimals: 8,
//         is_stable_coin: false,
//         pyth_account: "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr",
//         staking_state: "",
//     },
//     // tBTC
//     "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU" =>
//     AssetInfo {
//         decimals: 8,
//         is_stable_coin: false,
//         pyth_account: "6qCHPXxQiCiM3dEE4W6fpZk17uSZW9WBpD7cyN8Tg2Ac",
//         staking_state: "",
//     },
//     // ETH (Portal)
//     "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs" =>
//     AssetInfo {
//         decimals: 8,
//         is_stable_coin: false,
//         pyth_account: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
//         staking_state: "",
//     },
//     // PYTH
//     "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" =>
//     AssetInfo {
//         decimals: 6,
//         is_stable_coin: false,
//         pyth_account: "nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue",
//         staking_state: "",
//     },
//     // BONK
//     "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" =>
//     AssetInfo {
//         decimals: 5,
//         is_stable_coin: false,
//         pyth_account: "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN",
//         staking_state: "",
//     },
//     // Marinade staked SOL (mSOL)
//     "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" =>
//     AssetInfo {
//         decimals: 9,
//         is_stable_coin: false,
//         pyth_account: "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
//         staking_state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
//     },
// };
