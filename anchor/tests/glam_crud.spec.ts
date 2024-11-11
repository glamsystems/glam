import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, fundTestExample, str2seed } from "./setup";
import {
  FundModel,
  GlamClient,
  MSOL,
  ShareClassModel,
  USDC,
  WSOL,
} from "../src";
import {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountIdempotent,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

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
    expect(fund.shareClasses[0].shareClassAllowlist).toEqual([
      glamClient.getManager(),
    ]);
    expect(fund.shareClasses[0].shareClassBlocklist).toEqual([]);
  });

  it("Update fund name", async () => {
    const updatedFund = glamClient.getFundModel({ name: "Updated fund name" });
    try {
      const txSig = await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: glamClient.getManager(),
        })
        .rpc();
      console.log("Update fund name txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(updatedFund.name);
  });

  it("Update share class allowlist", async () => {
    const shareClassModel = new ShareClassModel({
      allowlist: [key1.publicKey, key2.publicKey],
    });
    try {
      const txSig = await glamClient.program.methods
        .updateShareClass(0, shareClassModel)
        .accounts({
          fund: fundPDA,
          shareClassMint: glamClient.getShareClassPDA(fundPDA, 0),
        })
        .rpc();
      console.log("Update share class txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    const allowlist = fund.params[1][0].value.vecPubkey.val;
    expect(allowlist.length).toEqual(2);
    expect(allowlist).toEqual(shareClassModel.allowlist);
  });

  it("Update fund asset allowlist", async () => {
    // The test fund has 2 assets, WSOL and MSOL. Update to USDC.
    let updatedFund = glamClient.getFundModel({ assets: [USDC] });
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
    let fundModel = (await glamClient.fetchFund(fundPDA)) as FundModel;
    expect(fundModel.assets).toEqual([USDC]);

    // Update assets back to WSOL and MSOL
    updatedFund = glamClient.getFundModel({ assets: [WSOL, MSOL] });
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
    fundModel = (await glamClient.fetchFund(fundPDA)) as FundModel;
    expect(fundModel.assets).toEqual([WSOL, MSOL]);
  });

  it("[integration-acl] add and update", async () => {
    const updatedFund1 = glamClient.getFundModel({
      integrationAcls: [{ name: { drift: {} }, features: [] }],
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
    expect(fundModel1.integrationAcls.length).toEqual(1);
    expect(fundModel1.integrationAcls).toEqual(updatedFund1?.integrationAcls);

    const updatedFund2 = glamClient.getFundModel({
      integrationAcls: [
        { name: { drift: {} }, features: [] },
        { name: { jupiter: {} }, features: [] },
        { name: { marinade: {} }, features: [] },
        { name: { splStakePool: {} }, features: [] },
        { name: { sanctumStakePool: {} }, features: [] },
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
  });

  it("[delegate-acl] upsert", async () => {
    // empty acls
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls.length).toEqual(0);

    // grant key1 wSolWrap permission
    const delegateAcls = [
      { pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] },
    ];
    try {
      await glamClient.upsertDelegateAcls(fundPDA, delegateAcls);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls?.length).toEqual(1);
    expect(fundModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);
    expect(fundModel.delegateAcls[0].permissions).toEqual([{ wSolWrap: {} }]);

    // grant key1 wSolWrap and wSolUnwrap permission
    try {
      await glamClient.upsertDelegateAcls(fundPDA, [
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
    expect(fundModel.delegateAcls?.length).toEqual(1);
    expect(fundModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);
    expect(fundModel.delegateAcls[0].permissions).toEqual([
      { wSolWrap: {} },
      { wSolUnwrap: {} },
    ]);
  });

  it("[delegate-acl] delete", async () => {
    // add key2 permissions
    const delegateAcls = [
      { pubkey: key2.publicKey, permissions: [{ stake: {} }] },
    ];
    try {
      await glamClient.upsertDelegateAcls(fundPDA, delegateAcls);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls?.length).toEqual(2);
    expect(fundModel.delegateAcls[1].pubkey).toEqual(key2.publicKey);
    expect(fundModel.delegateAcls[1].permissions).toEqual([{ stake: {} }]);

    // remove key1 and key2 permissions
    try {
      await glamClient.deleteDelegateAcls(fundPDA, [
        key1.publicKey,
        key2.publicKey,
      ]);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls?.length).toEqual(0);
  });

  it("[delegate-acl] test authorization", async () => {
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
      delegateAcls: [
        { pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] },
      ],
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
    expect(fundModel.delegateAcls?.length).toEqual(1);
    expect(fundModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);

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
      const expectedError = e.programLogs.some((log) =>
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
      fundManagers: [
        {
          name: "New Manager",
          pubkey: newManager.publicKey,
          // kind: "Wallet"
        },
      ],
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
      fundManagers: [
        {
          name: "Old Manager",
          pubkey: manager,
          // kind: "Wallet"
        },
      ],
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

  it("Close token accounts", async () => {
    const treasury = glamClient.getTreasuryPDA(fundPDA);

    // Create empty token accounts
    const transaction = new Transaction();
    for (const mint of [WSOL, MSOL]) {
      transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
          glamClient.getManager(),
          glamClient.getTreasuryAta(fundPDA, mint),
          treasury,
          mint
        )
      );
    }
    const txSig = await glamClient.sendAndConfirm(transaction);
    console.log("Creating ata for treasury:", txSig);

    let tokenAccounts = await glamClient.listTokenAccounts(treasury);
    expect(tokenAccounts.length).toEqual(2);

    // Close token accounts
    try {
      const txSig = await glamClient.program.methods
        .closeTokenAccounts()
        .accounts({
          fund: fundPDA,
        })
        .remainingAccounts(
          tokenAccounts.map((account) => ({
            pubkey: account.address,
            isSigner: false,
            isWritable: true,
          }))
        )
        .rpc();
      console.log("Close token accounts:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    tokenAccounts = await glamClient.listTokenAccounts(treasury);
    expect(tokenAccounts.length).toEqual(0);
  });

  it("Close fund", async () => {
    const fund = await glamClient.program.account.fundAccount.fetchNullable(
      fundPDA
    );
    expect(fund).not.toBeNull();

    const treasury = glamClient.getTreasuryPDA(fundPDA);
    const openfunds = glamClient.getOpenfundsPDA(fundPDA);
    const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);

    try {
      const txId = await glamClient.program.methods
        .closeFund()
        .accounts({
          fund: fundPDA,
          openfunds,
        })
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain(
        "Fund can't be closed. Close share classes first"
      );
    }

    try {
      const txId = await glamClient.program.methods
        .closeShareClass(0)
        .accounts({
          fund: fundPDA,
          openfunds,
          shareClassMint,
        })
        .rpc();
      console.log("Close share class txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.program.methods
        .closeFund()
        .accounts({
          fund: fundPDA,
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
