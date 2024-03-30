use anchor_lang::prelude::*;
use std::str::FromStr;

pub struct Token {
    pub symbol: u64,
    pub mint: Pubkey,
}

const AVAILABLE_TOKENS: Vec<Token> = vec![
    Token{
        symbol: 1,
        mint: Pubkey::from_str("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    },
    Token{
        symbol: 2,
        mint: Pubkey::from_str("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    },
];
