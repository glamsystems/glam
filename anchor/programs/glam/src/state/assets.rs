use anchor_lang::prelude::*;
use anchor_lang::AccountDeserialize;
use phf::phf_map;

use crate::error::InvestorError;
use crate::state::pyth_price::PriceExt;
use marinade::State as MarinadeState;
use pyth_solana_receiver_sdk::price_update::{Price, PriceUpdateV2};
use spl_stake_pool::state::StakePool;

pub const MAXIMUM_AGE: u64 = 60; // One minute

#[derive(Clone, Copy, PartialEq)]
pub enum Action {
    Subscribe,
    Redeem,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum PriceDenom {
    Asset, // not impl
    SOL,
    USD,
    EUR, // not impl
}

pub struct AssetMeta<'a> {
    pub decimals: u8,
    pub is_stable_coin: bool,
    pub is_token_2022: bool,
    pub pyth_account: &'a str,
    pub staking_state: &'a str,
}
impl<'a> AssetMeta<'a> {
    pub fn get(name: &str) -> Result<&AssetMeta> {
        ASSETS.get(name).map_or(
            // On mainnet, return error
            #[cfg(feature = "mainnet")]
            Err(InvestorError::InvalidAssetSubscribe.into()),
            // In tests, check if the asset is in ASSETS_TESTS, or return error
            #[cfg(not(feature = "mainnet"))]
            ASSETS_TESTS
                .get(name)
                .map_or(Err(InvestorError::InvalidAssetSubscribe.into()), |asset| {
                    Ok(asset)
                }),
            |asset| Ok(asset),
        )
    }

    pub fn get_pricing_account(&self) -> &str {
        if self.staking_state != "" {
            return self.staking_state;
        }
        return self.pyth_account;
    }

    pub fn get_price_denom(&self) -> PriceDenom {
        if self.staking_state != "" {
            return PriceDenom::SOL;
        }
        return PriceDenom::USD;
    }

    pub fn get_price(
        &self,
        pricing_account: &AccountInfo,
        timestamp: i64,
        action: Action,
    ) -> Result<Price> {
        if self.staking_state != "" {
            return self.get_lst_price(pricing_account);
        }
        self.get_pyth_price(pricing_account, timestamp, action)
    }

    pub fn get_pyth_price(
        &self,
        pricing_account: &AccountInfo,
        _timestamp: i64,
        action: Action,
    ) -> Result<Price> {
        let data = pricing_account.try_borrow_data()?;
        let price_update = PriceUpdateV2::try_deserialize(&mut &data[..])?;
        let mut asset_price = Price {
            price: price_update.price_message.price,
            conf: price_update.price_message.conf,
            exponent: price_update.price_message.exponent,
            publish_time: price_update.price_message.publish_time,
        };

        #[cfg(not(feature = "mainnet"))]
        msg!(
            "Price published at {:?}, current ts {:?}",
            asset_price.publish_time,
            Clock::get()?.unix_timestamp
        );

        // On mainnet, enforce that the price is not older than 60s
        #[cfg(feature = "mainnet")]
        require!(
            asset_price
                .publish_time
                .saturating_add(MAXIMUM_AGE.try_into().unwrap())
                >= Clock::get()?.unix_timestamp,
            InvestorError::PriceTooOld
        );

        // Scale price to expected decimals
        let asset_expo = -(self.decimals as i32);
        asset_price = asset_price.scale_to_exponent(asset_expo).unwrap();

        // Stable coin: return 1.0 if price is in (0.99..1.01)
        let one = 10i64.pow(self.decimals as u32);
        let one_percent = 10u64.pow((self.decimals - 2) as u32);
        if self.is_stable_coin {
            if one.abs_diff(asset_price.price) < one_percent {
                asset_price.price = one;
            } else if action == Action::Subscribe {
                return Err(InvestorError::InvalidStableCoinPriceForSubscribe.into());
            }
        }

        Ok(asset_price)
    }

    pub fn get_lst_price(&self, pricing_account: &AccountInfo) -> Result<Price> {
        let one = 10u64.pow(self.decimals as u32);

        let price_u64 = if self.staking_state == "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC" {
            // Marinade
            let mut buf = &pricing_account.try_borrow_mut_data()?[..];
            let state = MarinadeState::try_deserialize(&mut buf)?;
            state.msol_to_sol(one).unwrap()
        } else {
            // SPL, Sanctum
            let mut buf = &pricing_account.try_borrow_mut_data()?[..];
            let state = StakePool::try_from_slice(&mut buf)?;
            state.calc_lamports_withdraw_amount(one).unwrap()
        };

        Ok(Price {
            price: price_u64 as i64,
            conf: 0,
            exponent: -(self.decimals as i32),
            publish_time: 0,
        })
    }
}

// We need a few assets for tests
#[cfg(not(feature = "mainnet"))]
static ASSETS_TESTS: phf::Map<&'static str, AssetMeta> = phf_map! {
    //
    // FOR TESTS
    //

    // BTC (custom)
    "7Pz5yQdyQm64WtzxvpQZi3nD1q5mbxj4Hhcjy2kmZ7Zd" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        is_token_2022: true,
        pyth_account: "4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo",
        staking_state: "",
    },

    // USDC (custom)
    "AwRP1kuJbykXeF4hcLzfMDMY2ZTGN3cx8ErCWxVYekef" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        is_token_2022: false,
        pyth_account: "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX",
        staking_state: "",
    },

    // ETH (custom)
    "GRxagtBNxzjwxkKdEgW7P1oqU57Amai6ha5F3UBJzU1m" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "42amVS4KgzR9rA28tkVYqVXjq9Qa8dcZQMbH5EYFX6XC",
        staking_state: "",
    },
};

static ASSETS: phf::Map<&'static str, AssetMeta> = phf_map! {
    //
    // MAINNET
    //

    // wSOL
    "So11111111111111111111111111111111111111112" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
        staking_state: "",
    },
    // USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        is_token_2022: false,
        pyth_account: "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX",
        staking_state: "",
    },
    // USDT
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        is_token_2022: false,
        pyth_account: "HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM",
        staking_state: "",
    },
    // PYUSD
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: true,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "",
    },
    // BTC (Portal)
    "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "9gNX5vguzarZZPjTnE1hWze3s6UsZ7dsU3UnAmKPnMHG",
        staking_state: "",
    },
    // wETH (Wormhole)
    "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs" =>
    AssetMeta {
        decimals: 8,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "42amVS4KgzR9rA28tkVYqVXjq9Qa8dcZQMbH5EYFX6XC",
        staking_state: "",
    },
    // PYTH
    "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" =>
    AssetMeta {
        decimals: 6,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "8vjchtMuJNY4oFQdTi8yCe6mhCaNBFaUbktT482TpLPS",
        staking_state: "",
    },
    // BONK
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" =>
    AssetMeta {
        decimals: 5,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX",
        staking_state: "",
    },
    // mSOL - Marinade staked SOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "5CKzb9j4ChgLUt8Gfm5CNGLN6khXKiqMbnGAW4cgXgxK",
        staking_state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
    },

    //
    // LST - autogen
    //

    // fpSOL - FP SOL
    "fpSoL8EJ7UA5yJxFKWk1MFiWi35w8CbH36G5B9d7DsV" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "GutG5bcmEZw15WmPHNVMWHU77c6t8CEinUEdPLYz3doa",
    },

    // wifSOL - dogwifSOL
    "Fi5GayacZzUrfaCRCJtBz2vSYkGF56xjgCceZx5SbXwq" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9Z8yimuc3bQCWLDyMhe6jfWqNk9EggyJZUo8TLnYsqhN",
    },

    // pathSOL - Pathfinders SOL
    "pathdXw4He1Xk3eX84pDdDZnGKEme3GivBamGCVPZ5a" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "GM7TwD34n8HmDP9XcT6bD3JJuNniKJkrKQinHqmqHarz",
    },

    // JupSOL - Jupiter Staked SOL
    "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "8VpRhuxa7sUUepdY3kQiTmX9rS5vx4WgaXiAnXq4KCtr",
    },

    // juicingJupSOL - Juicing Jupiter SOL
    "BgYgFYq4A9a2o5S1QbWkmYVFBh7LBQL8YvugdhieFg38" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "4mBwcXKJN2vz6MJikNTgVBSY5vYnyjZk7txd8j3K46Ei",
    },

    // phaseSOL - Phase Labs SOL
    "phaseZSfPxTDBpiVb96H4XFSD8xHeHxZre5HerehBJG" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "phasejkG1akKgqkLvfWzWY17evnH6mSWznnUspmpyeG",
    },

    // banxSOL - banxSOL
    "BANXyWgPpa519e2MtQF1ecRbKYKKDMXPF1dyBxUq9NQG" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "4fdMvFuyNboQ5Kr93X16f1tFcTeEkvfNwNAeSrzY3afb",
    },

    // iceSOL - iceSOL
    "iceSdwqztAQFuH6En49HWwMxwthKMnGzLFQcMN3Bqhj" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "EVXQHaLSJyUNrnBGfXUnvEi4DvVz4UJ3GnoKGVQVxrjr",
    },

    // fmSOL - SolanaFM Staked SOL
    "fmSoLKzBY6h9b5RQ67UVs7xE3Ym6mx2ChpPxHdoaVho" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "5FYTvZgc7QEGZSDmbJn5hrtjtRtyFZo5vR7gL1jJYanE",
    },

    // BurnSOL - BurnDAO
    "AxM7a5HNmRNHbND6h5ZMSsU8n3NLa1tskoN6m5mAgVvL" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "CAEsfzw43mvaVauCxXCSJh8DvnFsTMiTyeL1kjs6UwaT",
    },

    // mallowSOL - mallowSOL
    "MLLWWq9TLHK3oQznWqwPyqD7kH4LXTHSKXK4yLz7LjD" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "7thbAQrn9oRJsbz2CchoPSujGYpu4hCHnVrniBHupQsx",
    },

    // pwrSOL - Power Staked SOL
    "pWrSoLAhue6jUxUkbWgmEy5rD9VJzkFmvfTDV5KgNuu" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "DfiQgSvpW3Dy4gKfhtdHnWGHwFUrE8exvaxqjtMtAVxk",
    },

    // superSOL - Superfast Staked SOL
    "suPer8CPwxoJPQ7zksGMwFvjBQhjAHwUMmPV4FVatBw" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "4dZDUL3BFJUFeqS3Y3cwkc84Rs6mgVHRYGt1LJvhooW4",
    },

    // jucySOL - Juicy SOL
    "jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "AZGSr2fUyKkPLMhAW6WUEKEsQiRMAFKf8Fjnt4MFFaGv",
    },

    // bonkSOL - bonkSOL
    "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC",
    },

    // dSOL - Drift Staked SOL
    "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9mhGNSPArRMHpLDMSmxAvuoizBqtBGqYdT8WGuqgxNdn",
    },

    // compassSOL - Compass SOL
    "Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "AwDeTcW6BovNYR34Df1TPm4bFwswa4CJY4YPye2LXtPS",
    },

    // picoSOL - picoSOL
    "picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "8Dv3hNYcEWEaa4qVx9BTN1Wfvtha1z8cWDUXb7KVACVe",
    },

    // clockSOL - Overclock SOL
    "GRJQtWwdJmp5LLpy8JWjPgn5FnLyqSJGNhn5ZnCTFUwM" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "6e2LpgytfG3RqMdYuPr3dnedv6bmHQUk9hH9h2fzVk9o",
    },

    // hubSOL - SolanaHub staked SOL
    "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB",
    },

    // strongSOL - Stronghold LST
    "strng7mqqc1MBJJV6vMzYbEqnwVGvKKGKedeCvtktWA" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "GZDX5JYXDzCEDL3kybhjN7PSixL4ams3M2G4CvWmMmm5",
    },

    // lanternSOL - Lantern Staked SOL
    "LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZCWg" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "LW3qEdGWdVrxNgxSXW8vZri7Jifg4HuKEQ1UABLxs3C",
    },

    // stakeSOL - Stake City SOL
    "st8QujHLPsX3d6HG9uQg9kJ91jFxUgruwsb1hyYXSNd" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "2jjK1MsLgsPgVjnp97HUJeovNj3jp4XgyQ3nuiWMwiS8",
    },

    // pumpkinSOL - Pumpkin's Staked SOL
    "pumpkinsEq8xENVZE6QgTS93EN4r9iKvNxNALS1ooyp" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "8WHCJsUduwDBhPL9uVADQSdWkUi2LPZNFAMyX1n2HGMD",
    },

    // hSOL - Helius Staked SOL
    "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "3wK2g8ZdzAH8FJ7PKr2RcvGh7V9VYson5hrVsJM5Lmws",
    },

    // lifSOL - Lifinity Staked SOL
    "LSoLi4A4Pk4i8DPFYcfHziRdEbH9otvSJcSrkMVq99c" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "HSDnqBq7EnfcKpnw52DTAZrP38tf8rdWLiRhQo4qGTUa",
    },

    // cgntSOL - Cogent SOL
    "CgnTSoL3DgY9SFHxcLj6CgCgKKoTBr6tp4CPAEWy25DE" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "CgntPoLka5pD5fesJYhGmUCF8KU1QS1ZmZiuAuMZr2az",
    },

    // laineSOL - Laine Stake Token
    "LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "2qyEeSAWKfU18AFthrF7JA8z8ZCi1yt76Tqs917vwQTV",
    },

    // vSOL - The Vault
    "vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "Fu9BYC6tWBo1KMKaP3CFoKfRhqv9akmy3DuYwnCyWiyC",
    },

    // bSOL - BlazeStake Staked SOL
    "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi",
    },

    // daoSOL - daoSOL
    "GEJpt3Wjmr628FqXxTgxMce1pLntcPV4uFi8ksxMyPQh" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "7ge2xKsZXmqPxa3YmXxXmzCp9Hc2ezrTxh6PECaxCwrL",
    },

    // JitoSOL - Jito Staked SOL
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "7yyaeuJ1GGtVBLT2z2xub5ZWYKaNhF28mj1RdV4VDFVk",
        staking_state: "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb",
    },

    // JSOL - JPOOL Solana Token
    "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "CtMyWsrUtAwXWiGr9WjHT5fC3p3fgV8cyGpLTo2LJzG1",
    },

    // LST - Liquid Staking Token
    "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "DqhH94PjkZsjAqEze2BEkWhFQJ6EyU6MdtMphMgnXqeK",
    },

    // zippySOL - Zippy Staked SOL
    "Zippybh3S5xYYam2nvL6hVJKz1got6ShgV4DyD1XQYF" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "DxRFpqBQBC2nKcvh14gD1eizCj9Xi7ruMR3nCR3Hvw8f",
    },

    // edgeSOL - Edgevana Staked SOL
    "edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "edgejNWAqkePLpi5sHRxT9vHi7u3kSHP9cocABPKiWZ",
    },

    // thugSOL - Thugbirdz Staked SOL
    "ThUGsoLWtoTCfb24AmQTKDVjTTUBbNrUrozupJeyPsy" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "G9WdMBxWSo1X3fKxbuyGrv1nGXrVqGg5zBKAkBFkb37g",
    },

    // wenSOL - Wen Staked SOL
    "WensoLXxZJnev2YvihHFchn1dVVFnFLYvgomXWvvwRu" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "CWM1VcNPd2A5WF2x2mmEUCgA1PGSKNZCGAH5GsoQw7h8",
    },

    // camaoSOL - camaoSOL
    "camaK1kryp4KJ2jS1HDiZuxmK7S6dyEtr9DA7NsuAAB" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "2RUTyfN8iq7Hsd2s9rLgrRT9VhHLuqkx2mGNgbuzbhTc",
    },

    // dainSOL - dainSOL
    "2LuXDpkn7ZWMqufwgUv7ZisggGkSE5FpeHCHBsRgLg3m" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "7qJ34Vq7nGZvk5YExkJsDZB6to6vz9RpcPmNEK84HjrV",
    },

    // digitSOL - digitSOL
    "D1gittVxgtszzY4fMwiTfM4Hp7uL5Tdi1S9LYaepAUUm" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "4qYufFsPQETukkXd5z9fxDsdwm8AEaSqzYpuzmZzCJxR",
    },

    // digitalSOL - digitalSOL
    "3bfv2scCdbvumVBc3Sar5QhYXx7Ecsi8EFF2akjxe329" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "Fwy2jGmRCDjKpWTacMVvnLp66Fg4L5yhVCfahHsbjMGf",
    },

    // dlgtSOL - Delegate Liquid Staking SOL
    "DLGToUUnqy9hXxpJTm5VaiBKqnw9Zt1qzvrpwKwUmuuZ" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9pffpv2w65TSeZpD988hAjvvzUiF1KZN1Swx5j2zPCdy",
    },

    // dualSOL - Dual SOL
    "DUAL6T9pATmQUFPYmrWq2BkkGdRxLtERySGScYmbHMER" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "BmEgS5XpWJJDqT3FVfB6ZmoELQrWkJxDXo3cNoJVsNFK",
    },

    // haSOL - Hanabi Staked SOL
    "haSo1Vz5aTsqEnz8nisfnEsipvbAAWpgzRDh2WhhMEh" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9ovWYMZp18Qn7UVbyUvwqLSBBSEPDDA5q9pUgDFy6R23",
    },

    // hausSOL - StakeHaus Staked SOL
    "HausGKcq9G9zM3azwNmgZyzUvYeeqR8h8663PmZpxuDj" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "5bzgfi7nidWWrp3DCwPwLzepw7PGgawRmMH9tqqXMZRj",
    },

    // kumaSOL - kumaSOL
    "KUMAgSzADhUmwXwNiUbNHYnMBnd89u4t9obZThJ4dqg" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "Fvy5L7f3rduuYfRf9GR9fDqEgmJkYagDPh3Ddkp5jcoP",
    },

    // mallowSOL - mallowSOL
    "MLLWfi8yLTzsjzKeHN3881qWM1eDM1kTfC59aD4tiP2" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9dP2MvpoFuVgW31NbwyRJzybcjH2gMZS5YkSWEC7NDhD",
    },

    // nordSOL - Nordic Staked SOL
    "nordEhq2BnR6weCyrdezNVk7TwC3Ej94znPZxdBnfLM" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "GrrASJmjz19gHDsUUGv9y3gtRAwYJcdrtFESCRAosd44",
    },

    // polarSOL - polarSOL
    "PoLaRbHgtHnmeSohWQN83LkwA4xnQt91VUqL5hx5VTc" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "EYwMHf8Ajnpvy3PqMMkq1MPkTyhCsBEesXFgnK9BZfmu",
    },

    // rkSOL - StaRKe SOL
    "EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "6LXCxeyQZqdAL4yLCtgATFYF6dcayWvsiwjtBFYVfb1N",
    },

    // rSOL - reflectSOL
    "RSoLp7kddnNwvvvaz4b1isQy8vcqdSwXjgm1wXaMhD8" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "4gT1GaFtJK5pnX3CnjnSYwy8VUV9UdmozoQV9GCNk9RQ",
    },

    // spikySOL - Hedgehog Spiky SOL
    "spkyB5SzVaz2x3nNzSBuhpLSEF8otbRDbufc73fuLXg" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "GEGRQNw17Y5s44dRH69sk8bvhyj3i6VwgqGmN1MBHKHp",
    },

    // stakrSOL - STAKR.space SOL
    "stkrHcjQGytQggswj3tCF77yriaJYYhrRxisRqe9AiZ" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9j2mFdABTCCnWnzLtpMjp86AEcm4e3XistVeuujds7Au",
    },

    // xSOL - ElagabalX Staked SOL
    "B5GgNAZQDN8vPrQ15jPrXmJxVtManHLqHogj9B9i4zSs" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "DYuSikgwzHidFo2b8jqrViW1psAb7hpawJnszBothRzp",
    },

    // fuseSOL - Fuse Staked SOL
    "fuseYvhNJbSzdDByyTCrLcogsoNwAviB1WeewhbqgFc" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "pjwKqvtt4ij6VJW4HxNxSaufSrkWHRc6iCTHoC4gFs4",
    },

    // mangoSOL - Mango SOL
    "MangmsBgFqJhW4cLUR9LxfVgMboY1xAoP8UUBiWwwuY" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "9jWbABPXfc75wseAbLEkBCb1NRaX9EbJZJTDQnbtpzc1",
    },

    // apySOL - apySOL
    "apySoLhdVa6QbvNyEjXCbET3FdUm9cCdEvYyjCU7icM" =>
    AssetMeta {
        decimals: 9,
        is_stable_coin: false,
        is_token_2022: false,
        pyth_account: "",
        staking_state: "FxhzbU8rn4MhZxmeH2u7M18qkvFH3LjkWk8z9686TE45",
    },
};
