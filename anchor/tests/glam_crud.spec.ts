import { Keypair } from "@solana/web3.js";

import { createFundForTest, fundTestExample } from "./setup";
import { GlamClient } from "../src";

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

  it("Update fund name", async () => {
    const newName = "Updated fund name";
    const updatedFund = glamClient.getFundModel({
      name: newName,
    });

    await glamClient.program.methods
      .update(updatedFund)
      .accounts({
        fund: fundPDA,
        manager: glamClient.getManager(),
      })
      .rpc();
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(newName);
  });

  it("Update fund to assign new manager", async () => {
    const newManager = Keypair.generate();
    let updatedFund = glamClient.getFundModel({
      managers: [glamClient.getManager(), newManager.publicKey],
    });

    await glamClient.program.methods
      .update(updatedFund)
      .accounts({
        fund: fundPDA,
        manager: glamClient.getManager(),
      })
      .rpc();

    // New manager should be able to update fund info
    const newName = "Updated fund name by new manager";
    updatedFund = glamClient.getFundModel({
      name: newName,
    });

    await glamClient.program.methods
      .update(updatedFund)
      .accounts({
        fund: fundPDA,
        manager: newManager.publicKey,
      })
      .signers([newManager])
      .rpc();
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(newName);
  });

  /*
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
          manager,
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

    try {
      const txId = await glamClient.program.methods
        .update(updatedFund2)
        .accounts({
          fund: fundPDA,
          manager,
        })
        .rpc();
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("not authorized");
    }

    try {
      const txId = await glamClient.program.methods
        .update(updatedFund2)
        .accounts({
          fund: fundPDA,
          manager: newManager.publicKey,
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
  */

  /*
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
          manager: glamClient.getManager()
        })
        .rpc();
    } catch (err) {
      console.error(err);
      throw err;
    }

    // The account should no longer exist, returning null.
    const closedAccount =
      await glamClient.program.account.fundAccount.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });
  */
});
