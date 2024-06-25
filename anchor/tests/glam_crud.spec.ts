import {
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import { GlamClient } from "../src";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));

describe("glam_crud", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Initialize fund", async () => {
    fundTestExample.shareClasses[0].allowlist = [glamClient.getManager()];
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].allowlist).toEqual([glamClient.getManager()]);
    expect(fund.shareClasses[0].blocklist).toEqual([]);
  });

  it("Update fund", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      await glamClient.program.methods
        .update(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: glamClient.getManager(),
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(updatedFund.name);
  });

  it("Update fund acls", async () => {
    // transfer 1 SOL to treasury
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getManager(),
        toPubkey: glamClient.getTreasuryPDA(fundPDA),
        lamports: 1000_000_000,
      })
    );
    await sendAndConfirmTransaction(glamClient.provider.connection, tranferTx, [
      glamClient.getWalletSigner(),
    ]);
    // transfer 0.1 SOL to key1 as it needs to pay for treasury wsol ata creation
    const tranferTx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getManager(),
        toPubkey: key1.publicKey,
        lamports: 100_000_000,
      })
    );
    await sendAndConfirmTransaction(
      glamClient.provider.connection,
      tranferTx2,
      [glamClient.getWalletSigner()]
    );
    // grant key1 wSolWrap permission
    let updatedFund = glamClient.getFundModel({
      acls: [{ pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] }],
    });
    try {
      await glamClient.program.methods
        .update(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: glamClient.getManager(),
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(1);
    expect(fundModel.acls[0].pubkey).toEqual(key1.publicKey);

    // key1 now has wSolWrap permission, use key1 to wrap some SOL
    try {
      const tx = await glamClient.wsol.wrap(fundPDA, new BN(30_000_000), key1);
      console.log("Wrap:", tx);
    } catch (e) {
      console.log("Error", e);
      throw e;
    }

    // key1 doesn't have wSolUnwrap permission, unwrap should fail
    try {
      const tx = await glamClient.wsol.unwrap(fundPDA, key1);
      console.log("Unwrap:", tx);
    } catch (e) {
      console.log("Error", e);
      const expectedError = e.logs.some((log) =>
        log.includes("Signer is not authorized")
      );
      expect(expectedError).toBeTruthy();
    }
  });

  it("Update fund unauthorized", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      await glamClient.program.methods
        .update(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: key1.publicKey,
        })
        .signers([key1])
        .rpc();
    } catch (e) {
      expect(e.error.errorMessage).toEqual("Signer is not authorized");
    }
  });

  it("Update manager", async () => {
    const manager = glamClient.getManager();
    const newManager = Keypair.generate();
    console.log("New manager:", newManager.publicKey);

    const updatedFund = glamClient.getFundModel({
      manager: {
        name: "New Manager",
        pubkey: newManager.publicKey,
        // kind: "Wallet"
      },
    });
    try {
      await glamClient.program.methods
        .update(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: manager,
        })
        .rpc();
    } catch (err) {
      console.error(err);
      throw err;
    }
    let fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.manager.toString()).toEqual(newManager.publicKey.toString());

    const updatedFund2 = glamClient.getFundModel({
      manager: {
        name: "Old Manager",
        pubkey: manager,
        // kind: "Wallet"
      },
    });

    /* old manager can NOT update back */
    try {
      const txId = await glamClient.program.methods
        .update(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: manager,
        })
        .rpc();
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("not authorized");
    }

    /* new manager CAN update back */
    try {
      const txId = await glamClient.program.methods
        .update(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: newManager.publicKey,
        })
        .signers([newManager])
        .rpc();
    } catch (err) {
      console.error(err);
      throw err;
    }
    fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.manager.toString()).toEqual(manager.toString());
  });

  it("Close fund", async () => {
    const fund = await glamClient.program.account.fundAccount.fetchNullable(
      fundPDA
    );
    expect(fund).not.toBeNull();

    try {
      await glamClient.program.methods
        .close()
        .accounts({
          fund: fundPDA,
          manager: glamClient.getManager(),
        })
        .rpc();
    } catch (err) {
      const notImplemented = (err.logs as string[]).some((log: string) =>
        log.includes("Not implemented")
      );
      expect(notImplemented).toBeTruthy();
    }

    // The account should no longer exist, returning null.
    // const closedAccount =
    //   await glamClient.program.account.fundAccount.fetchNullable(fundPDA);
    // expect(closedAccount).toBeNull();
  });
});
