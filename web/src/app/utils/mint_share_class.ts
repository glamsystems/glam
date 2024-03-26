// https://www.youtube.com/watch?v=l7EyQUlNAdw&ab_channel=Solana
// https://solana.com/developers/guides/token-extensions/metadata-pointer

// example result (devnet):
// https://explorer.solana.com/address/GXwshLimDZur9PkBL5xhoraE2vMAQdWxMxEYvPqSvx1z?cluster=devnet
// https://solana.fm/address/GXwshLimDZur9PkBL5xhoraE2vMAQdWxMxEYvPqSvx1z

// npx esrun ./mint_share_class.ts
 
import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    getTokenMetadata,
    TYPE_SIZE,
    LENGTH_SIZE,
} from "@solana/spl-token";

import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";

import {
    getKeypairFromFile
} from "@solana-developers/helpers";

const connection = new Connection(clusterApiUrl("devnet"))

const payer = await getKeypairFromFile("/Users/fabio/code/Crypto/wallets/solana/000.json")
console.log("payer:", payer.publicKey.toBase58())

const mint = Keypair.generate();
console.log("mint:", mint.publicKey.toBase58())

const metadata : TokenMetadata= {
    mint: mint.publicKey,
    name: "Global Asset Management Layer Fund B USDC",
    symbol: "GLAM-B-USDC",
    uri: "https://glam.systems",
    additionalMetadata: [
        ["fund_id", "Pubkey"],
        ["share_class_asset", "USDC"],
        ["share_class_asset_id", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
        ["isin", "XS1082172823"],
        ["status", "OPEN"],
        ["fee_management", "0.015"],
        ["fee_performance", "0.1"],
        ["policy_distribution", "ACCUMULATING"],
        ["extension", "A"],
        ["launch_date", "2024-04-26"],
        ["lifecycle", "ACTIVE"]
    ]
}

const mintSpace = getMintLen([
    ExtensionType.MetadataPointer
])

const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length

const lamports = await connection.getMinimumBalanceForRentExemption(
    mintSpace + metadataSpace
)

const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintSpace,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID
})

const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
    mint.publicKey,
    payer.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
)

const initalizeMintIx = createInitializeMintInstruction(
    mint.publicKey,
    2, // decimals
    payer.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID
)

const initializeMetadataIx = createInitializeInstruction({
    mint: mint.publicKey,
    metadata: mint.publicKey,
    mintAuthority: payer.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey
})

const updateMetadataFundId = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[0][0],
    value: metadata.additionalMetadata[0][1]
})

const updateMetadataShareClassAsset = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[1][0],
    value: metadata.additionalMetadata[1][1]
})

const updateMetadataShareClassAssetId = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[2][0],
    value: metadata.additionalMetadata[2][1]
})

const updateMetadataIsin = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[3][0],
    value: metadata.additionalMetadata[3][1]
})

const updateMetadataStatus = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[4][0],
    value: metadata.additionalMetadata[4][1]
})

const updateMetadataFeeManagement = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[5][0],
    value: metadata.additionalMetadata[5][1]
})

const updateMetadataFeePerformance = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[6][0],
    value: metadata.additionalMetadata[6][1]
})

const updateMetadataPolicyDistribution = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[7][0],
    value: metadata.additionalMetadata[7][1]
})

const updateMetadataExtension = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[8][0],
    value: metadata.additionalMetadata[8][1]
})

const updateMetadataLaunchDate = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[9][0],
    value: metadata.additionalMetadata[9][1]
})

const updateMetadataLifecycle = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[10][0],
    value: metadata.additionalMetadata[10][1]
})

const transaction = new Transaction().add(
    createAccountIx,
    initializeMetadataPointerIx,
    initalizeMintIx,
    initializeMetadataIx,
    updateMetadataFundId,
    updateMetadataShareClassAsset,
    updateMetadataShareClassAssetId,
    updateMetadataIsin,
    updateMetadataStatus,
    updateMetadataFeeManagement,
    updateMetadataFeePerformance,
    updateMetadataPolicyDistribution,
    updateMetadataExtension,
    updateMetadataLaunchDate,
    updateMetadataLifecycle
)

const sig = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mint]
)

console.log("Signature: ", sig);

const chainMetadata = getTokenMetadata(
    connection,
    mint.publicKey
)

console.log("On-chain Metadata: ", chainMetadata);