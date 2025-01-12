use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, FnArg, ItemFn, Pat, PatIdent};

#[proc_macro_attribute]
pub fn share_class_signer_seeds(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input as a function
    let input = parse_macro_input!(item as ItemFn);
    let func_attrs = &input.attrs;
    let func_vis = &input.vis;
    let func_sig = &input.sig;
    let func_block = &input.block;

    // Check for `share_class_id` argument
    let mut has_share_class_id = false;
    for arg in &input.sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(PatIdent { ident, .. }) = &*pat_type.pat {
                if ident == "share_class_id" {
                    has_share_class_id = true;
                    break;
                }
            }
        }
    }

    if !has_share_class_id {
        return syn::Error::new_spanned(
            input.sig.ident,
            "The function must have a 'share_class_id' parameter.",
        )
        .to_compile_error()
        .into();
    }

    // Generate the modified function with `share_class_signer_seeds` added at the start of the body
    let expanded = quote! {
        #(#func_attrs)*
        #func_vis #func_sig {
            // We assume the fund account and the treasury bump seed are available in the context
            let state_key = ctx.accounts.state.key();
            let seeds = &[
                "share".as_bytes(),
                &[share_class_id],
                state_key.as_ref(),
                &[ctx.bumps.share_class_mint],
            ];
            let share_class_signer_seeds = &[&seeds[..]];

            // Original function body follows
            #func_block
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_attribute]
pub fn vault_signer_seeds(_attr: TokenStream, item: TokenStream) -> TokenStream {
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
            let state_key = ctx.accounts.state.key();
            let seeds = [
                "treasury".as_ref(),
                state_key.as_ref(),
                &[ctx.bumps.vault],
            ];
            let vault_signer_seeds = &[&seeds[..]];

            // Original function body follows
            #func_block
        }
    };

    TokenStream::from(expanded)
}
