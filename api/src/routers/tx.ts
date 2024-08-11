import { Router } from "express";
import { validatePubkey, validateBN } from "../validation";
import { VersionedTransaction } from "@solana/web3.js";

const router = Router();
router.use((req, res, next) => {
  if (req.path.startsWith("/tx")) {
    const signer = validatePubkey(req.body.signer || req.body.manager);

    if (!signer) {
      return res.status(400).send({ error: "Invalid signer" });
    }

    const computeUnitLimit = req.body.computeUnitLimit;
    const computeUnitPriceMicroLamports =
      req.body.computeUnitPriceMicroLamports || req.body.microLamports;
    const jitoTipLamports = req.body.jitoTipLamports;

    req.apiOptions = {
      signer,
      computeUnitLimit,
      computeUnitPriceMicroLamports,
      jitoTipLamports,
    };
  }

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

router.post("/tx/marinade/deposit_sol", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const amount = validateBN(req.body.amount);

  if (!fund || !amount) {
    return res.status(400).send({ error: "Invalid fund or amount" });
  }

  const tx = await req.client.marinade.depositSolTx(
    fund,
    amount,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

router.post("/tx/marinade/delayed_unstake", async (req, res) => {
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

router.post("/tx/marinade/claim_tickets", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  if (!fund) {
    return res.status(400).send({ error: "Invalid fund" });
  }

  const tickets = req.body.tickets;
  if (!Array.isArray(tickets)) {
    return res.status(400).send({ error: "Invalid tickets" });
  }

  const validatedTickets = tickets.map((ticket) => {
    const validTicket = validatePubkey(ticket);
    if (!validTicket) {
      return res.status(400).send({ error: `Invalid ticket: ${ticket}` });
    }
    return validTicket;
  });

  const tx = await req.client.marinade.claimTicketsTx(
    fund,
    validatedTickets,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

/*
 * Stake pools
 */
router.post("/tx/stakepool/deposit_sol", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const stakePool = validatePubkey(req.body.stake_pool);
  const amount = validateBN(req.body.amount);

  if (!fund || !stakePool || !amount) {
    return res
      .status(400)
      .send({ error: "Invalid input of fund, stakePool, or amount" });
  }

  const tx = await req.client.staking.stakePoolDepositSolTx(
    fund,
    stakePool,
    amount,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

router.post("/tx/stakepool/withdraw_stake", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const stakePool = validatePubkey(req.body.stake_pool);
  const amount = validateBN(req.body.amount);

  if (!fund || !stakePool || !amount) {
    return res
      .status(400)
      .send({ error: "Invalid input of fund, stakePool, or amount" });
  }

  const tx = await req.client.staking.stakePoolWithdrawStakeTx(
    fund,
    stakePool,
    amount,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

/*
 * Stake program (aka native staking)
 */

router.post("/tx/stake/delegate", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const vote = validatePubkey(req.body.validator_vote);
  const amount = validateBN(req.body.amount);

  if (!fund || !vote || !amount) {
    return res
      .status(400)
      .send({ error: "Invalid input of fund, stakePool, or amount" });
  }

  const tx = await req.client.staking.initializeAndDelegateStakeTx(
    fund,
    vote,
    amount,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

router.post("/tx/stake/deactivate", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const stake_accounts = req.body.stake_accounts;
  if (!Array.isArray(stake_accounts)) {
    return res
      .status(400)
      .send({ error: "Invalid stake_accounts, must be an array" });
  }
  if (!fund || !stake_accounts) {
    return res
      .status(400)
      .send({ error: "Invalid input of fund or stake_accounts" });
  }

  const validatedStakeAccounts = stake_accounts.map((stake_account) => {
    const validStakeAccount = validatePubkey(stake_account);
    if (!validStakeAccount) {
      return res
        .status(400)
        .send({ error: `Invalid stake account: ${validStakeAccount}` });
    }
    return validStakeAccount;
  });

  const tx = await req.client.staking.deactivateStakeAccountsTx(
    fund,
    validatedStakeAccounts,
    req.apiOptions
  );
  return await serializeTx(tx, res);
});

router.post("/tx/stake/withdraw", async (req, res) => {
  const fund = validatePubkey(req.body.fund);
  const stake_accounts = req.body.stake_accounts;
  if (!Array.isArray(stake_accounts)) {
    return res
      .status(400)
      .send({ error: "Invalid stake_accounts, must be an array" });
  }
  if (!fund || !stake_accounts) {
    return res
      .status(400)
      .send({ error: "Invalid input of fund or stake_accounts" });
  }

  const validatedStakeAccounts = stake_accounts.map((stake_account) => {
    const validStakeAccount = validatePubkey(stake_account);
    if (!validStakeAccount) {
      return res
        .status(400)
        .send({ error: `Invalid stake account: ${validStakeAccount}` });
    }
    return validStakeAccount;
  });

  const tx = await req.client.staking.withdrawFromStakeAccountsTx(
    fund,
    validatedStakeAccounts,
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
