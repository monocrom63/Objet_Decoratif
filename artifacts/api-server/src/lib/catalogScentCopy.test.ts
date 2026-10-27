import assert from "node:assert/strict";
import { test } from "node:test";
import { CreateScentBody, UpdateScentBody } from "@workspace/api-zod";

test("scent API accepts and preserves German notes and descriptions", () => {
  const notesDe = "\nBergamotte / Kräuter / Holz \n";
  const descriptionDe = "Erste Zeile.\nZweite Zeile.";
  const create = CreateScentBody.parse({
    id: "new-scent",
    name: "New scent",
    notes: "Bergamot / herbs / wood",
    notesDe,
    description: "A balanced fragrance.",
    descriptionDe,
  });

  assert.equal(create.notesDe, notesDe);
  assert.equal(create.descriptionDe, descriptionDe);

  const update = UpdateScentBody.parse({ notesDe, descriptionDe });
  assert.equal(update.notesDe, notesDe);
  assert.equal(update.descriptionDe, descriptionDe);
});
