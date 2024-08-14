import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import { GlamClient } from "../src";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_crud", () => {
  const glamClient = new GlamClient();
  const glamClientCustomWallet = new GlamClient({ wallet: new Wallet(key1) });
  let fundPDA: PublicKey;

  it("Initialize fund", async () => {
    fundTestExample.shareClasses[0].allowlist = [glamClient.getManager()];
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].allowlist).toEqual([glamClient.getManager()]);
    expect(fund.shareClasses[0].blocklist).toEqual([]);
  });

  it("Update fund name", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      await glamClient.program.methods
        .updateFund(updatedFund)
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

  it("Update enabled integrations #1", async () => {
    const updatedFund1 = glamClient.getFundModel({
      integrations: [{ drift: {} }],
    });
    try {
      const tx = await glamClient.program.methods
        .updateFund(updatedFund1)
        .accounts({
          fund: fundPDA,
          signer: glamClient.getManager(),
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fundModel1 = await glamClient.fetchFund(fundPDA);
    expect(fundModel1.integrations.length).toEqual(1);
    expect(fundModel1.integrations[0]).toEqual({ drift: {} });

    const updatedFund2 = glamClient.getFundModel({
      integrations: [
        { drift: {} },
        { jupiter: {} },
        { marinade: {} },
        { stakePool: {} },
      ],
    });
    try {
      const tx = await glamClient.program.methods
        .updateFund(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: glamClient.getManager(),
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fundModel2 = await glamClient.fetchFund(fundPDA);
    expect(fundModel2.integrations.length).toEqual(4);
    expect(fundModel2.integrations).toEqual(updatedFund2?.integrations);
  });

  it("Fund acls upsert", async () => {
    // empty acls
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls.length).toEqual(0);

    // grant key1 wSolWrap permission
    const acls = [{ pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] }];
    try {
      await glamClient.upsertAcls(fundPDA, acls);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(1);
    expect(fundModel.acls[0].pubkey).toEqual(key1.publicKey);
    expect(fundModel.acls[0].permissions).toEqual([{ wSolWrap: {} }]);

    // grant key1 wSolWrap and wSolUnwrap permission
    try {
      await glamClient.upsertAcls(fundPDA, [
        {
          pubkey: key1.publicKey,
          permissions: [{ wSolWrap: {} }, { wSolUnwrap: {} }],
        },
      ]);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(1);
    expect(fundModel.acls[0].pubkey).toEqual(key1.publicKey);
    expect(fundModel.acls[0].permissions).toEqual([
      { wSolWrap: {} },
      { wSolUnwrap: {} },
    ]);
  });

  it("Fund acls delete", async () => {
    // add key2 permissions
    const acls = [{ pubkey: key2.publicKey, permissions: [{ stake: {} }] }];
    try {
      await glamClient.upsertAcls(fundPDA, acls);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(2);
    expect(fundModel.acls[1].pubkey).toEqual(key2.publicKey);
    expect(fundModel.acls[1].permissions).toEqual([{ stake: {} }]);

    // remove key1 and key2 permissions
    try {
      await glamClient.deleteAcls(fundPDA, [key1.publicKey, key2.publicKey]);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(0);
  });

  it("Update fund acls and test authorization", async () => {
    // transfer 1 SOL to treasury
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getManager(),
        toPubkey: glamClient.getTreasuryPDA(fundPDA),
        lamports: 1_000_000_000,
      })
    );
    await glamClient.sendAndConfirm(tranferTx);

    // transfer 0.1 SOL to key1 as it needs to pay for treasury wsol ata creation
    const tranferTx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getManager(),
        toPubkey: key1.publicKey,
        lamports: 100_000_000,
      })
    );
    await glamClient.sendAndConfirm(tranferTx2);

    // grant key1 wSolWrap permission
    let updatedFund = glamClient.getFundModel({
      acls: [{ pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] }],
    });
    try {
      await glamClient.program.methods
        .updateFund(updatedFund)
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
      const tx = await glamClientCustomWallet.wsol.wrap(
        fundPDA,
        new BN(30_000_000)
      );
      console.log("Wrap:", tx);
    } catch (e) {
      console.log("Error", e);
      throw e;
    }

    // key1 doesn't have wSolUnwrap permission, unwrap should fail
    try {
      const txId = await glamClientCustomWallet.wsol.unwrap(fundPDA);
      console.log("Unwrap:", txId);
      expect(txId).toBeUndefined();
    } catch (e) {
      // console.log("Error", e);
      const expectedError = e.logs.some((log) =>
        log.includes("Signer is not authorized")
      );
      expect(expectedError).toBeTruthy();
    }
  });

  it("Update fund unauthorized", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      const txId = await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: key1.publicKey,
        })
        .signers([key1])
        .rpc();
      expect(txId).toBeUndefined();
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
        .updateFund(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: manager,
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
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

    // old manager can NOT update back
    try {
      const txId = await glamClient.program.methods
        .updateFund(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: manager,
        })
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain("not authorized");
    }

    // new manager CAN update back
    try {
      const txId = await glamClient.program.methods
        .updateFund(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: newManager.publicKey,
        })
        .signers([newManager])
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.manager.toString()).toEqual(manager.toString());
  });

  it("Close fund", async () => {
    const fund = await glamClient.program.account.fundAccount.fetchNullable(
      fundPDA
    );
    expect(fund).not.toBeNull();

    const manager = glamClient.getManager();
    const treasury = glamClient.getTreasuryPDA(fundPDA);
    const openfunds = glamClient.getOpenfundsPDA(fundPDA);

    try {
      const txId = await glamClient.program.methods
        .closeFund()
        .accounts({
          fund: fundPDA,
          manager,
          treasury,
          openfunds,
        })
        .rpc();
      console.log("Close fund txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // The following accounts should no longer exist
    const ret = await Promise.all(
      [fundPDA, treasury, openfunds].map(
        async (address) =>
          await glamClient.program.account.fundAccount.fetchNullable(address)
      )
    );
    expect(ret).toEqual([null, null, null]);
  });
});
