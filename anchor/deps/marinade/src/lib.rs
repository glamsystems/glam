use anchor_lang::declare_id;

//
// anchor --provider.cluster mainnet idl fetch MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD -o marinade-idl.json
//
anchor_gen::generate_cpi_crate!("idl.json");

declare_id!("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD");
