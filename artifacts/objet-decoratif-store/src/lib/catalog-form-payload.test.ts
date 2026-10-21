import assert from "node:assert/strict";
import test from "node:test";

import { omitUnchangedMediaFields } from "./catalog-form-payload.ts";

test("text-only product edits omit unchanged uploaded image paths", () => {
  const product = {
    name: "Barrique",
    imagePaths: ["/objects/uploads/product-photo"],
  };

  assert.deepEqual(omitUnchangedMediaFields(product, ["imagePaths"]), {
    name: "Barrique",
  });
  assert.deepEqual(omitUnchangedMediaFields(product, []), product);
});

test("scent edits omit untouched media but preserve explicit removals or replacements", () => {
  const scent = {
    name: "Thé",
    imagePath: "/objects/uploads/portrait",
    showcaseMediaPath: "/objects/uploads/landscape",
  };

  assert.deepEqual(
    omitUnchangedMediaFields(scent, ["imagePath", "showcaseMediaPath"]),
    { name: "Thé" },
  );
  assert.deepEqual(
    omitUnchangedMediaFields(
      { ...scent, imagePath: null },
      ["showcaseMediaPath"],
    ),
    { name: "Thé", imagePath: null },
  );
});
