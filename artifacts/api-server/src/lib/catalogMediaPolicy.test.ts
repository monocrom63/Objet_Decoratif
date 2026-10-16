import assert from "node:assert/strict";
import test from "node:test";
import { UpdateScentBody } from "@workspace/api-zod";
import {
  byteRange,
  catalogUploadExtension,
  isManagedCatalogUpload,
} from "./catalogMediaPolicy.ts";
import { unreferencedManagedImagePaths } from "./catalogImageCleanupPolicy.ts";

test("scent updates accept explicit null values to remove either media field", () => {
  assert.equal(UpdateScentBody.safeParse({ imagePath: null }).success, true);
  assert.equal(
    UpdateScentBody.safeParse({ showcaseMediaPath: null }).success,
    true,
  );
});

test("video formats and limits are explicit; legacy image uploads remain supported", () => {
  assert.equal(catalogUploadExtension("video/mp4", 100 * 1024 * 1024), ".mp4");
  assert.equal(catalogUploadExtension("video/webm", 50), ".webm");
  assert.equal(catalogUploadExtension("image/jpeg", 10 * 1024 * 1024), "");
  for (const [type, size] of [
    ["video/mp4", 100 * 1024 * 1024 + 1],
    ["video/quicktime", 10],
    ["image/png", 10 * 1024 * 1024 + 1],
    ["video/webm", 0],
    ["video/mp4", -1],
    ["text/html", 10],
  ] as const) {
    assert.equal(catalogUploadExtension(type, size), null);
  }
});

test("video paths take part in safe cleanup without accepting arbitrary object paths", () => {
  const video = "/objects/uploads/abc-def.mp4";
  const shared = "/objects/uploads/abc-123.webm";
  assert.equal(isManagedCatalogUpload(video), true);
  assert.equal(isManagedCatalogUpload("/objects/uploads/abc-def"), true);
  for (const path of [
    "/objects/uploads/abc-def.exe",
    "/objects/uploads/../abc-def.mp4",
    "/images/demo.mp4",
  ]) {
    assert.equal(isManagedCatalogUpload(path), false);
  }
  assert.deepEqual(
    unreferencedManagedImagePaths([video, shared], new Set([shared])),
    [video],
  );
});

test("video byte ranges support seeking, suffixes and open-ended ranges", () => {
  assert.deepEqual(byteRange("bytes=0-99", 1000), { start: 0, end: 99 });
  assert.deepEqual(byteRange("bytes=100-", 1000), { start: 100, end: 999 });
  assert.deepEqual(byteRange("bytes=-100", 1000), { start: 900, end: 999 });
  assert.deepEqual(byteRange("bytes=900-2000", 1000), { start: 900, end: 999 });
  for (const header of [
    "bytes=1000-",
    "bytes=20-10",
    "bytes=-0",
    "bytes=-",
    "bytes=0-9,20-29",
    "invalid",
  ]) {
    assert.equal(byteRange(header, 1000), null);
  }
});
