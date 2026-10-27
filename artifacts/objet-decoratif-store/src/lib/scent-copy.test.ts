import assert from "node:assert/strict";
import { test } from "node:test";
import {
  localizedScentDescription,
  localizedScentNotes,
} from "./scent-copy.ts";

const translate = (text: string) => `translated:${text}`;
const scent = {
  id: "the",
  name: "Thé",
  notes: "Bergamot / Mate tea / Green tea / Clove",
  notesDe: "Bergamotte / Mate-Tee / Grüner Tee / Nelke",
  description:
    "Rose, lavandin and tea leaves open into patchouli, cedarwood and woody amber.",
  descriptionDe:
    "Rose, Lavandin und Teeblätter entfalten sich zu Patchouli, Zedernholz und warmem Amber.",
};

test("uses saved German scent notes and description verbatim", () => {
  assert.equal(localizedScentNotes(scent, "de-DE", translate), scent.notesDe);
  assert.equal(
    localizedScentDescription(scent, "DE", translate),
    scent.descriptionDe,
  );
});

test("does not trim or translate administrator-entered German scent copy", () => {
  const exactNotes = "\nZitrus · Kräuter / Holz \n";
  assert.equal(
    localizedScentNotes({ ...scent, notesDe: exactNotes }, "DE", translate),
    exactNotes,
  );
});

test("falls back to existing translation only when German scent copy is blank", () => {
  assert.equal(
    localizedScentDescription(
      { ...scent, descriptionDe: "  " },
      "DE",
      translate,
    ),
    `translated:${scent.description}`,
  );
});

test("keeps the English source copy in the English shop", () => {
  assert.equal(
    localizedScentNotes(scent, "en-GB", translate),
    `translated:${scent.notes}`,
  );
});
