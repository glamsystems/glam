import { Router } from "express";
import { validatePubkey } from "../validation";
import { getTokenMetadata } from "@solana/spl-token";

const router = Router();

/**
 * Fetch share class metadata
 *
 * :pubkey - share class (aka token mint) pubkey
 */
router.get("/metadata/:pubkey", async (req, res) => {
  const pubkey = validatePubkey(req.params.pubkey);
  if (!pubkey) {
    return res.sendStatus(404);
  }

  const metadata = await getTokenMetadata(
    req.client.provider.connection,
    pubkey
  );

  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      name: metadata.name,
      symbol: metadata.symbol,
      description: "",
      image: `https://api.glam.systems/image/${pubkey}.png`,
    })
  );
});

export default router;
