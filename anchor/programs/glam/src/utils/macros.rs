#[macro_export]
macro_rules! gen_mint_signer_seeds {
    (
    $key: expr, $idx: expr, $bump: expr
) => {
        &[
            $crate::constants::SEED_MINT.as_bytes(),
            &[$idx],
            $key.as_ref(),
            &[$bump],
        ]
    };
}
