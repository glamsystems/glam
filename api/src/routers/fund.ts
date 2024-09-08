import { Router } from "express";
import { validatePubkey } from "../validation";
import { priceHistory, fundPerformance } from "../prices";
import { Connection } from "@solana/web3.js";
import { getTokenMetadata } from "@solana/spl-token";
import {
  PythHttpClient,
  PythCluster,
  getPythClusterApiUrl,
  getPythProgramKeyForCluster,
} from "@pythnetwork/client";

const router = Router();

router.get("/prices", async (req, res) => {
  const PYTHNET_CLUSTER_NAME: PythCluster = "pythnet";
  const pythClient = new PythHttpClient(
    new Connection(getPythClusterApiUrl(PYTHNET_CLUSTER_NAME)),
    getPythProgramKeyForCluster(PYTHNET_CLUSTER_NAME),
    "confirmed"
  );
  const data = await pythClient.getData();
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      btc: data.productPrice.get("Crypto.BTC/USD").price,
      eth: data.productPrice.get("Crypto.ETH/USD").price,
      sol: data.productPrice.get("Crypto.SOL/USD").price,
      usdc: data.productPrice.get("Crypto.USDC/USD").price,
    })
  );
});

/**
 * Fetch all glam funds
 */
router.get("/funds", async (req, res) => {
  const glamFunds = await req.client.listFunds();
  const subject = validatePubkey(req.query.subject);

  res.set("content-type", "application/json");

  // If no pubkey is provided, return all funds
  if (!subject) {
    res.send(
      JSON.stringify(
        glamFunds.map((fund) => {
          return {
            fund,
            treasury: req.client.getTreasuryPDA(fund),
          };
        })
      )
    );
    return;
  }

  // A subject pubkey is provided, only return funds the subject is granted access to
  const fundAccounts = await Promise.all(
    glamFunds.map(async (k, i) => {
      return {
        fundPubkey: glamFunds[i],
        fundAccount: await req.client.fetchFundAccount(k),
      };
    })
  );

  const fundsBySubject = await Promise.all(
    fundAccounts.map(async ({ fundPubkey, fundAccount }) => {
      const treasury = req.client.getTreasuryPDA(fundPubkey);
      const balance = await req.client.provider.connection.getBalance(treasury);
      const tokenAccounts = await req.client.listTokenAccounts(treasury);

      const createResponse = (role: string, permissions = []) => ({
        fund: fundPubkey,
        name: fundAccount.name,
        imageKey: fundAccount.shareClasses[0] || fundPubkey,
        treasury: {
          address: treasury,
          balanceLamports: balance,
          tokenAccounts,
        },
        role,
        permissions,
      });

      // Check if the subject is the manager
      if (fundAccount.manager.equals(subject)) {
        return createResponse("manager");
      }

      // Check if the subject is a delegate
      const vecDelegateAcl = fundAccount.params[0].find(
        (param) => param.name.delegateAcls !== undefined
      )?.value.vecDelegateAcl.val;

      if (vecDelegateAcl?.some((acl) => acl.pubkey.equals(subject))) {
        const permissions = vecDelegateAcl[0].permissions.map(
          (obj) => Object.keys(obj)[0]
        );
        return createResponse("delegate", permissions);
      }

      return undefined;
    })
  );

  // Filter out undefined values
  res.send(JSON.stringify(fundsBySubject.filter(Boolean)));
});

router.get("/funds/:pubkey/perf", async (req, res) => {
  const { w_btc = 0.4, w_eth = 0, w_sol = 0.6 } = req.query;
  // TODO: validate input
  // TODO: Should we fetch weights from blockchain, or let client side pass them in?
  // Client side should have all fund info including assets and weights
  console.log(`btcWeight: ${w_btc}, ethWeight: ${w_eth}, solWeight: ${w_sol}`);
  const { timestamps, closingPrices: ethClosingPrices } = await priceHistory(
    "Crypto.ETH/USD"
  );
  const { closingPrices: btcClosingPrices } = await priceHistory(
    "Crypto.BTC/USD"
  );
  const { closingPrices: solClosingPrices } = await priceHistory(
    "Crypto.SOL/USD"
  );
  // const { closingPrices: usdcClosingPrices } = await priceHistory(
  //   "Crypto.USDC/USD"
  // );
  const { weightedChanges, btcChanges, ethChanges, solChanges } =
    fundPerformance(
      w_btc,
      btcClosingPrices,
      w_eth,
      ethClosingPrices,
      w_sol,
      solClosingPrices
    );
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      timestamps,
      // usdcClosingPrices,
      fundPerformance: weightedChanges,
      btcPerformance: btcChanges,
      ethPerformance: ethChanges,
      solPerformance: solChanges,
    })
  );
});

router.get("/funds/:pubkey/tickets", async (req, res) => {
  const fund = validatePubkey(req.params.pubkey);
  const tickets = await req.client.marinade.getTickets(fund);
  res.set("content-type", "application/json");
  res.send({ tickets });
});

router.get("/funds/:pubkey/stakes", async (req, res) => {
  const fund = validatePubkey(req.params.pubkey);
  const treasury = req.client.getTreasuryPDA(fund);
  const stakes = await req.client.staking.getStakeAccountsWithStates(treasury);
  res.set("content-type", "application/json");
  res.send({ stakes });
});

router.get("/funds/:pubkey/metadata", async (req, res) => {
  const pubkey = validatePubkey(req.params.pubkey);
  if (!pubkey) {
    return res.sendStatus(404);
  }

  let metadata;
  try {
    // If a fund account pubkey is provided we read metadata of the 1st share class of the fund
    const fund = await req.client.program.account.fundAccount.fetch(pubkey);
    metadata = await getTokenMetadata(
      req.client.provider.connection,
      fund.shareClasses[0]
    );
  } catch (error) {
    // If a share class pubkey is provided we read its metadata
    if (error.message.includes("Invalid account discriminator")) {
      metadata = await getTokenMetadata(req.client.provider.connection, pubkey);
    } else {
      throw error;
    }
  }

  const { image_uri } = Object.fromEntries(metadata!.additionalMetadata);

  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      name: metadata.name,
      symbol: metadata.symbol,
      description: "",
      external_url: "https://glam.systems",
      image: image_uri,
    })
  );
});

export default router;
