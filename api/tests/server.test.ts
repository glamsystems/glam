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
    expect(res.body).toEqual({ message: "Welcome to api!" });
  });
});
