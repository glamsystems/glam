import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { createGlamStateForTest, stateModelForTest, str2seed } from "./setup";
import { GlamClient, GlamError, WSOL } from "../src";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_share_class", () => {
  const glamClient = new GlamClient();
  let statePda: PublicKey;

  it("Initialize mint with default account state frozen", async () => {
    const stateForTest = {
      ...stateModelForTest,
      integrationAcls: [{ name: { mint: {} }, features: [] }], // must have mint integration
      mints: [
        {
          ...stateModelForTest.mints![0],
          allowlist: [glamClient.getSigner()],
          defaultAccountStateFrozen: true,
          permanentDelegate: new PublicKey(0), // set permanent delegate to share class itself
        },
      ],
    };
    const stateData = await createGlamStateForTest(glamClient, stateForTest);

    statePda = stateData.statePda;

    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.mints.length).toEqual(1);
    expect(stateModel.mints[0].allowlist).toEqual([glamClient.getSigner()]);
    expect(stateModel.mints[0].blocklist).toEqual([]);
  });

  it("Mint share class fail due to default state frozen", async () => {
    try {
      const txId = await glamClient.shareClass.mintShare(
        statePda,
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
        statePda,
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

    const shareClassMint = glamClient.getShareClassPda(statePda);
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
    const shareClassMint = glamClient.getShareClassPda(statePda, 0);
    const ata = glamClient.getShareClassAta(key1.publicKey, shareClassMint);

    // Token account is not frozen before the tx
    let accountInfo = await glamClient.provider.connection.getAccountInfo(ata);
    let tokenAccount = unpackAccount(ata, accountInfo, TOKEN_2022_PROGRAM_ID);
    expect(tokenAccount.isFrozen).toEqual(false);

    // Freeeze token account
    try {
      const txId = await glamClient.shareClass.setTokenAccountsStates(
        statePda,
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
    const shareClassMint = glamClient.getShareClassPda(statePda, 0);
    const from = key1.publicKey;
    const to = key2.publicKey;
    const fromAta = glamClient.getShareClassAta(from, shareClassMint);
    const toAta = glamClient.getShareClassAta(to, shareClassMint);

    const amount = new BN(500_000_000);
    try {
      const txId = await glamClient.shareClass.forceTransferShare(
        statePda,
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
      statePda,
      0,
      amount,
      from,
    );
    console.log("burnShare txId", txId);

    const shareClassMint = glamClient.getShareClassPda(statePda, 0);
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
      const txId = await glamClient.state.setSubscribeRedeemEnabled(
        statePda,
        false,
      );
      console.log("setSubscribeRedeemEnabled txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.investor.subscribe(
        statePda,
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
