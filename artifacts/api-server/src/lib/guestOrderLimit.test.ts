import { test } from "node:test";
import assert from "node:assert/strict";
import { createGuestOrderLimiter } from "./guestOrderLimit.ts";

test("guest submissions have a case-insensitive email limit that expires", () => {
  let now = 0;
  const allow = createGuestOrderLimiter(() => now);
  for (let i = 0; i < 5; i++) assert.equal(allow("ip", "guest@example.test"), true);
  assert.equal(allow("ip", " GUEST@EXAMPLE.TEST "), false);
  assert.equal(allow("ip", "other@example.test"), true);
  now = 15 * 60 * 1000;
  assert.equal(allow("ip", "guest@example.test"), true);
});

test("rotating email addresses cannot bypass the per-peer limit", () => {
  const allow = createGuestOrderLimiter(() => 0);
  for (let i = 0; i < 100; i++) assert.equal(allow("peer", `${i}@example.test`), true);
  assert.equal(allow("peer", "next@example.test"), false);
  assert.equal(allow("other-peer", "next@example.test"), true);
});
