import { Router } from "express";
import { validatePubkey, validateBN } from "../validation";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

/*
 * Marinade
 */

const marinadeStakeTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);
  const amount = validateBN(req.body.amount);

  if (!fund || !manager || !amount) {
    return res.sendStatus(400);
  }

  const tx = await client.marinade.stakeTx(fund, manager, amount);

  return await serializeTx(tx, manager, client, res);
};

const marinadeDelayedUnstakeTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);
  const amount = validateBN(req.body.amount);

  if (fund === undefined || manager === undefined || amount === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.marinade.delayedUnstakeTx(fund, manager, amount);

  return await serializeTx(tx, manager, client, res);
};

const marinadeDelayedUnstakeClaimTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (fund === undefined || manager === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.marinade.delayedUnstakeClaimTx(fund, manager);

  return await serializeTx(tx, manager, client, res);
};

/*
 * Common
 */

const serializeTx = async (tx: Transaction, manager, client, res) => {
  tx.feePayer = manager;

  try {
    tx.recentBlockhash = (
      await client.provider.connection.getLatestBlockhash()
    ).blockhash;
    const serializedTx = Buffer.from(
      tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      })
    ).toString("base64");
    return res.send({ tx: serializedTx, versioned: false });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
};

const serializeVersionedTx = async (tx: VersionedTransaction, res) => {
  try {
    const serializedTx = Buffer.from(tx.serialize()).toString("base64");
    return res.send({
      tx: serializedTx,
      versioned: true
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
};

/*
 * Tx
 */

const router = Router();

router.post("/tx/jupiter/swap", async (req, res) => {
  res.set("content-type", "application/json");
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (!fund || !manager) {
    return res.status(400).send({ error: "Invalid fund or manager" });
  }

  const { quoteParams, quoteResponse } = req.body;

  if (!quoteParams && !quoteResponse) {
    return res.status(400).send({
      error: "quoteParams or quoteResponse must be provided"
    });
  }

  try {
    const tx = await req.client.jupiter.swapTx(
      fund,
      manager,
      quoteParams,
      quoteResponse,
      req.body.swapInstructions
    );
    return serializeVersionedTx(tx, res);
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
});

router.post("/tx/marinade/stake", async (req, res) => {
  res.set("content-type", "application/json");
  return marinadeStakeTx(req.client, req, res);
});

router.post("/tx/marinade/unstake", async (req, res) => {
  res.set("content-type", "application/json");
  return marinadeDelayedUnstakeTx(req.client, req, res);
});

router.post("/tx/marinade/unstake/claim", async (req, res) => {
  res.set("content-type", "application/json");
  return marinadeDelayedUnstakeClaimTx(req.client, req, res);
});

router.post("/tx/wsol/wrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);
  const amount = validateBN(req.body.amount);

  console.log(fund, manager, amount);

  if (!fund || !manager || !amount) {
    return res.sendStatus(400);
  }

  res.set("content-type", "application/json");
  const tx = await req.client.wsol.wrapTx(fund, manager, amount);

  return await serializeTx(tx, manager, req.client, res);
});

router.post("/tx/wsol/unwrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (!fund || !manager) {
    return res.sendStatus(400);
  }

  res.set("content-type", "application/json");
  const tx = await req.client.wsol.unwrapTx(fund, manager);

  return await serializeTx(tx, manager, req.client, res);
});

export default router;
