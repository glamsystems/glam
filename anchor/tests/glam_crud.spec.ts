import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import { createGlamStateForTest, stateModelForTest, str2seed } from "./setup";
import {
  StateModel,
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
  let statePda: PublicKey;

  it("Initialize glam state", async () => {
    const shareClassAllowlist = [glamClient.getSigner()];
    const shareClassBlocklist = [];

    const stateForTest = { ...stateModelForTest };
    stateForTest.mints![0].allowlist = shareClassAllowlist;

    const stateData = await createGlamStateForTest(glamClient, stateForTest);
    statePda = stateData.statePda;

    const stateModel = await glamClient.fetchState(statePda);

    console.log("stateModel", stateModel);

    expect(stateModel.mints?.length).toEqual(1);
    expect(stateModel.mints![0].allowlist).toEqual(shareClassAllowlist);
    expect(stateModel.mints![0].blocklist).toEqual(shareClassBlocklist);
  });

  /*
  it("Update name in state", async () => {
    const updatedState = {
      name: "Updated name in state",
    } as Partial<StateModel>;
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update name txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const state = await glamClient.fetchStateAccount(statePda);
    expect(state.name).toEqual(updatedState.name);
  });

  it("Update share class allowlist", async () => {
    const shareClassModel = new ShareClassModel({
      allowlist: [key1.publicKey, key2.publicKey],
    });
    try {
      const txSig = await glamClient.program.methods
        .updateShareClass(0, shareClassModel)
        .accounts({
          state: statePda,
          shareClassMint: glamClient.getShareClassPda(statePda, 0),
        })
        .rpc();
      console.log("Update share class txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.mints[0].allowlist).toEqual(shareClassModel.allowlist);
  });

  it("Update assets allowlist", async () => {
    // The test glam state has 2 assets, WSOL and MSOL. Update to USDC.
    let updatedState = { assets: [USDC] };
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update assets (USDC) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.assets).toEqual([USDC]);

    // Update assets back to WSOL and MSOL
    updatedState = { assets: [WSOL, MSOL] };
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update assets (WSOL and MSOL) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = (await glamClient.fetchState(statePda)) as StateModel;
    expect(stateModel.assets).toEqual([WSOL, MSOL]);
  });

  it("[integration-acl] add and update", async () => {
    // 0 by default
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.integrationAcls.length).toEqual(0);

    // 1 acl
    let updatedState = {
      integrationAcls: [{ name: { drift: {} }, features: [] }],
    } as Partial<StateModel>;
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update integration acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.integrationAcls.length).toEqual(1);
    expect(stateModel.integrationAcls).toEqual(updatedState.integrationAcls);

    // 5 acls
    updatedState = {
      integrationAcls: [
        { name: { drift: {} }, features: [] },
        { name: { jupiterSwap: {} }, features: [] },
        { name: { marinade: {} }, features: [] },
        { name: { splStakePool: {} }, features: [] },
        { name: { sanctumStakePool: {} }, features: [] },
      ],
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update integration acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.integrationAcls.length).toEqual(5);
    expect(stateModel.integrationAcls).toEqual(updatedState.integrationAcls);
  });

  it("[delegate-acl] upsert", async () => {
    // empty acls
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls.length).toEqual(0);

    // grant key1 wSolWrap permission
    const delegateAcls = [
      { pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] },
    ];
    try {
      const txSig = await glamClient.state.upsertDelegateAcls(
        statePda,
        delegateAcls,
      );
      console.log("Update delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(1);
    expect(stateModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);
    expect(stateModel.delegateAcls[0].permissions).toEqual([{ wSolWrap: {} }]);

    // grant key1 wSolWrap and wSolUnwrap permission
    try {
      const txSig = await glamClient.state.upsertDelegateAcls(statePda, [
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
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(1);
    expect(stateModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);
    expect(stateModel.delegateAcls[0].permissions).toEqual([
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
      const txSig = await glamClient.state.upsertDelegateAcls(
        statePda,
        delegateAcls,
      );
      console.log("Update delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(2);
    expect(stateModel.delegateAcls[1].pubkey).toEqual(key2.publicKey);
    expect(stateModel.delegateAcls[1].permissions).toEqual([{ stake: {} }]);

    // remove key1 and key2 permissions
    try {
      const txSig = await glamClient.state.deleteDelegateAcls(statePda, [
        key1.publicKey,
        key2.publicKey,
      ]);
      console.log("Delete delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(0);
  });

  it("[delegate-acl] test authorization", async () => {
    // transfer 1 SOL to treasury
    // transfer 0.1 SOL to key1 as it needs to pay for treasury wsol ata creation
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getSigner(),
        toPubkey: glamClient.getVaultPda(statePda),
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
    let updatedState = {
      delegateAcls: [
        { pubkey: key1.publicKey, permissions: [{ wSolWrap: {} }] },
      ],
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updatedState);
      console.log("Update delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let StateModel = await glamClient.fetchState(statePda);
    expect(StateModel.delegateAcls?.length).toEqual(1);
    expect(StateModel.delegateAcls[0].pubkey).toEqual(key1.publicKey);

    // key1 now has wSolWrap permission, use key1 to wrap some SOL
    try {
      const tx = await glamClientCustomWallet.wsol.wrap(
        statePda,
        new BN(30_000_000),
      );
      console.log("Wrap:", tx);
    } catch (e) {
      console.log("Error", e);
      throw e;
    }

    // key1 doesn't have wSolUnwrap permission, unwrap should fail
    try {
      const txId = await glamClientCustomWallet.wsol.unwrap(statePda);
      console.log("Unwrap:", txId);
      expect(txId).toBeUndefined();
    } catch (e) {
      expect((e as GlamError).message).toEqual("Signer is not authorized.");
    }
  }, 15_000);

  it("Update state unauthorized", async () => {
    const updatedState = new StateModel({ name: "Updated state name" });
    try {
      const txId = await glamClient.program.methods
        .updateState(updatedState)
        .accounts({
          state: statePda,
          signer: key1.publicKey,
        })
        .signers([key1])
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.error.errorMessage).toEqual("Signer is not authorized");
    }
  });

  it("Update owner", async () => {
    const defaultOwner = glamClient.getSigner();
    const newOwner = Keypair.fromSeed(str2seed("new-owner"));

    const updatedState = new StateModel({
      owner: {
        portfolioManagerName: "New Owner",
        pubkey: newOwner.publicKey,
        kind: { wallet: {} },
      },
    });
    try {
      const txId = await glamClient.program.methods
        .updateState(updatedState)
        .accounts({
          state: statePda,
          signer: defaultOwner,
        })
        .rpc();

      console.log("Owner updated from default to new", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState.owner.toString()).toEqual(newOwner.publicKey.toString());

    const updatedState2 = new StateModel({
      owner: {
        portfolioManagerName: "Default Manager",
        pubkey: defaultOwner,
        kind: { wallet: {} },
      },
    });

    // default manager can NOT update back
    try {
      const txId = await glamClient.program.methods
        .updateState(updatedState2)
        .accounts({
          state: statePda,
          signer: defaultOwner,
        })
        .rpc();
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain("not authorized");
    }

    // new manager CAN update back
    try {
      const txId = await glamClient.program.methods
        .updateState(updatedState2)
        .accounts({
          state: statePda,
          signer: newOwner.publicKey,
        })
        .signers([newOwner])
        .rpc();
      console.log("Owner updated from new to default", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState.owner).toEqual(defaultOwner);
  });

  it("Close token accounts", async () => {
    const treasury = glamClient.getVaultPda(statePda);

    // Create empty token accounts
    const transaction = new Transaction();
    for (const mint of [WSOL, MSOL]) {
      transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
          glamClient.getSigner(),
          glamClient.getVaultAta(statePda, mint),
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
      const txSig = await glamClient.state.closeTokenAccounts(
        statePda,
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

  it("Close state account", async () => {
    const glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState).not.toBeNull();

    try {
      const txId = await glamClient.state.closeState(statePda);
      expect(txId).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain(
        "Glam state account can't be closed. Close share classes first",
      );
    }

    try {
      const txId = await glamClient.shareClass.closeShareClass(statePda);
      console.log("Close share class txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.state.closeState(statePda);
      console.log("Close state account txId:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // The following accounts should no longer exist
    const vault = glamClient.getVaultPda(statePda);
    const openfunds = glamClient.getOpenfundsPda(statePda);
    const ret = await Promise.all(
      [statePda, vault, openfunds].map(
        async (address) =>
          await glamClient.provider.connection.getAccountInfo(address),
      ),
    );
    expect(ret).toEqual([null, null, null]);
  });
  */
});
