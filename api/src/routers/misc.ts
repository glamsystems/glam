import { Router, Request, Response } from "express";

const router = Router();

router.get("/_/genesis", async (req: Request, res: Response) => {
  const genesis = await req.client.provider.connection.getGenesisHash();
  res.send({ genesis });
});

router.get("/_/version", async (req: Request, res: Response) => {
  res.send({
    gae_version: process.env.GAE_VERSION,
    git_sha: process.env.GIT_SHA
  });
});

export default router;
