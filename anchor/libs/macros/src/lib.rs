use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, FnArg, ItemFn, Pat, PatIdent};

#[proc_macro_attribute]
pub fn mint_signer_seeds(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input as a function
    let input = parse_macro_input!(item as ItemFn);
    let func_attrs = &input.attrs;
    let func_vis = &input.vis;
    let func_sig = &input.sig;
    let func_block = &input.block;

    // Check for `mint_id` argument
    let mut has_mint_id = false;
    for arg in &input.sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(PatIdent { ident, .. }) = &*pat_type.pat {
                if ident == "mint_id" {
                    has_mint_id = true;
                    break;
                }
            }
        }
    }

    if !has_mint_id {
        return syn::Error::new_spanned(
            input.sig.ident,
            "The function must have a 'mint_id' parameter.",
        )
        .to_compile_error()
        .into();
    }

    // Generate the modified function with `mint_signer_seeds` added at the start of the body
    let expanded = quote! {
        #(#func_attrs)*
        #func_vis #func_sig {
            // We assume the fund account and the state bump seed are available in the context
            let state_key = ctx.accounts.glam_state.key();
            let seeds = &[
                crate::constants::SEED_MINT.as_bytes(),
                &[mint_id],
                state_key.as_ref(),
                &[ctx.bumps.glam_mint],
            ];
            let mint_signer_seeds = &[&seeds[..]];

            // Original function body follows
            #func_block
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_attribute]
pub fn glam_vault_signer_seeds(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input as a function
    let input = parse_macro_input!(item as ItemFn);
    let func_attrs = &input.attrs;
    let func_vis = &input.vis;
    let func_sig = &input.sig;
    let func_block = &input.block;

    // Generate the modified function with `vault_signer_seeds` added at the start of the body
    let expanded = quote! {
        #(#func_attrs)*
        #func_vis #func_sig {
            // We assume the fund account and the vault bump seed are available in the context
            let state_key = ctx.accounts.glam_state.key();
            let seeds = [
                crate::constants::SEED_VAULT.as_ref(),
                state_key.as_ref(),
                &[ctx.bumps.glam_vault],
            ];
            let glam_vault_signer_seeds = &[&seeds[..]];

            // Original function body follows
            #func_block
        }
    };

    TokenStream::from(expanded)
}
