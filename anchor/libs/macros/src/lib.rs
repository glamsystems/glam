use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn treasury_signer_seeds(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input as a function
    let input = parse_macro_input!(item as ItemFn);
    let func_attrs = &input.attrs;
    let func_vis = &input.vis;
    let func_sig = &input.sig;
    let func_block = &input.block;

    // Generate the modified function with `treasury_signer_seeds` added at the start of the body
    let expanded = quote! {
        #(#func_attrs)*
        #func_vis #func_sig {
            // We assume the fund account and the treasury bump seed are available in the context
            let fund_key = ctx.accounts.fund.key();
            let seeds = [
                b"treasury".as_ref(),
                fund_key.as_ref(),
                &[ctx.bumps.treasury],
            ];
            let treasury_signer_seeds = &[&seeds[..]];

            // Original function body follows
            #func_block
        }
    };

    TokenStream::from(expanded)
}
