import { validatePubkey, validateBN } from "./validation";

/*
 * Marinade
 */

export const marinadeDelayedUnstakeTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);
  const amount = validateBN(req.body.amount);

  if (fund === undefined || manager === undefined || amount === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.marinade.delayedUnstakeTx(fund, manager, amount);

  return await serializeTx(tx, manager, client, res);
};

export const marinadeDelayedUnstakeClaimTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (fund === undefined || manager === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.marinade.delayedUnstakeClaimTx(fund, manager);

  return await serializeTx(tx, manager, client, res);
};

/*
 * wSOL
 */

export const wsolWrapTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);
  const amount = validateBN(req.body.amount);

  if (fund === undefined || manager === undefined || amount === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.wsol.wrapTx(fund, manager, amount);

  return await serializeTx(tx, manager, client, res);
};

export const wsolUnwrapTx = async (client, req, res) => {
  const fund = validatePubkey(req.body.fund);
  const manager = validatePubkey(req.body.manager);

  if (fund === undefined || manager === undefined) {
    return res.sendStatus(400);
  }

  const tx = await client.wsol.unwrapTx(fund, manager);

  return await serializeTx(tx, manager, client, res);
};

/*
 * Common
 */

const serializeTx = async (tx, manager, client, res) => {
  tx.feePayer = manager;

  let serializedTx = "";
  try {
    tx.recentBlockhash = (
      await client.provider.connection.getLatestBlockhash()
    ).blockhash;

    serializedTx = tx
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false
      })
      .toString("hex");
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
  return res.send(
    JSON.stringify({
      tx: serializedTx
    }) + "\n"
  );
};
