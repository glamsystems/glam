import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import { GlamClient, GlamError, WSOL } from "../src";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_share_class", () => {
  const glamClient = new GlamClient();
  const glamClientCustomWallet = new GlamClient({ wallet: new Wallet(key1) });
  let fundPDA: PublicKey;

  it("Initialize fund with default account state frozen", async () => {
    const fundForTest = {
      ...fundTestExample,
      integrationAcls: [{ name: { mint: {} }, features: [] }],
    };
    fundForTest.shareClasses[0].allowlist = [glamClient.getManager()];
    fundForTest.shareClasses[0].defaultAccountStateFrozen = true;
    fundForTest.shareClasses[0].permanentDelegate = new PublicKey(0); // set permanent delegate to share class itself
    const fundData = await createFundForTest(glamClient, fundForTest);

    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);

    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].shareClassAllowlist).toEqual([
      glamClient.getManager(),
    ]);
    expect(fund.shareClasses[0].shareClassBlocklist).toEqual([]);
  });

  it("Mint share class fail due to default state frozen", async () => {
    const recipient = key1.publicKey;
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const mintTo = glamClient.getShareClassAta(recipient, shareClassMint);

    const ix = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      mintTo,
      recipient,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );

    try {
      const txId = await glamClient.program.methods
        .mintShare(0, new BN(1_000_000_000))
        .accounts({
          recipient,
          shareClassMint,
          fund: fundPDA,
        })
        .preInstructions([ix])
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.logs).toContain("Program log: Error: Account is frozen");
    }
  });

  it("Thaws token account and mint again", async () => {
    const recipient = key1.publicKey;
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const mintTo = glamClient.getShareClassAta(recipient, shareClassMint);

    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      mintTo,
      recipient,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );
    const ixUpdateAtaState = await glamClient.program.methods
      .setTokenAccountsStates(0, false)
      .accounts({
        shareClassMint,
        fund: fundPDA,
      })
      .remainingAccounts([
        { pubkey: mintTo, isSigner: false, isWritable: true },
      ])
      .instruction();

    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClient.program.methods
        .mintShare(0, amount)
        .accounts({
          recipient,
          shareClassMint,
          fund: fundPDA,
        })
        .preInstructions([ixCreateAta, ixUpdateAtaState])
        .rpc();
      console.log("mintShare txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      mintTo,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(tokenAccount.amount.toString()).toEqual(amount.toString());
  });

  it("Transfer 0.5 share", async () => {
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const from = key1.publicKey;
    const fromAta = glamClient.getShareClassAta(from, shareClassMint);
    const to = key2.publicKey;
    const toAta = glamClient.getShareClassAta(to, shareClassMint);

    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      glamClient.getManager(),
      toAta,
      to,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID
    );
    const ixUpdateAtaState = await glamClient.program.methods
      .setTokenAccountsStates(0, false)
      .accounts({
        shareClassMint,
        fund: fundPDA,
      })
      .remainingAccounts([
        // fromAta is already unfrozen, still add it to test the ix is idempotent
        { pubkey: fromAta, isSigner: false, isWritable: true },
        { pubkey: toAta, isSigner: false, isWritable: true },
      ])
      .instruction();

    const amount = new BN(500_000_000);
    const txId = await glamClient.program.methods
      .forceTransferShare(0, amount)
      .accounts({
        from,
        fromAta,
        to,
        toAta,
        shareClassMint,
        fund: fundPDA,
      })
      .preInstructions([ixCreateAta, ixUpdateAtaState])
      .rpc();
    console.log("forceTransferShare txId", txId);

    const tokenAccount1 = await getAccount(
      glamClient.provider.connection,
      fromAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(tokenAccount1.amount.toString()).toEqual(amount.toString());

    const tokenAccount2 = await getAccount(
      glamClient.provider.connection,
      toAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(tokenAccount2.amount.toString()).toEqual(amount.toString());
  });

  it("Burn 0.5 share", async () => {
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const from = key1.publicKey;
    const fromAta = glamClient.getShareClassAta(from, shareClassMint);

    const amount = new BN(500_000_000);
    const txId = await glamClient.program.methods
      .burnShare(0, amount)
      .accounts({
        from,
        fromAta,
        shareClassMint,
        fund: fundPDA,
      })
      .rpc();
    console.log("burnShare txId", txId);

    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      fromAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(tokenAccount.amount.toString()).toEqual("0");
  });

  it("Subscribe and redeem disabled", async () => {
    try {
      const txId = await glamClient.program.methods
        .setSubscribeRedeemEnabled(false)
        .accounts({
          fund: fundPDA,
        })
        .rpc();
      console.log("setSubscribeRedeemEnabled txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        WSOL,
        new BN(10 ** 8)
      );
      console.log("subscribe:", txId);
    } catch (e) {
      expect((e as GlamError).message).toEqual(
        "Fund is disabled for subscription and redemption."
      );
    }
  }, 15_000);
});
