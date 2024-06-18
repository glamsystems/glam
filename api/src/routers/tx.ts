import { Router } from "express";
import { validatePubkey, validateBN } from "../validation";
import { VersionedTransaction } from "@solana/web3.js";

const router = Router();
router.use((req, res, next) => {
  const signer = validatePubkey(req.body.signer || req.body.manager);

  if (!signer) {
    return res.status(400).send({ error: "Invalid signer" });
  }

  const microLamports = req.body.microLamports;
  const jitoTipLamports = req.body.jitoTipLamports;

  req.apiOptions = {
    signer,
    microLamports,
    jitoTipLamports,
  };

  next();
});

/*
 * wSOL
 */

router.post("/tx/wsol/wrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const tx = await req.client.wsol.wrapTx(fund, amount, req.apiOptions);
  return await serializeTx(tx, res);
});

router.post("/tx/wsol/unwrap", async (req, res) => {
  const fund = validatePubkey(req.body.fund);

  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  const tx = await req.client.wsol.unwrapTx(fund, req.apiOptions);
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

  try {
    const tx = await req.client.jupiter.swapTx(
      fund,
      quoteParams,
      quoteResponse,
      req.body.swapInstructions,
      req.apiOptions
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

  const tx = await req.client.marinade.stakeTx(fund, amount, req.apiOptions);
  return await serializeTx(tx, res);
});

router.post("/tx/marinade/unstake", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const tx = await req.client.marinade.delayedUnstakeTx(
    fund,
    amount,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

router.post("/tx/marinade/unstake/claim", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const ticket = validatePubkey(req.body.ticket);

  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  if (!ticket) {
    return res.status(400).send({ error: "Invalid ticket" });
  }

  const tx = await req.client.marinade.delayedUnstakeClaimTx(
    fund,
    ticket,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

/*
 * Common
 */

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
