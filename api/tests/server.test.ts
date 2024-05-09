import server from "../src/main.js";
import supertest from "supertest";
const requestWithSupertest = supertest(server);

describe("Test /api", () => {
  afterAll(() => {
    server.close();
  });

  it("test", async () => {
    const res = await requestWithSupertest.get("/api");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({ message: "Welcome to Glam!" });
  });
});

describe("Test /metadata/:pubkey", () => {
  afterAll(() => {
    server.close();
  });

  it("Invalid pubkey", async () => {
    const res = await requestWithSupertest.get("/metadata/xyz");
    expect(res.status).toEqual(404);
  });
});

describe("Test /fund/:pubkey/perf", () => {
  afterAll(() => {
    server.close();
  });

  it("Expected response", async () => {
    const res = await requestWithSupertest.get("/fund/xyz/perf");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      timestamps: expect.any(Array),
      fundPerformance: expect.any(Array),
      // usdcClosingPrices: expect.any(Array),
      btcPerformance: expect.any(Array),
      ethPerformance: expect.any(Array),
      solPerformance: expect.any(Array)
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
      usdc: expect.any(Number)
    });
  });
});
