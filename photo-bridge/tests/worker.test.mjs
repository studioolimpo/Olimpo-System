import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.mjs";

const mockEnvironment = () => ({
  JOBS: { get: async () => null, put: async () => {} },
  ADMIN_TOKEN: "A".repeat(40),
  GOOGLE_CLIENT_EMAIL: "photo-test@example.invalid",
  GOOGLE_PRIVATE_KEY: "unused test key",
  ALLOWED_ROOT_IDS: "ABCDEFGHIJKLMNOPQRST"
});

test("health exposes only configuration status and no credentials", async () => {
  const response = await worker.fetch(new Request("https://worker.example/health"), {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "configuration-required");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(JSON.stringify(body).includes("PRIVATE_KEY"), false);
});

test("preflight supports the authenticated image requests", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/jobs", {method:"OPTIONS"}), mockEnvironment());
  assert.equal(response.status, 204);
  assert.match(response.headers.get("Access-Control-Allow-Headers") || "", /X-Job-Token/);
});

test("unauthenticated job creation is rejected before Drive access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/jobs", {
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({project:"Test",folderId:"ABCDEFGHIJKLMNOPQRST",figmaFileKey:"ABCDEFGHIJKLMNOPQRSTUV",figmaPageId:"123:456"})
  }), mockEnvironment());
  assert.equal(response.status, 401);
});

test("malformed job arguments never trigger Google Drive access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/jobs", {
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+"A".repeat(40)},
    body:JSON.stringify({project:"Test",folderId:"../invalid",figmaFileKey:"ABCDEFGHIJKLMNOPQRSTUV",figmaPageId:"123:456"})
  }), mockEnvironment());
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.includes("Dati progetto"), true);
});

test("unknown API routes do not list jobs or secrets", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/secret"), mockEnvironment());
  assert.equal(response.status, 404);
});
