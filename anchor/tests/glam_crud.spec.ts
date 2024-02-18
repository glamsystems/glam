import * as anchor from '@coral-xyz/anchor';
import { Program, } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Glam } from '../target/types/glam';

describe('glam', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = 'confirmed';

  const tokenKeypairs = [
    Keypair.generate(), // mock token 0
    Keypair.generate(), // ...
    Keypair.generate(),
  ];
  let mints;

  const fundName = "My first fund";
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

  it('Before any fund - create test assets', async () => {
    await Promise.all( // exec in parallel, but await before ending the test
      tokenKeypairs.map(async (token) => {
        const mint = await createMint(
          provider.connection,
          payer.payer,
          payer.publicKey,
          null,
          6,
          token,
          { commitment }, // await 'confirmed'
        );

        const payerATA = await createAssociatedTokenAccount(
          provider.connection,
          payer.payer,
          token.publicKey,
          payer.publicKey,
        );

        await mintTo(
          provider.connection,
          payer.payer,
          token.publicKey,
          payerATA,
          payer.payer,
          1000,
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

    const tx = await provider.connection.getParsedTransaction(txId, {commitment});
    console.log(tx?.transaction.message);
    } catch(e) {
      console.error(e)
    }

    const fund = await program.account.fund.fetch(fundPDA);
    // console.log(fund);

    expect(fund.assetsLen).toEqual(0);
    expect(fund.shareClassesLen).toEqual(1);
  });

  it('Close fund', async () => {
    await program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: payer.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fund.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });

});
