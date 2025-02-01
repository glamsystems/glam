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
  let statePda: PublicKey, vaultPda: PublicKey;

  it("Initialize glam state", async () => {
    const shareClassAllowlist = [key1.publicKey];
    const shareClassBlocklist = [key2.publicKey];

    const stateForTest = { ...stateModelForTest };
    stateForTest.mints![0].allowlist = shareClassAllowlist;
    stateForTest.mints![0].blocklist = shareClassBlocklist;

    const res = await createGlamStateForTest(glamClient, stateForTest);
    statePda = res.statePda;
    vaultPda = res.vaultPda;

    const stateModel = await glamClient.fetchState(statePda);

    expect(stateModel.mints?.length).toEqual(1);
    expect(stateModel.mints![0].allowlist).toEqual(shareClassAllowlist);
    expect(stateModel.mints![0].blocklist).toEqual(shareClassBlocklist);
  });

  it("Update name in state", async () => {
    const name = "Updated name in state";
    try {
      const txSig = await glamClient.state.updateState(statePda, { name });
      console.log("Update name txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    const state = await glamClient.fetchStateAccount(statePda);
    expect(state.name).toEqual(name);
  });

  it("Update share class allowlist", async () => {
    const shareClassModel = new ShareClassModel({
      allowlist: [key1.publicKey, key2.publicKey],
      blocklist: [],
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
    expect(stateModel.mints![0].allowlist).toEqual(shareClassModel.allowlist);
    expect(stateModel.mints![0].blocklist).toEqual(shareClassModel.blocklist);
  });

  it("Update assets allowlist", async () => {
    // The test glam state has 2 assets, WSOL and MSOL. Update to USDC.
    try {
      const txSig = await glamClient.state.updateState(statePda, {
        assets: [USDC],
      });
      console.log("Update assets (USDC) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.assets).toEqual([USDC]);

    // Update assets back to WSOL and MSOL
    try {
      const txSig = await glamClient.state.updateState(statePda, {
        assets: [WSOL, MSOL],
      });
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
    expect(stateModel.integrations?.length).toEqual(0);

    // 1 integration
    try {
      const txSig = await glamClient.state.updateState(statePda, {
        integrations: [{ drift: {} }],
      });
      console.log("Update integrations (drift) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.integrations?.length).toEqual(1);
    expect(stateModel.integrations).toEqual([{ drift: {} }]);

    // 5 acls
    const updated = {
      integrations: [
        { drift: {} },
        { jupiterSwap: {} },
        { marinade: {} },
        { splStakePool: {} },
        { sanctumStakePool: {} },
      ],
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updated);
      console.log(
        "Update integrations (drift, jupiterSwap, marinade, splStakePool, sanctumStakePool) txSig",
        txSig,
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.integrations).toEqual(updated.integrations);
  });

  it("[delegate-acl] upsert", async () => {
    // empty delegate acls
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(0);

    // grant key1 wSolWrap permission, no expiration
    const delegateAcls = [
      {
        pubkey: key1.publicKey,
        permissions: [{ wSolWrap: {} }],
        expiresAt: new BN(0),
      },
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
    expect(stateModel.delegateAcls![0].pubkey).toEqual(key1.publicKey);
    expect(stateModel.delegateAcls![0].permissions).toEqual([{ wSolWrap: {} }]);
    expect(stateModel.delegateAcls![0].expiresAt).toEqual(new BN(0));

    // grant key1 wSolWrap and wSolUnwrap permission
    const expiresAt = new BN(Date.now() / 1000 + 60);
    try {
      const txSig = await glamClient.state.upsertDelegateAcls(statePda, [
        {
          pubkey: key1.publicKey,
          permissions: [{ wSolWrap: {} }, { wSolUnwrap: {} }],
          expiresAt,
        },
      ]);
      console.log("Update delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(1);
    expect(stateModel.delegateAcls![0].pubkey).toEqual(key1.publicKey);
    expect(stateModel.delegateAcls![0].permissions).toEqual([
      { wSolWrap: {} },
      { wSolUnwrap: {} },
    ]);
    expect(stateModel.delegateAcls![0].expiresAt).toEqual(expiresAt);
  });

  it("[delegate-acl] delete", async () => {
    // add key2 permissions
    const delegateAcls = [
      {
        pubkey: key2.publicKey,
        permissions: [{ stake: {} }],
        expiresAt: new BN(0),
      },
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
    // transfer 1 SOL to vault
    // transfer 0.1 SOL to key1 as it needs to pay for vault wsol ata creation
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
    let updated = {
      delegateAcls: [
        {
          pubkey: key1.publicKey,
          permissions: [{ wSolWrap: {} }],
          expiresAt: new BN(0),
        },
      ],
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updated);
      console.log("Update delegate acl txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stateAccount = await glamClient.fetchStateAccount(statePda);
    console.log("StateAccount", stateAccount);

    let stateModel = await glamClient.fetchState(statePda);
    console.log("StateModel", stateModel);
    expect(stateModel.delegateAcls?.length).toEqual(1);
    expect(stateModel.delegateAcls![0].pubkey).toEqual(key1.publicKey);

    // key1 now has wSolWrap permission, use key1 to wrap some SOL
    await glamClientCustomWallet.wsol.wrap(statePda, new BN(30_000_000));

    // key1 doesn't have wSolUnwrap permission, unwrap should fail
    try {
      const txId = await glamClientCustomWallet.wsol.unwrap(statePda);
      console.log("Unwrap:", txId);
      expect(txId).toBeUndefined();
    } catch (e) {
      expect((e as GlamError).message).toEqual("Signer is not authorized.");
    }
  }, 15_000);

  it("[drift-market-allowlists] upsert", async () => {
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.driftMarketIndexesPerp).toBeNull();

    try {
      const txSig = await glamClient.state.updateState(statePda, {
        driftMarketIndexesPerp: [0, 1],
        driftMarketIndexesSpot: [2, 3, 4],
        driftOrderTypes: [5, 6],
      });
      console.log("Update driftMarketIndexesPerp txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.driftMarketIndexesPerp).toEqual([0, 1]);
    expect(stateModel.driftMarketIndexesSpot).toEqual([2, 3, 4]);
    expect(stateModel.driftOrderTypes).toEqual([5, 6]);
  }, 15_000);

  it("[ownership] Update state unauthorized", async () => {
    try {
      const txSig = await glamClientCustomWallet.state.updateState(statePda, {
        name: "Updated state name",
      });
      expect(txSig).toBeUndefined();
    } catch (e) {
      expect((e as GlamError).message).toEqual("Signer is not authorized.");
    }
  }, 15_000);

  it("[ownership] Update owner", async () => {
    const updated = {
      owner: {
        portfolioManagerName: "New Owner",
        pubkey: key1.publicKey,
        kind: { wallet: {} },
      },
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updated);
      console.log("Owner updated from default to new", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState.owner).toEqual(key1.publicKey);

    // previous owner CAN NOT update
    try {
      const txSig = await glamClient.state.updateState(statePda, {
        name: "Updated state name",
      });
      expect(txSig).toBeUndefined();
    } catch (e) {
      expect((e as GlamError).message).toEqual("Signer is not authorized.");
    }

    // new manager CAN update back
    try {
      const txId = await glamClientCustomWallet.state.updateState(statePda, {
        owner: {
          portfolioManagerName: "Default Owner",
          pubkey: glamClient.getSigner(),
          kind: { wallet: {} },
        },
      });
      console.log("Owner updated from new to default", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState.owner).toEqual(glamClient.getSigner());
  });

  it("Close token accounts", async () => {
    // Create empty token accounts
    const transaction = new Transaction();
    for (const mint of [WSOL, MSOL]) {
      transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
          glamClient.getSigner(),
          glamClient.getVaultAta(statePda, mint),
          vaultPda,
          mint,
        ),
      );
    }
    const txSig = await glamClient.sendAndConfirm(transaction);
    console.log("Created wSOL and mSOL ATAs for vault:", txSig);

    let tokenAccounts = await glamClient.getTokenAccountsByOwner(vaultPda);
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
    tokenAccounts = await glamClient.getTokenAccountsByOwner(vaultPda);
    expect(tokenAccounts.length).toEqual(0);
  });

  it("Close state account", async () => {
    const glamState = await glamClient.fetchStateAccount(statePda);
    expect(glamState).not.toBeNull();

    try {
      const txSig = await glamClient.state.closeState(statePda);
      expect(txSig).toBeUndefined();
    } catch (e) {
      expect(e.message).toContain(
        "Glam state account can't be closed. Close share classes first",
      );
    }

    try {
      const txSig = await glamClient.shareClass.closeShareClass(statePda);
      console.log("Close share class txId:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txSig = await glamClient.state.closeState(statePda);
      console.log("Close state account txId:", txSig);
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
});
