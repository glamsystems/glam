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
  getMint,
  getAccount,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import {
	getDriftStateAccountPublicKey,
	getUserAccountPublicKey,
	getUserStatsAccountPublicKey,
} from "@drift-labs/sdk";
import { Glam } from '../target/types/glam';

describe('investor', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = 'confirmed';

  const manager = provider.wallet as anchor.Wallet;
  console.log("Manager:", manager.publicKey);

  const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");

  const userKeypairs = [
    Keypair.generate(), // mock user 0
    Keypair.generate(), // ...
    Keypair.generate(),
  ];
  const alice = userKeypairs[0];
  const bob = userKeypairs[1];
  const eve = userKeypairs[2];

  const tokenKeypairs = [
    Keypair.generate(), // mock token 0
    Keypair.generate(), // ...
    Keypair.generate(),
  ];
  const usdc = tokenKeypairs[0]; // 6 decimals
  const eth = tokenKeypairs[1];  // 6 decimals
  const btc = tokenKeypairs[2];  // 9 decimals, token2022
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

  const fundName = "Investment fund";
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

  // treasury
  const treasuryUsdcAta = getAssociatedTokenAddressSync(usdc.publicKey, treasuryPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const treasuryEthAta = getAssociatedTokenAddressSync(eth.publicKey, treasuryPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const treasuryBtcAta = getAssociatedTokenAddressSync(btc.publicKey, treasuryPDA, true, BTC_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  
  // manager
  const managerUsdcAta = getAssociatedTokenAddressSync(usdc.publicKey, manager.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const managerEthAta = getAssociatedTokenAddressSync(eth.publicKey, manager.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const managerBtcAta = getAssociatedTokenAddressSync(btc.publicKey, manager.publicKey, false, BTC_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const managerSharesAta = getAssociatedTokenAddressSync(sharePDA, manager.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  // users' shares
  const aliceSharesAta = getAssociatedTokenAddressSync(sharePDA, alice.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const bobSharesAta = getAssociatedTokenAddressSync(sharePDA, bob.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const eveSharesAta = getAssociatedTokenAddressSync(sharePDA, eve.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  // pricing
  //TODO
  const pricingUsdc = treasuryUsdcAta;
  const pricingEth = treasuryEthAta;
  const pricingBtc = treasuryBtcAta;

  let remainingAccountsSubscribe = [
    // { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: false },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    // { pubkey: btc.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: false },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
    // { pubkey: eth.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerEthAta, isSigner: false, isWritable: true },
    { pubkey: treasuryEthAta, isSigner: false, isWritable: false },
    { pubkey: pricingEth, isSigner: false, isWritable: false },
  ]

  let remainingAccountsRedeem = [
    { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    { pubkey: btc.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
    { pubkey: eth.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerEthAta, isSigner: false, isWritable: true },
    { pubkey: treasuryEthAta, isSigner: false, isWritable: true },
    { pubkey: pricingEth, isSigner: false, isWritable: false },
  ]

  beforeAll(async () => {
    try {
      await Promise.all( // exec in parallel, but await before ending the test
        tokenKeypairs.map(async (token, idx) => {
          const mint = await createMint(
            connection,
            manager.payer,
            manager.publicKey,
            null,
            idx == 2 ? 9 : 6,
            token,
            { commitment }, // await 'confirmed'
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          for (const user of userKeypairs) {
            // send 1 SOL to each user
            // const airdrop = await connection.requestAirdrop(user.publicKey, 1_000_000_000);
            // await connection.confirmTransaction(airdrop);

            const userATA = await createAssociatedTokenAccount(
              connection,
              user,
              token.publicKey,
              user.publicKey,
              {},
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
            await mintTo(
              connection,
              user,
              token.publicKey,
              userATA,
              manager.payer,
              idx == 2 ? 10_000_000_000 : 1000_000_000,
              [],
              {},
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
          }

          const managerAta = await createAssociatedTokenAccount(
            connection,
            manager.payer,
            token.publicKey,
            manager.publicKey,
            {},
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          await mintTo(
            connection,
            manager.payer,
            token.publicKey,
            managerAta,
            manager.payer,
            idx == 2 ? 1000_000_000_000 : 1000_000_000,
            [],
            { commitment }, // await 'confirmed'
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );
        })
      );
    } catch(e) {
      // beforeAll
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  it('Initialize fund', async () => {
    try {
      const txId = await program.methods
        .initialize(fundName, [0, 60, 40], true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          share: sharePDA,
          manager: manager.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
          { pubkey: btc.publicKey, isSigner: false, isWritable: false },
          { pubkey: eth.publicKey, isSigner: false, isWritable: false },
        ])
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
    } catch(e) {
      console.error(e);
      throw e;
    }

    const fund = await program.account.fund.fetch(fundPDA);
    console.log(fund);
    expect(fund.shareClassesLen).toEqual(1);
    expect(fund.assetsLen).toEqual(3);
  });

  it('Create ATAs', async () => {
    //TODO: remove creation of ATA
    // currently we need to manually create the ATAs
    try {
      const tx1 = new Transaction().add(
        // Treasury
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryUsdcAta,
          treasuryPDA,
          usdc.publicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryEthAta,
          treasuryPDA,
          eth.publicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryBtcAta,
          treasuryPDA,
          btc.publicKey,
          BTC_TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
      );
      await sendAndConfirmTransaction(
        connection,
        tx1,
        [manager.payer],
        { skipPreflight: true, commitment }
      );

      const tx2 = new Transaction().add(
        // Shares
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          managerSharesAta,
          manager.publicKey,
          sharePDA,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          aliceSharesAta,
          alice.publicKey,
          sharePDA,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          bobSharesAta,
          bob.publicKey,
          sharePDA,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          eveSharesAta,
          eve.publicKey,
          sharePDA,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
      );

      const txSig = await sendAndConfirmTransaction(
        connection,
        tx2,
        [manager.payer],
        { skipPreflight: true, commitment }
      );
    } catch(e) {
      // create ATAs
      console.error(e);
      throw e;
    }
  });

  it('Create Drift trading account', async () => {

		const userAccountPublicKey = await getUserAccountPublicKey(
			DRIFT_PROGRAM_ID,
			treasuryPDA,
			0
		);
		const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
			DRIFT_PROGRAM_ID,
			treasuryPDA
		);
		const statePublicKey = await getDriftStateAccountPublicKey(
			DRIFT_PROGRAM_ID,
		);


    try {
      const txId = await program.methods
        .driftInitialize()
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          driftProgram: DRIFT_PROGRAM_ID,
        })
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftInitialize", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }

    // const fund = await program.account.fund.fetch(fundPDA);
    // console.log(fund);
    // expect(fund.shareClassesLen).toEqual(1);
    // expect(fund.assetsLen).toEqual(3);
  }, /* timeout */ 60_000);

  it('Manager tests subscribe ETH to fund', async () => {
    const amount = new BN(10 * 10 ** 6); // 10 ETH = $30k
    const expectedShares = "3000";       // $10/share => 3k shares
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: eth.publicKey,
          treasuryAta: treasuryEthAta,
          signerAssetAta: managerEthAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc({commitment});
    } catch(e) {
      // subscribe
      console.error(e);
      throw e;
    }

    const shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it('Manager tests subscribe BTC to fund', async () => {
    const amount = new BN(1 * 10 ** 9);  // 1 BTC = $51k
    const expectedShares = "8100";       // 3,000 + 5,100
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: btc.publicKey,
          treasuryAta: treasuryBtcAta,
          signerAssetAta: managerBtcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc({commitment});
    } catch(e) {
      // subscribe
      console.error(e);
      throw e;
    }

    const shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it('Manager redeems 50% of fund', async () => {
    let shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    const amount = new BN(shares.supply / 2n);
    try {
      await program.methods
        .redeem(amount, true, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({commitment});
    } catch(e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual(amount.toString());

    const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it('Manager adds more tokens and redeems USDC', async () => {
    // transfer 250 USDC into the treasury (e.g. fees)
    try {
      const tx1 = new Transaction().add(
        createTransferCheckedInstruction(
          managerUsdcAta,
          usdc.publicKey,
          treasuryUsdcAta,
          manager.publicKey,
          250_000_000,
          6,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );
      await sendAndConfirmTransaction(
        connection,
        tx1,
        [manager.payer],
        { skipPreflight: true, commitment }
      );
    } catch(e) {
      // transfer usdc into treasury
      console.error(e);
      throw e;
    }

    let treasuryUsdc = await getAccount(connection, treasuryUsdcAta, commitment, TOKEN_PROGRAM_ID);
    const oldAmount = treasuryUsdc.amount;

    const amount = new BN(5);
    try {
      await program.methods
        .redeem(amount, false, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({commitment});
    } catch(e) {
      // redeem
      console.error(e);
      throw e;
    }

    treasuryUsdc = await getAccount(connection, treasuryUsdcAta, commitment, TOKEN_PROGRAM_ID);
    const newAmount = treasuryUsdc.amount;
    console.log("newAmount", newAmount, "oldAmount", oldAmount);
    expect(oldAmount).toBeGreaterThan(newAmount);
  });

  it('Manager redeems 100% of fund', async () => {
    let shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    const amount = new BN(shares.supply);
    try {
      await program.methods
        .redeem(amount, true, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({commitment});
    } catch(e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual("0");

    const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    expect(managerShares.amount).toEqual(shares.supply);

    const treasuryUsdc = await getAccount(connection, treasuryUsdcAta, commitment, TOKEN_PROGRAM_ID);
    expect(treasuryUsdc.amount).toEqual(shares.supply);

    const treasuryEth = await getAccount(connection, treasuryEthAta, commitment, TOKEN_PROGRAM_ID);
    expect(treasuryEth.amount).toEqual(shares.supply);

    const treasuryBtc = await getAccount(connection, treasuryBtcAta, commitment, BTC_TOKEN_PROGRAM_ID);
    expect(treasuryBtc.amount).toEqual(shares.supply);
  });

  it('Alice subscribes to fund with 250 USDC', async () => {
    const aliceBtcAta = getAssociatedTokenAddressSync(btc.publicKey, alice.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const aliceEthAta = getAssociatedTokenAddressSync(eth.publicKey, alice.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const aliceUsdcAta = getAssociatedTokenAddressSync(usdc.publicKey, alice.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    // const amount = new BN(5 * 10 ** 8); // BTC has 9 decimals
    // const amount = new BN(5 * 10 ** 5); // ETH has 6 decimals
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: aliceSharesAta,
          asset: usdc.publicKey,
          treasuryAta: treasuryUsdcAta,
          signerAssetAta: aliceUsdcAta,
          signer: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .signers([alice])
        .rpc({commitment});
    } catch(e) {
      // subscribe
      console.error(e);
      throw e;
    }

    const shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual("25");

    // const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    // expect(managerShares.amount).toEqual(shares.supply);
  });

});
