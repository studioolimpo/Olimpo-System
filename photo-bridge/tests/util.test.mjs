import test from "node:test";
import assert from "node:assert/strict";
import { isDriveId, isFigmaKey, isFigmaNode, normalizeFile, safeEqual, validateJobRequest, encodeBase64Url } from "../worker/util.mjs";

test("rejects invalid locations and file keys", () => {
  assert.equal(isDriveId("../secrets"), false);
  assert.equal(isDriveId("ABCDEFGHIJKLMNOPQRST"), true);
  assert.equal(isFigmaKey("ABCDEFGHIJKLMNOPQRSTUV"), true);
  assert.equal(isFigmaNode("1234:5678"), true);
  assert.equal(isFigmaNode("1234-5678"), false);
  assert.throws(() => validateJobRequest({ project:"x", folderId:"INVALID" }));
});
test("handles JPEG and rejects oversized or unknown assets", () => {
  const ok = normalizeFile({id:"ABCDEFGHIJKLMNOPQRST",name:"test-photo.jpg",mimeType:"image/jpeg",size:"29526526",md5Checksum:"abc"},"");
  assert.equal(ok.size, 29526526);
  assert.equal(ok.name, "test-photo.jpg");
  assert.equal(normalizeFile({...ok,size:"400000000"}),null);
  assert.equal(normalizeFile({...ok,mimeType:"application/zip"}),null);
});
test("compares credentials and makes URL-safe tokens", () => {
  assert.equal(safeEqual("abc","abc"),true);
  assert.equal(safeEqual("abc","abd"),false);
  assert.equal(safeEqual("abc","abc0"),false);
  assert.equal(encodeBase64Url(new Uint8Array([255,255])), "__8");
});
