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
} from "@solana/spl-token";
import { Glam } from '../target/types/glam';

describe('investor', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = 'confirmed';

  const manager = provider.wallet as anchor.Wallet;

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
            const airdrop = await connection.requestAirdrop(user.publicKey, 1_000_000_000);
            await connection.confirmTransaction(airdrop);

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
              idx == 2 ? 10_000_000_000 : 10_000_000,
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
            idx == 2 ? 100_000_000_000 : 100_000_000,
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

  it('Manager tests subscribe to fund', async () => {
    // default price per share is $10
    // manager pays 65 USDC, receives 6.5 shares (6 decimals)
    const amount = new BN(65 * 10 ** 6); // USDC has 6 decimals
    const expectedShares = "65000000";   // share has 6 decimals
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: usdc.publicKey,
          treasuryAta: treasuryUsdcAta,
          signerAssetAta: managerUsdcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
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
          asset: usdc.publicKey,
          treasuryAta: treasuryUsdcAta,
          signerAssetAta: managerUsdcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true }, //TODO: this can be false
          { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
          { pubkey: pricingUsdc, isSigner: false, isWritable: false },
          { pubkey: btc.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
          { pubkey: managerBtcAta, isSigner: false, isWritable: true },
          { pubkey: pricingBtc, isSigner: false, isWritable: false },
          { pubkey: eth.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryEthAta, isSigner: false, isWritable: true },
          { pubkey: managerEthAta, isSigner: false, isWritable: true },
          { pubkey: pricingEth, isSigner: false, isWritable: false },
        ])
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

  it('Manager adds more tokens and redeems 100% of fund', async () => {
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
          asset: usdc.publicKey,
          treasuryAta: treasuryUsdcAta,
          signerAssetAta: managerUsdcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true }, //TODO: this can be false
          { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
          { pubkey: pricingUsdc, isSigner: false, isWritable: false },
          { pubkey: btc.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
          { pubkey: managerBtcAta, isSigner: false, isWritable: true },
          { pubkey: pricingBtc, isSigner: false, isWritable: false },
          { pubkey: eth.publicKey, isSigner: false, isWritable: false },
          { pubkey: treasuryEthAta, isSigner: false, isWritable: true },
          { pubkey: managerEthAta, isSigner: false, isWritable: true },
          { pubkey: pricingEth, isSigner: false, isWritable: false },
        ])
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
  });

  it('Alice subscribes to fund with .5 BTC', async () => {
    const aliceBtcAta = getAssociatedTokenAddressSync(btc.publicKey, alice.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const aliceEthAta = getAssociatedTokenAddressSync(eth.publicKey, alice.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    // const amount = new BN(5 * 10 ** 8); // BTC has 9 decimals
    const amount = new BN(5 * 10 ** 5); // ETH has 6 decimals
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: aliceSharesAta,
          asset: eth.publicKey,
          treasuryAta: treasuryEthAta,
          signerAssetAta: aliceEthAta,
          signer: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([alice])
        .rpc({commitment});
    } catch(e) {
      // subscribe
      console.error(e);
      throw e;
    }

    const shares = await getMint(connection, sharePDA, commitment, TOKEN_2022_PROGRAM_ID);
    expect(shares.supply.toString()).toEqual("500000");

    // const managerShares = await getAccount(connection, managerSharesAta, commitment, TOKEN_2022_PROGRAM_ID);
    // expect(managerShares.amount).toEqual(shares.supply);
  });

});
