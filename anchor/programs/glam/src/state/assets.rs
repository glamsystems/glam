use anchor_lang::prelude::*;
use anchor_lang::AccountDeserialize;
use phf::phf_map;

// use marinade::State as MarinadeState;
use pyth_sdk_solana::state::SolanaPriceAccount;
use pyth_sdk_solana::Price;

use crate::error::InvestorError;

// fn _log_price(price: Price) -> f64 {
//     price.price as f64 * 10f64.powf(price.expo as f64)
// }

pub struct AssetMeta<'a> {
    pub decimals: u8,
    pub is_stable_coin: bool,
    pub pyth_account: &'a str,
    pub staking_state: &'a str,
}
impl<'a> AssetMeta<'a> {
    pub fn get(name: &str) -> Result<&AssetMeta> {
        ASSETS
            .get(name)
            .map_or(Err(InvestorError::InvalidAssetSubscribe.into()), |asset| {
                Ok(asset)
            })
    }

    pub fn get_pricing_account(&self) -> &str {
        if self.staking_state != "" {
            return self.staking_state;
        }
        return self.pyth_account;
    }

    pub fn get_price(&self, pricing_account: &AccountInfo, timestamp: i64) -> Result<Price> {
        if self.staking_state != "" {
            return self.get_stl_price(pricing_account, timestamp);
        }
        self.get_pyth_price(pricing_account, timestamp)
    }

    pub fn get_pyth_price(&self, pricing_account: &AccountInfo, timestamp: i64) -> Result<Price> {
        // Retrieve Pyth price
        let price_feed: pyth_sdk_solana::PriceFeed =
            SolanaPriceAccount::account_info_to_feed(pricing_account).unwrap();
        let mut asset_price = price_feed.get_price_no_older_than(timestamp, 60).unwrap();

        // Scale price to expected decimals
        let asset_expo = -(self.decimals as i32);
        asset_price = asset_price.scale_to_exponent(asset_expo).unwrap();

        // Stable coin: return 1.0 if price is in (0.99..1.01)
        let one = 10i64.pow(self.decimals as u32);
        let one_percent = 10u64.pow((self.decimals - 2) as u32);
        if self.is_stable_coin && one.abs_diff(asset_price.price) < one_percent {
            asset_price.price = one;
        }

        Ok(asset_price)
    }

    pub fn get_stl_price(&self, pricing_account: &AccountInfo, _timestamp: i64) -> Result<Price> {
        let one = 10u64.pow(self.decimals as u32);

        // Marinade
        // if self.staking_state == "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC" {
        //     // Deserialize account
        //     let mut buf = &pricing_account.try_borrow_mut_data()?[..];
        //     let state = MarinadeState::try_deserialize(&mut buf)?;
        //     // Use Marinade `msol_to_sol` fn for pricing
        //     let p = state.msol_to_sol(one).unwrap();
        //     // Return Price with correct number of decimals
        //     let mut price = Price::default();
        //     price.expo = -(self.decimals as i32);
        //     price.price = p as i64;
        //     return Ok(price);
        // }

        Err(InvestorError::InvalidAssetSubscribe.into())
    }
}

#[cfg(not(feature = "mainnet"))]
static ASSETS: phf::Map<&'static str, AssetMeta> = phf_map! {
    // wSOL
    "So11111111111111111111111111111111111111112" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
        staking_state: "",
    },
    // USDC
    "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7",
        staking_state: "",
    },
    // BTC (Drift)
    "3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
        staking_state: "",
    },
    // Marinade staked SOL (mSOL)
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
        staking_state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
    },

    //
    // LOCALNET
    //

    // USDC
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7",
        staking_state: "",
    },
    // BTC
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
        staking_state: "",
    },
    // ETH
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
        staking_state: "",
    },
};

#[cfg(feature = "mainnet")]
static ASSETS: phf::Map<&'static str, AssetMeta> = phf_map! {
    // wSOL
    "So11111111111111111111111111111111111111112" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
        staking_state: "",
    },
    // USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD",
        staking_state: "",
    },
    // USDT
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL",
        staking_state: "",
    },
    // PYUSD
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        pyth_account: "",
        staking_state: "",
    },
    // BTC (Portal)
    "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "Eavb8FKNoYPbHnSS8kMi4tnUh8qK8bqxTjCojer4pZrr",
        staking_state: "",
    },
    // tBTC
    "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "6qCHPXxQiCiM3dEE4W6fpZk17uSZW9WBpD7cyN8Tg2Ac",
        staking_state: "",
    },
    // ETH (Portal)
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        pyth_account: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
        staking_state: "",
    },
    // PYTH
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: false,
        pyth_account: "nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue",
        staking_state: "",
    },
    // BONK
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" =>
    AssetMeta {
        decimals: 5,
        is_stable_coin: false,
        pyth_account: "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN",
        staking_state: "",
    },

    //
    // LST
    //

    // mSOL - Marinade staked SOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
        staking_state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
    },
    // bonkSOL
    "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC",
    },
    // dSOL - Drift Staked SOL
    "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "9mhGNSPArRMHpLDMSmxAvuoizBqtBGqYdT8WGuqgxNdn",
    },
    // picoSOL
    "picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "8Dv3hNYcEWEaa4qVx9BTN1Wfvtha1z8cWDUXb7KVACVe",
    },
    // JitoSOL
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb",
    },
    // LST - Liquid Staking Token
    "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        pyth_account: "",
        staking_state: "DqhH94PjkZsjAqEze2BEkWhFQJ6EyU6MdtMphMgnXqeK",
    },
};
