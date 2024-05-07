/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express, { Express, Request, Response } from "express";
import * as path from "path";

const app: Express = express();

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/api", (req: Request, res: Response) => {
  res.send({ message: "Welcome to api!" });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);

export default server;
