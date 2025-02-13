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

describe("glam_mint", () => {
  const glamClient = new GlamClient();
  let statePda: PublicKey;

  it("Initialize mint with default account state frozen", async () => {
    const stateForTest = {
      ...stateModelForTest,
      accountType: { mint: {} },
      mints: [
        {
          ...stateModelForTest.mints![0],
          allowlist: [key1.publicKey],
          blocklist: [key2.publicKey],
          defaultAccountStateFrozen: true,
          permanentDelegate: new PublicKey(0), // set permanent delegate to share class itself
        },
      ],
    };
    const stateData = await createGlamStateForTest(glamClient, stateForTest);

    statePda = stateData.statePda;

    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.mints?.length).toEqual(1);
    expect(stateModel.mints![0].allowlist).toEqual([key1.publicKey]);
    expect(stateModel.mints![0].blocklist).toEqual([key2.publicKey]);
  });

  it("Mint share class fail due to default state frozen", async () => {
    try {
      const txSig = await glamClient.mint.mint(
        statePda,
        0,
        key1.publicKey,
        new BN(1_000_000_000),
      );
      expect(txSig).toBeUndefined();
    } catch (e) {
      expect(e.logs).toContain("Program log: Error: Account is frozen");
    }
  });

  it("Unfreeze token account and mint", async () => {
    const amount = new BN(1_000_000_000);
    const recipient = key1.publicKey;
    try {
      const txSig = await glamClient.mint.mint(
        statePda,
        0,
        recipient,
        amount,
        true,
      );
      console.log("mint txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const glamMint = glamClient.getMintPda(statePda);
    const mintTo = glamClient.getMintAta(recipient, glamMint);
    const tokenAccount = await getAccount(
      glamClient.provider.connection,
      mintTo,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(tokenAccount.amount.toString()).toEqual(amount.toString());
  });

  it("Freeze token account", async () => {
    const glamMint = glamClient.getMintPda(statePda, 0);
    const ata = glamClient.getMintAta(key1.publicKey, glamMint);

    // Before: token account is not frozen
    let accountInfo = await glamClient.provider.connection.getAccountInfo(ata);
    let tokenAccount = unpackAccount(ata, accountInfo, TOKEN_2022_PROGRAM_ID);
    expect(tokenAccount.isFrozen).toEqual(false);

    // Freeeze token account
    try {
      const txSig = await glamClient.mint.setTokenAccountsStates(
        statePda,
        0,
        [ata],
        true,
      );
      console.log("setTokenAccountsStates txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // After: token account is frozen
    accountInfo = await glamClient.provider.connection.getAccountInfo(ata);
    tokenAccount = unpackAccount(ata, accountInfo, TOKEN_2022_PROGRAM_ID);
    expect(tokenAccount.isFrozen).toEqual(true);
  });

  it("Force transfer 0.5 share", async () => {
    const glamMint = glamClient.getMintPda(statePda, 0);
    const from = key1.publicKey;
    const to = key2.publicKey;
    const fromAta = glamClient.getMintAta(from, glamMint);
    const toAta = glamClient.getMintAta(to, glamMint);

    const amount = new BN(500_000_000);
    try {
      const txSig = await glamClient.mint.forceTransfer(
        statePda,
        0,
        amount,
        from,
        to,
        true,
      );
      console.log("forceTransfer txSig", txSig);
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
    const txSig = await glamClient.mint.burn(statePda, 0, amount, from);
    console.log("burn txSig", txSig);

    const glamMint = glamClient.getMintPda(statePda, 0);
    const fromAta = glamClient.getMintAta(from, glamMint);
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
      const txSig = await glamClient.state.setSubscribeRedeemEnabled(
        statePda,
        false,
      );
      console.log("setSubscribeRedeemEnabled txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txSig = await glamClient.investor.subscribe(
        statePda,
        WSOL,
        new BN(10 ** 8),
      );
      console.log("subscribe:", txSig);
    } catch (e) {
      expect((e as GlamError).message).toEqual(
        "Fund is disabled for subscription and redemption.",
      );
    }
  }, 15_000);
});
