import { Router } from "express";
import { validatePubkey } from "../validation";

const router = Router();

router.get("/metadata/:pubkey", async (req, res) => {
  const pubkey = validatePubkey(req.params.pubkey);
  if (!pubkey) {
    return res.sendStatus(404);
  }

  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      name: "GLAM Managed SOL",
      symbol: "gmSOL",
      description: "GLAM Managed SOL is a managed fund that invests in SOL",
      image: `https://api.glam.systems/image/${pubkey}.png`,
    })
  );
});

export default router;
