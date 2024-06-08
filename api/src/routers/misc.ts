import { Router, Request, Response } from "express";

const router = Router();

router.get("/genesis", async (req: Request, res: Response) => {
  const genesis = await req.client.provider.connection.getGenesisHash();
  res.send({ genesis });
});

router.get("/version", async (req: Request, res: Response) => {
  res.send({ id: process.env.GAE_VERSION });
});

export default router;
