import { Router } from "express";
import { validatePubkey, validateBN } from "../validation";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

const router = Router();

/*
 * wSOL
 */

router.post("/tx/wsol/wrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const apiOptions = commonApiOptions(req, res);
  const tx = await req.client.wsol.wrapTx(fund, amount, apiOptions);

  return await serializeTx(tx, res);
});

router.post("/tx/wsol/unwrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);

  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  const apiOptions = commonApiOptions(req, res);
  const tx = await req.client.wsol.unwrapTx(fund, apiOptions);

  return await serializeTx(tx, res);
});

/*
 * Jupiter
 */

router.post("/tx/jupiter/swap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  const { quoteParams, quoteResponse } = req.body;

  if (!quoteParams && !quoteResponse) {
    return res.status(400).send({
      error: "quoteParams or quoteResponse must be provided",
    });
  }

  const apiOptions = commonApiOptions(req, res);
  try {
    const tx = await req.client.jupiter.swapTx(
      fund,
      quoteParams,
      quoteResponse,
      req.body.swapInstructions,
      apiOptions
    );
    return serializeTx(tx, res);
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
});

/*
 * Marinade
 */

router.post("/tx/marinade/stake", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const apiOptions = commonApiOptions(req, res);
  const tx = await req.client.marinade.stakeTx(fund, amount, apiOptions);

  return await serializeTx(tx, res);
});

router.post("/tx/marinade/unstake", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const apiOptions = commonApiOptions(req, res);
  const tx = await req.client.marinade.delayedUnstakeTx(
    fund,
    amount,
    apiOptions
  );

  return await serializeTx(tx, res);
});

router.post("/tx/marinade/unstake/claim", async (req, res) => {
  const fund = validatePubkey(req.body.fund);

  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  const apiOptions = commonApiOptions(req, res);
  const tx = await req.client.marinade.delayedUnstakeClaimTx(fund, apiOptions);

  return await serializeTx(tx, res);
});

/*
 * Common
 */

const commonApiOptions = (req, res) => {
  const signer = validatePubkey(req.body.signer || req.body.manager);

  //TODO: add test
  if (!signer) {
    return res.status(400).send({ error: "Invalid signer" });
  }

  const microLamports = req.body.microLamports;
  const jitoTipLamports = req.body.jitoTipLamports;

  return {
    signer,
    microLamports,
    jitoTipLamports,
  };
};

const serializeTx = async (tx: VersionedTransaction, res) => {
  try {
    const serializedTx = Buffer.from(tx.serialize()).toString("base64");
    res.set("content-type", "application/json");
    return res.send({
      tx: serializedTx,
      versioned: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
};

export default router;
