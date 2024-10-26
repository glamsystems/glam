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
