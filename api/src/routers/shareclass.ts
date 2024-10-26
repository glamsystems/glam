import { Router } from "express";
import { validatePubkey } from "../validation";
import { getTokenMetadata } from "@solana/spl-token";

const router = Router();

/**
 * Redirect to the rest service
 */
router.get("/metadata/:pubkey", async (req, res) => {
  const pubkey = validatePubkey(req.params.pubkey);
  if (!pubkey) {
    return res.sendStatus(404);
  }

  const targetUrl = `https://rest.glam.systems/metadata/${pubkey}`;
  res.redirect(targetUrl);
  return;
});

export default router;
