import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createFundForTest, testFundModel, str2seed } from "./setup";
import { FundModel, GlamClient, MSOL, USDC, WSOL } from "../src";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

const key1 = Keypair.fromSeed(str2seed("acl_test_key1"));
const key2 = Keypair.fromSeed(str2seed("acl_test_key2"));

describe("glam_vault", () => {
  const glamClient = new GlamClient();
  const glamClientCustomWallet = new GlamClient({ wallet: new Wallet(key1) });
  let fundPDA: PublicKey;

  it("Initialize vault", async () => {
    let fundForTest = { ...testFundModel };
    fundForTest.shareClasses = [];
    const fundData = await createFundForTest(glamClient, fundForTest);

    fundPDA = fundData.fundPDA;

    let fund;
    try {
      fund = await glamClient.fetchFund(fundPDA);
    } catch (e) {
      console.error(e);
      throw e;
    }
    expect(fund.shareClasses.length).toEqual(0);
  });

  it("Update vault name", async () => {
    const updated = { name: "Updated vault name" };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updated);
      console.log("Update vault name txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fundAccount = await glamClient.fetchFundAccount(fundPDA);
    expect(fundAccount.name).toEqual(updated.name);
  });

  it("Update vault asset allowlist", async () => {
    // The test fund has 2 assets, WSOL and MSOL. Update to USDC.
    let updatedFund = { assets: [USDC] };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update vault assets (USDC) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = (await glamClient.fetchFund(fundPDA)) as FundModel;
    expect(fundModel.assets).toEqual([USDC]);

    // Update assets back to WSOL and MSOL
    updatedFund = { assets: [WSOL, MSOL] };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund);
      console.log("Update vault assets (WSOL and MSOL) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = (await glamClient.fetchFund(fundPDA)) as FundModel;
    expect(fundModel.assets).toEqual([WSOL, MSOL]);
  });

  it("[integration-acl] add and update", async () => {
    const updatedFund1 = {
      integrationAcls: [{ name: { drift: {} }, features: [] }],
    };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund1);
      console.log("Update integration acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const fundModel1 = await glamClient.fetchFund(fundPDA);
    expect(fundModel1.integrationAcls.length).toEqual(1);
    expect(fundModel1.integrationAcls).toEqual(updatedFund1?.integrationAcls);

    const updatedFund2 = {
      integrationAcls: [
        { name: { drift: {} }, features: [] },
        { name: { jupiterSwap: {} }, features: [] },
        { name: { marinade: {} }, features: [] },
        { name: { splStakePool: {} }, features: [] },
        { name: { sanctumStakePool: {} }, features: [] },
      ],
    };
    try {
      const txSig = await glamClient.fund.updateFund(fundPDA, updatedFund2);
      console.log("Update integration acl txSig", txSig);
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
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getSigner(),
        toPubkey: glamClient.getVaultPda(fundPDA),
        lamports: 1_000_000_000,
      }),
    );
    await glamClient.sendAndConfirm(tranferTx);

    // transfer 0.1 SOL to key1 as it needs to pay for treasury wsol ata creation
    const tranferTx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getSigner(),
        toPubkey: key1.publicKey,
        lamports: 100_000_000,
      }),
    );
    await glamClient.sendAndConfirm(tranferTx2);

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
      const expectedError = e.programLogs.some((log) =>
        log.includes("Signer is not authorized"),
      );
      expect(expectedError).toBeTruthy();
    }
  }, 15_000);

  it("Update fund unauthorized", async () => {
    const updatedFund = { name: "Updated fund name" };
    try {
      const txId = await glamClient.program.methods
        .updateFund(new FundModel(updatedFund))
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
    const manager = glamClient.getSigner();
    const newManager = Keypair.generate();
    console.log("New manager:", newManager.publicKey);

    const updatedFund = {
      manager: {
        portfolioManagerName: "New Manager",
        pubkey: newManager.publicKey,
        kind: { wallet: {} },
      },
    };
    try {
      await glamClient.fund.updateFund(fundPDA, updatedFund);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fund = await glamClient.fetchFundAccount(fundPDA);
    expect(fund.manager.toString()).toEqual(newManager.publicKey.toString());

    const updatedFund2 = new FundModel({
      manager: {
        portfolioManagerName: "Old Manager",
        pubkey: manager,
        kind: { wallet: {} },
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

  it("Deposit and withdraw", async () => {
    const connection = glamClient.provider.connection;
    const commitment = "confirmed";
    const manager = glamClient.getWallet();

    const mintKeypair = Keypair.fromSeed(str2seed("usdc"));
    const mint = mintKeypair.publicKey;

    const amount = 100_000_000;

    await createMint(
      connection,
      manager.payer,
      manager.publicKey,
      null,
      6,
      mintKeypair,
      { commitment },
      TOKEN_PROGRAM_ID,
    );

    const managerAta = await createAssociatedTokenAccount(
      connection,
      manager.payer,
      mint,
      manager.publicKey,
      {},
      TOKEN_PROGRAM_ID,
    );

    await mintTo(
      connection,
      manager.payer,
      mint,
      managerAta,
      manager.payer,
      amount * 10,
      [],
      { commitment },
      TOKEN_PROGRAM_ID,
    );

    // Create empty token accounts
    try {
      const txSig = await glamClient.fund.deposit(fundPDA, mint, amount);
      console.log("Deposit:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    let tokenAccount = await getAccount(
      connection,
      managerAta,
      undefined,
      TOKEN_PROGRAM_ID,
    );
    expect(tokenAccount.amount.toString()).toEqual((amount * 9).toString());

    // Transfer out
    try {
      const txSig = await glamClient.fund.withdraw(fundPDA, mint, amount);
      console.log("Withdraw:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    tokenAccount = await getAccount(
      connection,
      managerAta,
      undefined,
      TOKEN_PROGRAM_ID,
    );
    expect(tokenAccount.amount.toString()).toEqual((amount * 10).toString());
  });

  it("Close vault", async () => {
    const fund =
      await glamClient.program.account.fundAccount.fetchNullable(fundPDA);
    expect(fund).not.toBeNull();

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
