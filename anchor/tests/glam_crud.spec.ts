import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, testFundModel, str2seed } from "./setup";
import {
  FundModel,
  GlamClient,
  GlamError,
  MSOL,
  ShareClassModel,
  USDC,
  WSOL,
} from "../src";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_crud", () => {
  const glamClient = new GlamClient();
  const glamClientCustomWallet = new GlamClient({ wallet: new Wallet(key1) });
  let fundPDA: PublicKey;

  it("Initialize fund", async () => {
    const shareClassAllowlist = [glamClient.getSigner()];
    const shareClassBlocklist = [];

    const fundForTest = { ...testFundModel };
    fundForTest.shareClasses![0].allowlist = shareClassAllowlist;

    const fundData = await createFundForTest(glamClient, fundForTest);
    fundPDA = fundData.fundPDA;

    const fundModel = await glamClient.fetchFund(fundPDA);

    expect(fundModel.shareClasses.length).toEqual(1);
    expect(fundModel.shareClasses[0].allowlist).toEqual(shareClassAllowlist);
    expect(fundModel.shareClasses[0].blocklist).toEqual(shareClassBlocklist);
  });

  it("Update fund name", async () => {
    const updatedFund = { name: "Updated fund name" } as Partial<FundModel>;
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update fund name txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fund = await glamClient.fetchFundAccount(fundPDA);
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
    const fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.shareClasses[0].allowlist).toEqual(
      shareClassModel.allowlist,
    );
  });

  it("Update fund asset allowlist", async () => {
    // The test fund has 2 assets, WSOL and MSOL. Update to USDC.
    let updatedFund = { assets: [USDC] };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update fund assets (USDC) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.assets).toEqual([USDC]);

    // Update assets back to WSOL and MSOL
    updatedFund = { assets: [WSOL, MSOL] };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update fund assets (WSOL and MSOL) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = (await glamClient.fetchFund(fundPDA)) as FundModel;
    expect(fundModel.assets).toEqual([WSOL, MSOL]);
  });

  it("[integration-acl] add and update", async () => {
    // 0 by default
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.integrationAcls.length).toEqual(0);

    // 1 acl
    let updatedFund = {
      integrationAcls: [{ name: { drift: {} }, features: [] }],
    } as Partial<FundModel>;
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update integration acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.integrationAcls.length).toEqual(1);
    expect(fundModel.integrationAcls).toEqual(updatedFund.integrationAcls);

    // 5 acls
    updatedFund = {
      integrationAcls: [
        { name: { drift: {} }, features: [] },
        { name: { jupiterSwap: {} }, features: [] },
        { name: { marinade: {} }, features: [] },
        { name: { splStakePool: {} }, features: [] },
        { name: { sanctumStakePool: {} }, features: [] },
      ],
    };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update integration acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.integrationAcls.length).toEqual(5);
    expect(fundModel.integrationAcls).toEqual(updatedFund.integrationAcls);
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
      const txSig = await glamClient.fund.upsertDelegateAcls(
        fundPDA,
        delegateAcls,
      );
      console.log("Update delegate acl txSig", txSig);
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
      const txSig = await glamClient.fund.upsertDelegateAcls(fundPDA, [
        {
          pubkey: key1.publicKey,
          permissions: [{ wSolWrap: {} }, { wSolUnwrap: {} }],
        },
      ]);
      console.log("Update delegate acl txSig", txSig);
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
      const txSig = await glamClient.fund.upsertDelegateAcls(
        fundPDA,
        delegateAcls,
      );
      console.log("Update delegate acl txSig", txSig);
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
      const txSig = await glamClient.fund.deleteDelegateAcls(fundPDA, [
        key1.publicKey,
        key2.publicKey,
      ]);
      console.log("Delete delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls?.length).toEqual(0);
  });

  it("[delegate-acl] test authorization", async () => {
    // transfer 1 SOL to treasury
    // transfer 0.1 SOL to key1 as it needs to pay for treasury wsol ata creation
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getSigner(),
        toPubkey: glamClient.getVaultPda(fundPDA),
        lamports: 1_000_000_000,
      }),
      SystemProgram.transfer({
        fromPubkey: glamClient.getSigner(),
        toPubkey: key1.publicKey,
        lamports: 100_000_000,
      }),
    );
    await glamClient.sendAndConfirm(tranferTx);

    // grant key1 wSolWrap permission
    let updatedFund = {
      delegateAcls: [
        { pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] },
      ],
    };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update delegate acl txSig", txSig);
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
        new BN(30_000_000),
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
      expect((e as GlamError).message).toEqual("Signer is not authorized.");
    }
  }, 15_000);

  it("Update fund unauthorized", async () => {
    const updatedFund = new FundModel({ name: "Updated fund name" });
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
    const defaultManager = glamClient.getSigner();
    const newManager = Keypair.fromSeed(str2seed("new-manager"));

    const updatedFund = new FundModel({
      manager: {
        portfolioManagerName: "New Manager",
        pubkey: newManager.publicKey,
        kind: { wallet: {} },
      },
    });
    try {
      const txId = await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({
          fund: fundPDA,
          signer: defaultManager,
        })
        .rpc();

      console.log("Fund manager updated from default to new", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.manager.toString()).toEqual(newManager.publicKey.toString());

    const updatedFund2 = new FundModel({
      manager: {
        portfolioManagerName: "Default Manager",
        pubkey: defaultManager,
        kind: { wallet: {} },
      },
    });

    // default manager can NOT update back
    try {
      const txId = await glamClient.program.methods
        .updateFund(updatedFund2)
        .accounts({
          fund: fundPDA,
          signer: defaultManager,
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
      console.log("Fund manager updated from new to default", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.manager).toEqual(defaultManager);
  });

  it("Close token accounts", async () => {
    const treasury = glamClient.getVaultPda(fundPDA);

    // Create empty token accounts
    const transaction = new Transaction();
    for (const mint of [WSOL, MSOL]) {
      transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
          glamClient.getSigner(),
          glamClient.getVaultAta(fundPDA, mint),
          treasury,
          mint,
        ),
      );
    }
    const txSig = await glamClient.sendAndConfirm(transaction);
    console.log("Creating ata for treasury:", txSig);

    let tokenAccounts = await glamClient.getTokenAccountsByOwner(treasury);
    expect(tokenAccounts.length).toEqual(2);

    // Close token accounts
    try {
      const txSig = await glamClient.fund.closeTokenAccounts(
        fundPDA,
        tokenAccounts.map((ta) => ta.pubkey),
      );
      console.log("Close token accounts:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    tokenAccounts = await glamClient.getTokenAccountsByOwner(treasury);
    expect(tokenAccounts.length).toEqual(0);
  });

  it("Close fund", async () => {
    const fund =
      await glamClient.program.account.fundAccount.fetchNullable(fundPDA);
    expect(fund).not.toBeNull();

    try {
      const txId = await glamClient.fund.closeFund(fundPDA);
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain(
        "Fund can't be closed. Close share classes first",
      );
    }

    try {
      const txId = await glamClient.shareClass.closeShareClass(fundPDA);
      console.log("Close share class txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.fund.closeFund(fundPDA);
      console.log("Close fund txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // The following accounts should no longer exist
    const treasury = glamClient.getVaultPda(fundPDA);
    const openfunds = glamClient.getOpenfundsPDA(fundPDA);
    const ret = await Promise.all(
      [fundPDA, treasury, openfunds].map(
        async (address) =>
          await glamClient.program.account.fundAccount.fetchNullable(address),
      ),
    );
    expect(ret).toEqual([null, null, null]);
  });
});
