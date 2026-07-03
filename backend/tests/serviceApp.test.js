import test from "node:test";
import assert from "node:assert/strict";
import { createServiceApp } from "../shared/http/serviceApp.js";

const request = async (app, path, options) => {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test("createServiceApp excludes health checks from the service rate limiter", async () => {
  let limiterCalls = 0;
  const rateLimiter = (_req, res, _next) => {
    limiterCalls += 1;
    res.status(429).json({ success: false, message: "limited" });
  };

  const app = createServiceApp({
    serviceName: "test-service",
    rateLimiter,
    routes: [{ path: "/login", handlers: [(_req, res) => res.json({ success: true })] }],
  });

  const healthResponse = await request(app, "/health");
  const healthBody = await healthResponse.json();

  assert.equal(healthResponse.status, 200);
  assert.equal(healthBody.data.service, "test-service");
  assert.equal(limiterCalls, 0);

  const loginResponse = await request(app, "/login", { method: "POST" });

  assert.equal(loginResponse.status, 429);
  assert.equal(limiterCalls, 1);
});
