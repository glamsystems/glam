const server = require("../server.js");
const supertest = require("supertest");
const requestWithSupertest = supertest(server);

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

  it("", async () => {
    const res = await requestWithSupertest.get("/fund/xyz/perf");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      timestamps: expect.any(Array),
      fundPerformance: expect.any(Array),
      btcPerformance: expect.any(Array),
      ethPerformance: expect.any(Array)
    });
  });
});
