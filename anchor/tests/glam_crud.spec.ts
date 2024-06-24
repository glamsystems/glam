import { Keypair, PublicKey } from "@solana/web3.js";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import { GlamClient } from "../src";
import { AnchorError } from "@coral-xyz/anchor";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

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
    // grant key1 updateFund permission
    let updatedFund = glamClient.getFundModel({
      acls: [{ pubkey: key1.publicKey, permissions: [{ fundUpdate: {} }] }],
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

    // key1 now has updateFund permission
    // use key1 to grant key2 WSolWrap and WSolUnwrap permissions
    updatedFund = glamClient.getFundModel({
      acls: [
        {
          pubkey: key2.publicKey,
          permissions: [{ wSolWrap: {} }, { wSolUnwrap: {} }],
        },
      ],
    });

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
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.acls?.length).toEqual(2);
    expect(fundModel.acls[1].pubkey).toEqual(key2.publicKey);
  });

  it("Update fund unauthorized", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      await glamClient.program.methods
        .update(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: key2.publicKey,
        })
        .signers([key2])
        .rpc();
    } catch (e) {
      expect(e.error.errorMessage).toEqual(
        "Signer not authorized to perform this action"
      );
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
    console.log(updatedFund);
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
