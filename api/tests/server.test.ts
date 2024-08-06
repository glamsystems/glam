import server from "../src/main.js";
import supertest from "supertest";
const requestWithSupertest = supertest(server);

describe("Test /_/version", () => {
  afterAll(() => {
    server.close();
  });

  it("test", async () => {
    const res = await requestWithSupertest.get("/_/version");
    expect(res.status).toEqual(200);
  });
});

describe("Test /image/:pubkey.:ext", () => {
  afterAll(() => {
    server.close();
  });

  it("Invalid pubkey", async () => {
    const res = await requestWithSupertest.get("/image/xyz.png");
    expect(res.status).toEqual(400);
  });

  it("Invalid ext", async () => {
    const res = await requestWithSupertest.get(
      "/image/11111111111111111111111111111111.jpg"
    );
    expect(res.status).toEqual(400);
  });

  it("Success", async () => {
    const res = await requestWithSupertest.get(
      "/image/11111111111111111111111111111111.svg"
    );
    expect(res.status).toEqual(200);
    expect(res.header["content-type"]).toContain("image/svg+xml");
  });
});

describe("Test /metadata/:pubkey", () => {
  afterAll(() => {
    server.close();
  });

  it("Invalid pubkey", async () => {
    const res = await requestWithSupertest.get("/funds/xyz/metadata");
    expect(res.status).toEqual(404);
  });
});

describe("Test /funds/:pubkey/perf", () => {
  afterAll(() => {
    server.close();
  });

  it("Expected response", async () => {
    const res = await requestWithSupertest.get("/funds/xyz/perf");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      timestamps: expect.any(Array),
      fundPerformance: expect.any(Array),
      // usdcClosingPrices: expect.any(Array),
      btcPerformance: expect.any(Array),
      ethPerformance: expect.any(Array),
      solPerformance: expect.any(Array),
    });
  });
});

describe("Test /prices", () => {
  afterAll(() => {
    server.close();
  });

  it("Expected response", async () => {
    const res = await requestWithSupertest.get("/prices");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      btc: expect.any(Number),
      eth: expect.any(Number),
      sol: expect.any(Number),
      usdc: expect.any(Number),
    });
  });
});

describe("Test /tx/jupiter/swap", () => {
  afterAll(() => {
    server.close();
  });

  it("Invalid signer params", async () => {
    const res = await requestWithSupertest.post("/tx/jupiter/swap").send({
      fund: "xyz",
      signer: "abc",
    });
    expect(res.status).toEqual(400);
    expect(res.body).toEqual({ error: "Invalid signer" });
  });

  it("Invalid fund params", async () => {
    const res = await requestWithSupertest.post("/tx/jupiter/swap").send({
      fund: "xyz",
      signer: "11111111111111111111111111111111",
    });
    expect(res.status).toEqual(400);
    expect(res.body).toEqual({ error: "Invalid fund" });
  });

  it("Invalid swap params", async () => {
    const res = await requestWithSupertest.post("/tx/jupiter/swap").send({
      fund: "11111111111111111111111111111111",
      signer: "11111111111111111111111111111111",
    });
    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      error: "quoteParams or quoteResponse must be provided",
    });
  });
});
