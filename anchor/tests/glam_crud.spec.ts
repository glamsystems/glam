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

describe('glam_crud', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const manager = provider.wallet as anchor.Wallet;
  console.log("Manager:", manager.publicKey);

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = 'confirmed';

  const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
  const eth = new PublicKey("So11111111111111111111111111111111111111112");  // 6 decimals
  const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv");  // 9 decimals
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

  const fundName = "Investment fund";
  const fundSymbol = "FFF";
  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode('fund'),
    manager.publicKey.toBuffer(),
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

  beforeAll(async () => {}, 15_000);

  it('Initialize fund', async () => {
    const txId = await program.methods
      .initialize(fundName, fundSymbol, [0, 60, 40], true)
      .accounts({
        fund: fundPDA,
        treasury: treasuryPDA,
        share: sharePDA,
        manager: manager.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: usdc, isSigner: false, isWritable: false },
        { pubkey: btc, isSigner: false, isWritable: false },
        { pubkey: eth, isSigner: false, isWritable: false },
      ])
      .rpc({commitment}); // await 'confirmed'

    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.shareClassesLen).toEqual(1);
    expect(fund.assetsLen).toEqual(3);
    expect(fund.name).toEqual(fundName);
    expect(fund.symbol).toEqual(fundSymbol);
    expect(fund.isActive).toEqual(true);
  });

  it('Update fund', async () => {
    const newFundName = 'Updated fund name';
    await program.methods.update(newFundName, null, null, false)
    .accounts({
      fund: fundPDA,
      manager: manager.publicKey,
    })
      .rpc({commitment});
    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.name).toEqual(newFundName);
    expect(fund.isActive).toEqual(false);
  });

  it('Close fund', async () => {
    await program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fund.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });

  /*
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
          [],
          { commitment }, // await 'confirmed'
        );
      })
    );
  });
  */

  // it('Create Drift trading account', async () => {
	// 	const userAccountPublicKey = await getUserAccountPublicKey(
	// 		DRIFT_PROGRAM_ID,
	// 		treasuryPDA,
	// 		0
	// 	);
	// 	const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
	// 		DRIFT_PROGRAM_ID,
	// 		treasuryPDA
	// 	);
	// 	const statePublicKey = await getDriftStateAccountPublicKey(
	// 		DRIFT_PROGRAM_ID,
	// 	);

  //   console.log("userAccountPublicKey", userAccountPublicKey);
  //   console.log("userStatsAccountPublicKey", userStatsAccountPublicKey);
  //   console.log("statePublicKey", statePublicKey);
  //   console.log("fundPDA", fundPDA);
  //   console.log("treasuryPDA", treasuryPDA);

  //   try {
  //     const txId = await program.methods
  //       .driftInitialize()
  //       .accounts({
  //         fund: fundPDA,
  //         treasury: treasuryPDA,
  //         userStats: userStatsAccountPublicKey,
  //         user: userAccountPublicKey,
  //         state: statePublicKey,
  //         manager: manager.publicKey,
  //         driftProgram: DRIFT_PROGRAM_ID,
  //       })
  //       .rpc({commitment}); // await 'confirmed'

  //     await connection.getParsedTransaction(txId, {commitment});
  //     console.log("driftInitialize", txId);
  //   } catch(e) {
  //     console.error(e);
  //     throw e;
  //   }

  //   // const fund = await program.account.fund.fetch(fundPDA);
  //   // console.log(fund);
  //   // expect(fund.shareClassesLen).toEqual(1);
  //   // expect(fund.assetsLen).toEqual(3);
  // }, /* timeout */ 10_000);
});
