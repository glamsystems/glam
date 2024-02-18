import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  createTransferCheckedWithTransferHookInstruction,
} from "@solana/spl-token";
import { Policy } from '../target/types/policy';

describe('policy', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Policy as Program<Policy>;
  const connection = provider.connection;

  const wallet = provider.wallet as anchor.Wallet;
  const mint = Keypair.generate();
  const alicePublicKey = new PublicKey("aLice3kGNMajHriHX8R1e1LmqAzojuidxSiU9JT6hVo");

  const decimals = 6;

  // Sender token account address
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Recipient token account address
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    alicePublicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // ExtraAccountMetaList address
  // Store extra accounts required by the custom transfer hook instruction
  const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.publicKey.toBuffer()],
    program.programId
  );

  // This test needs pyth and only works on devnet
  it("Create a token with Policy hook", async () => {
    const extensions = [ExtensionType.TransferHook];
    const mintLen = getMintLen(extensions);
    const lamports =
      await provider.connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintLen,
        lamports: lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferHookInstruction(
        mint.publicKey,
        wallet.publicKey,
        program.programId, // Transfer Hook Program ID
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      )
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer, mint]
    );
    console.log(`Transaction Signature: ${txSig}`);
  });

// Create the two token accounts for the transfer-hook enabled mint
  // Fund the sender token account with 100 tokens
  it("Create Token Accounts and Mint Tokens", async () => {
    // 100 tokens
    const amount = 2000 * 10 ** decimals;

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        sourceTokenAccount,
        wallet.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        destinationTokenAccount,
        alicePublicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createMintToInstruction(
        mint.publicKey,
        sourceTokenAccount,
        wallet.publicKey,
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true }
    );

    console.log(`Transaction Signature: ${txSig}`);
  });

  // Account to store extra accounts required by the transfer hook instruction
  it("Create ExtraAccountMetaList Account", async () => {
    /*
    const initializeExtraAccountMetaListInstruction = await program.methods
      .initializeExtraAccountMetaList()
      .accounts({
        mint: mint.publicKey,
        extraAccountMetaList: extraAccountMetaListPDA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    const transaction = new Transaction().add(
      initializeExtraAccountMetaListInstruction
    );

    const txSig = await sendAndConfirmTransaction(
      provider.connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true, commitment: "confirmed" }
    );
    console.log("Transaction Signature:", txSig);
    */
  });

  it("Transfer a small amount (policy ok)", async () => {  
    const amount = 1 * 10 ** decimals;
    const bigIntAmount = BigInt(amount);

    const transferInstruction = await createTransferCheckedWithTransferHookInstruction(
      provider.connection,
      sourceTokenAccount,
      mint.publicKey,
      destinationTokenAccount,
      wallet.publicKey,
      bigIntAmount,
      decimals,
      [],
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const transaction = new Transaction().add(
      transferInstruction
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
  });

  it("Transfer a high amount (policy NOT ok)", async () => {
    const amount = 60 * 10 ** decimals;
    const bigIntAmount = BigInt(amount);

    const transferInstruction = await createTransferCheckedWithTransferHookInstruction(
      provider.connection,
      sourceTokenAccount,
      mint.publicKey,
      destinationTokenAccount,
      wallet.publicKey,
      bigIntAmount,
      decimals,
      [],
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const transaction = new Transaction().add(
      transferInstruction
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer],
      { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
  });

});
