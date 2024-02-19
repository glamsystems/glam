import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Glam } from '../target/types/glam';

describe('investor', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = 'confirmed';

  const payer = provider.wallet as anchor.Wallet;

  const tokenKeypairs = [
    Keypair.generate(), // mock token 0
    Keypair.generate(), // ...
    Keypair.generate(),
  ];

  const fundName = "Investment fund";
  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode('fund'),
    payer.publicKey.toBuffer(),
    anchor.utils.bytes.utf8.encode(fundName),
  ], program.programId);

  const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode('treasury'),
    fundPDA.toBuffer(),
  ], program.programId);

  const [sharePDA, shareBump] = PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode('share-0'),
    fundPDA.toBuffer(),
  ], program.programId);

  beforeAll(async () => {
    await Promise.all( // exec in parallel, but await before ending the test
      tokenKeypairs.map(async (token) => {
        const mint = await createMint(
          connection,
          payer.payer,
          payer.publicKey,
          null,
          6,
          token,
          { commitment }, // await 'confirmed'
        );

        const payerATA = await createAssociatedTokenAccount(
          connection,
          payer.payer,
          token.publicKey,
          payer.publicKey,
        );

        await mintTo(
          connection,
          payer.payer,
          token.publicKey,
          payerATA,
          payer.payer,
          1000,
          [],
          { commitment }, // await 'confirmed'
        );
      })
    );
  });

  it('Initialize fund', async () => {

    // const treasuryATA = getAssociatedTokenAddressSync(mints[0], treasuryPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    try {
      const txId = await program.methods
        .initialize(fundName)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          share0: sharePDA,
          assetBase: tokenKeypairs[0].publicKey,
          manager: payer.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc({commitment});

      await connection.getParsedTransaction(txId, {commitment});
    } catch(e) {
      console.error(e);
      throw e;
    }

    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.shareClassesLen).toEqual(1);
  });

  it('Subscribe to fund', async () => {

    const treasuryAta = getAssociatedTokenAddressSync(tokenKeypairs[0].publicKey, treasuryPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const signerAta = getAssociatedTokenAddressSync(tokenKeypairs[0].publicKey, payer.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const shareAta = getAssociatedTokenAddressSync(sharePDA, payer.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    //TODO: remove creation of ATA
    // currently we need to manually create the ATAs
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        treasuryAta,
        treasuryPDA,
        tokenKeypairs[0].publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        shareAta,
        payer.publicKey,
        sharePDA,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer.payer],
      { skipPreflight: true }
    );

    const amount = new BN(100);
    try {
      await program.methods
        .subscribe(amount)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          shareAta: shareAta,
          asset: tokenKeypairs[0].publicKey,
          treasuryAta,
          signerAta,
          signer: payer.publicKey,
          assetTokenProgram: TOKEN_PROGRAM_ID,
          shareTokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
    } catch(e) {
      console.error(e);
      throw e;
    }
  });

  it('Redeem from fund', async () => {

    const treasuryAta = getAssociatedTokenAddressSync(tokenKeypairs[0].publicKey, treasuryPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const signerAta = getAssociatedTokenAddressSync(tokenKeypairs[0].publicKey, payer.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const shareAta = getAssociatedTokenAddressSync(sharePDA, payer.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const amount = new BN(50);
    try {
      await program.methods
        .redeem(amount)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          shareAta: shareAta,
          asset: tokenKeypairs[0].publicKey,
          treasuryAta,
          signerAta,
          signer: payer.publicKey,
          assetTokenProgram: TOKEN_PROGRAM_ID,
          shareTokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
    } catch(e) {
      console.error(e);
      throw e;
    }
  });

});
