import { Router } from "express";
import { validatePubkey, validateBN } from "../validation";

/*
 * Marinade
 */

const jupiterSwapTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (fund === undefined || manager === undefined) {
    return res.sendStatus(400);
  }

  let tx;
  try {
    tx = await client.jupiter.swapTx(
      fund,
      manager,
      req.body.quote,
      req.body.quoteResponse,
      req.body.swapInstruction
    );
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
  return await serializeTx(tx, manager, client, res);
};

/*
 * Marinade
 */

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

const serializeTx = async (tx, manager, client, res) => {
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
    ).toString("hex");
    return res.send({ tx: serializedTx });
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
  return jupiterSwapTx(req.client, req, res);
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
