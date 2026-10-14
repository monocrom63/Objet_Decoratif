import assert from "node:assert/strict";
import test from "node:test";
import { scentShowcaseSource } from "./scent-media.ts";

test("a separate landscape file wins without changing the portrait file", () => {
  const scent = { image: "/objects/portrait.mp4", showcaseMedia: "/objects/landscape.webm" };
  assert.equal(scentShowcaseSource(scent), "/objects/landscape.webm");
  assert.equal(scent.image, "/objects/portrait.mp4");
});

test("portrait videos are never automatically reused in the Scents section", () => {
  for (const image of ["/objects/portrait.mp4", "/objects/portrait.webm?version=2"]) {
    assert.equal(scentShowcaseSource({ image }), undefined);
  }
});

test("legacy still images remain visible and removing landscape video restores only a still", () => {
  assert.equal(scentShowcaseSource({ image: "/images/tea.jpg" }), "/images/tea.jpg");
  assert.equal(scentShowcaseSource({}), undefined);
});
