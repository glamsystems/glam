import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import { GlamClient, GlamError, WSOL } from "../src";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_share_class", () => {
  const glamClient = new GlamClient();
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
    try {
      const txId = await glamClient.shareClass.mintShare(
        fundPDA,
        0,
        key1.publicKey,
        new BN(1_000_000_000),
      );
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.logs).toContain("Program log: Error: Account is frozen");
    }
  });

  it("Mint again and force thawing token account", async () => {
    const amount = new BN(1_000_000_000);
    const recipient = key1.publicKey;
    try {
      const txId = await glamClient.shareClass.mintShare(
        fundPDA,
        0,
        recipient,
        amount,
        true,
      );
      console.log("mintShare txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shareClassMint = glamClient.getShareClassPDA(fundPDA);
    const mintTo = glamClient.getShareClassAta(recipient, shareClassMint);
    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      mintTo,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(tokenAccount.amount.toString()).toEqual(amount.toString());
  });

  it("Freeze token account", async () => {
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const ata = glamClient.getShareClassAta(key1.publicKey, shareClassMint);

    // Token account is not frozen before the tx
    let accountInfo = await glamClient.provider.connection.getAccountInfo(ata);
    let tokenAccount = unpackAccount(ata, accountInfo, TOKEN_2022_PROGRAM_ID);
    expect(tokenAccount.isFrozen).toEqual(false);

    // Freeeze token account
    try {
      const txId = await glamClient.shareClass.setTokenAccountsStates(
        fundPDA,
        0,
        [ata],
        true,
      );
      console.log("setTokenAccountsStates txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // Token account is frozen before the tx
    accountInfo = await glamClient.provider.connection.getAccountInfo(ata);
    tokenAccount = unpackAccount(ata, accountInfo, TOKEN_2022_PROGRAM_ID);
    expect(tokenAccount.isFrozen).toEqual(true);
  });

  it("Force transfer 0.5 share", async () => {
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const from = key1.publicKey;
    const to = key2.publicKey;
    const fromAta = glamClient.getShareClassAta(from, shareClassMint);
    const toAta = glamClient.getShareClassAta(to, shareClassMint);

    const amount = new BN(500_000_000);
    try {
      const txId = await glamClient.shareClass.forceTransferShare(
        fundPDA,
        0,
        amount,
        from,
        to,
        true,
      );
      console.log("forceTransferShare txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const tokenAccount1 = await getAccount(
      glamClient.provider.connection,
      fromAta,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(tokenAccount1.amount.toString()).toEqual(amount.toString());

    const tokenAccount2 = await getAccount(
      glamClient.provider.connection,
      toAta,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(tokenAccount2.amount.toString()).toEqual(amount.toString());
  });

  it("Burn 0.5 share", async () => {
    const from = key1.publicKey;

    const amount = new BN(500_000_000);
    const txId = await glamClient.shareClass.burnShare(
      fundPDA,
      0,
      amount,
      from,
    );
    console.log("burnShare txId", txId);

    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
    const fromAta = glamClient.getShareClassAta(from, shareClassMint);
    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      fromAta,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(tokenAccount.amount.toString()).toEqual("0");
  });

  it("Subscribe and redeem disabled", async () => {
    try {
      const txId = await glamClient.fund.setSubscribeRedeemEnabled(
        fundPDA,
        false,
      );
      console.log("setSubscribeRedeemEnabled txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        WSOL,
        new BN(10 ** 8),
      );
      console.log("subscribe:", txId);
    } catch (e) {
      expect((e as GlamError).message).toEqual(
        "Fund is disabled for subscription and redemption.",
      );
    }
  }, 15_000);
});
