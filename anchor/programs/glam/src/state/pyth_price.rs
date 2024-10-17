use pyth_solana_receiver_sdk::price_update::Price;

const MAX_PD_V_U64: u64 = (1 << 28) - 1;
const PD_SCALE: u64 = 1_000_000_000;
const PD_EXPO: i32 = -9;

//
// The Price struct in pyth-solana-receiver-sdk doesn't have add, cmul etc methods.
// We implement them here in the PriceExt trait. Implementation is based on the pyth-sdk-solana code:
// https://github.com/pyth-network/pyth-sdk-rs/blob/c34d0100363c30945cf53972fab78e543f030596/pyth-sdk/src/price.rs#L471
//
pub trait PriceExt {
    fn add(&self, other: &Price) -> Option<Price>;
    fn cmul(&self, c: i64, e: i32) -> Option<Price>;
    fn mul(&self, other: &Price) -> Option<Price>;
    fn div(&self, other: &Price) -> Option<Price>;
    fn normalize(&self) -> Option<Price>;
    fn to_unsigned(x: i64) -> (u64, i64);
    fn scale_to_exponent(&self, target_expo: i32) -> Option<Price>;
}
impl PriceExt for Price {
    /// Add `other` to this, propagating uncertainty in both prices.
    ///
    /// Requires both `Price`s to have the same exponent -- use `scale_to_exponent` on
    /// the arguments if necessary.
    ///
    /// TODO: could generalize this method to support different exponents.
    fn add(&self, other: &Price) -> Option<Price> {
        assert_eq!(self.exponent, other.exponent);

        let price = self.price.checked_add(other.price)?;
        // The conf should technically be sqrt(a^2 + b^2), but that's harder to compute.
        let conf = self.conf.checked_add(other.conf)?;
        Some(Price {
            price,
            conf,
            exponent: self.exponent,
            publish_time: self.publish_time.min(other.publish_time),
        })
    }

    /// Multiply this `Price` by a constant `c * 10^e`.
    fn cmul(&self, c: i64, e: i32) -> Option<Price> {
        self.mul(&Price {
            price: c,
            conf: 0,
            exponent: e,
            publish_time: self.publish_time,
        })
    }

    /// Multiply this `Price` by `other`, propagating any uncertainty.
    fn mul(&self, other: &Price) -> Option<Price> {
        // Price is not guaranteed to store its price/confidence in normalized form.
        // Normalize them here to bound the range of price/conf, which is required to perform
        // arithmetic operations.
        let base = self.normalize()?;
        let other = other.normalize()?;

        // These use at most 27 bits each
        let (base_price, base_sign) = Price::to_unsigned(base.price);
        let (other_price, other_sign) = Price::to_unsigned(other.price);

        // Uses at most 27*2 = 54 bits
        let midprice = base_price.checked_mul(other_price)?;
        let midprice_expo = base.exponent.checked_add(other.exponent)?;

        // Compute the confidence interval.
        // This code uses the 1-norm instead of the 2-norm for computational reasons.
        // Note that this simplifies: pq * (a/p + b/q) = qa + pb
        // 27*2 + 1 bits
        let conf = base
            .conf
            .checked_mul(other_price)?
            .checked_add(other.conf.checked_mul(base_price)?)?;

        Some(Price {
            price: (midprice as i64)
                .checked_mul(base_sign)?
                .checked_mul(other_sign)?,
            conf,
            exponent: midprice_expo,
            publish_time: self.publish_time.min(other.publish_time),
        })
    }

    /// Divide this price by `other` while propagating the uncertainty in both prices into the
    /// result.
    ///
    /// This method will automatically select a reasonable exponent for the result. If both
    /// `self` and `other` are normalized, the exponent is `self.expo + PD_EXPO - other.expo`
    /// (i.e., the fraction has `PD_EXPO` digits of additional precision). If they are not
    /// normalized, this method will normalize them, resulting in an unpredictable result
    /// exponent. If the result is used in a context that requires a specific exponent,
    /// please call `scale_to_exponent` on it.
    fn div(&self, other: &Price) -> Option<Price> {
        // Price is not guaranteed to store its price/confidence in normalized form.
        // Normalize them here to bound the range of price/conf, which is required to perform
        // arithmetic operations.

        let base = self.normalize()?;
        let other = other.normalize()?;

        if other.price == 0 {
            return None;
        }

        // These use at most 27 bits each
        let (base_price, base_sign) = Price::to_unsigned(base.price);
        let (other_price, other_sign) = Price::to_unsigned(other.price);

        // Compute the midprice, base in terms of other.
        // Uses at most 57 bits
        let midprice = base_price.checked_mul(PD_SCALE)?.checked_div(other_price)?;
        let midprice_expo = base
            .exponent
            .checked_sub(other.exponent)?
            .checked_add(PD_EXPO)?;

        // Compute the confidence interval.
        // This code uses the 1-norm instead of the 2-norm for computational reasons.
        // Let p +- a and q +- b be the two arguments to this method. The correct
        // formula is p/q * sqrt( (a/p)^2 + (b/q)^2 ). This quantity
        // is difficult to compute due to the sqrt and overflow/underflow considerations.
        //
        // This code instead computes p/q * (a/p + b/q) = a/q + pb/q^2 .
        // This quantity is at most a factor of sqrt(2) greater than the correct result, which
        // shouldn't matter considering that confidence intervals are typically ~0.1% of the price.

        // This uses 57 bits and has an exponent of PD_EXPO.
        let other_confidence_pct: u64 =
            other.conf.checked_mul(PD_SCALE)?.checked_div(other_price)?;

        // first term is 57 bits, second term is 57 + 58 - 29 = 86 bits. Same exponent as the
        // midprice. Note: the computation of the 2nd term consumes about 3k ops. We may
        // want to optimize this.
        let conf = (base.conf.checked_mul(PD_SCALE)?.checked_div(other_price)? as u128)
            .checked_add(
                (other_confidence_pct as u128)
                    .checked_mul(midprice as u128)?
                    .checked_div(PD_SCALE as u128)?,
            )?;

        // Note that this check only fails if an argument's confidence interval was >> its price,
        // in which case None is a reasonable result, as we have essentially 0 information about the
        // price.
        if conf < (u64::MAX as u128) {
            Some(Price {
                price: (midprice as i64)
                    .checked_mul(base_sign)?
                    .checked_mul(other_sign)?,
                conf: conf as u64,
                exponent: midprice_expo,
                publish_time: self.publish_time.min(other.publish_time),
            })
        } else {
            None
        }
    }

    /// Get a copy of this struct where the price and confidence
    /// have been normalized to be between `MIN_PD_V_I64` and `MAX_PD_V_I64`.
    fn normalize(&self) -> Option<Price> {
        // signed division is very expensive in op count
        let (mut p, s) = Price::to_unsigned(self.price);
        let mut c = self.conf;
        let mut e = self.exponent;

        while p > MAX_PD_V_U64 || c > MAX_PD_V_U64 {
            p = p.checked_div(10)?;
            c = c.checked_div(10)?;
            e = e.checked_add(1)?;
        }

        Some(Price {
            price: (p as i64).checked_mul(s)?,
            conf: c,
            exponent: e,
            publish_time: self.publish_time,
        })
    }

    /// Helper function to convert signed integers to unsigned and a sign bit, which simplifies
    /// some of the computations above.
    fn to_unsigned(x: i64) -> (u64, i64) {
        if x == i64::MIN {
            // special case because i64::MIN == -i64::MIN
            (i64::MAX as u64 + 1, -1)
        } else if x < 0 {
            (-x as u64, -1)
        } else {
            (x as u64, 1)
        }
    }

    /// Scale this price/confidence so that its exponent is `target_expo`.
    ///
    /// Return `None` if this number is outside the range of numbers representable in `target_expo`,
    /// which will happen if `target_expo` is too small.
    ///
    /// Warning: if `target_expo` is significantly larger than the current exponent, this
    /// function will return 0 +- 0.
    fn scale_to_exponent(&self, target_expo: i32) -> Option<Price> {
        let mut delta = target_expo.checked_sub(self.exponent)?;
        if delta >= 0 {
            let mut p = self.price;
            let mut c = self.conf;
            // 2nd term is a short-circuit to bound op consumption
            while delta > 0 && (p != 0 || c != 0) {
                p = p.checked_div(10)?;
                c = c.checked_div(10)?;
                delta = delta.checked_sub(1)?;
            }

            Some(Price {
                price: p,
                conf: c,
                exponent: target_expo,
                publish_time: self.publish_time,
            })
        } else {
            let mut p = self.price;
            let mut c = self.conf;

            // Either p or c == None will short-circuit to bound op consumption
            while delta < 0 {
                p = p.checked_mul(10)?;
                c = c.checked_mul(10)?;
                delta = delta.checked_add(1)?;
            }

            Some(Price {
                price: p,
                conf: c,
                exponent: target_expo,
                publish_time: self.publish_time,
            })
        }
    }
}
