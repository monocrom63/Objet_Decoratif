import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { translate, german } from "./translations.ts";
import { CONTACT_EMAIL } from "./store-config.ts";

test("DE changes shop and checkout copy; EN retains the exact original headline", () => {
  assert.equal(translate("Products", "DE"), "Produkte");
  assert.equal(translate("Shop collection", "DE"), "Unsere Kollektion");
  assert.equal(translate("Place order as guest", "DE"), "Als Gast bestellen");
  assert.equal(translate("With a Glow", "EN"), "With a Glow");
  assert.equal(translate("Products", "EN"), "Products");
});

test("German price disclosures include VAT, shipping, and the existing delivery estimate", () => {
  assert.equal(translate("Prices include VAT; shipping extra", "DE"), "inkl. MwSt., zzgl. Versand");
  assert.equal(translate("Shipping costs & delivery", "DE"), "Versandkosten & Lieferzeit");
  assert.equal(translate("Delivery time: 3–5 working days", "DE"), "Lieferzeit: 3–5 Werktage");
});

test("manual-payment checkout uses the German payment-obligation button", () => {
  assert.equal(
    translate("Place order with payment obligation", "DE"),
    "Zahlungspflichtig bestellen",
  );
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.match(app, /paymentMethod:\s*"manual"/);
  assert.match(app, /t\("Place order with payment obligation"\)/);
  assert.ok(!app.includes('autoComplete="cc-number"'));
});

test("inline spacing survives translation", () => {
  assert.equal(translate("Choose ", "DE"), "Auswählen: ");
  assert.equal(translate(" and your account", "DE"), " und dein Konto");
  assert.equal(translate("Your order ", "DE"), "Deine Bestellung ");
});

test("brand names, user content and canonical order values stay unchanged", () => {
  for (const name of ["Objet Décoratif", "Barrique", "Thé", "Santal Cruz"]) {
    assert.equal(translate(name, "DE"), name);
  }
  const canonicalVariant = "Big / Santal Cruz";
  assert.equal(translate(canonicalVariant, "DE"), "Groß / Santal Cruz");
  assert.equal(canonicalVariant, "Big / Santal Cruz");
  assert.equal(translate(canonicalVariant, "EN"), canonicalVariant);
  assert.equal(translate("New customer-written copy", "DE"), "New customer-written copy");
});

test("all supplied scent descriptions and notes have German translations", () => {
  for (const key of [
    "Bergamot / Mate tea / Green tea / Clove",
    "Rose, lavandin and tea leaves open into patchouli, cedarwood and woody amber.",
    "Cardamom / Frankincense / Sandalwood",
    "Myrtle, jasmine and white florals rest on sandalwood, amber and vanilla.",
    "Passion fruit / Citrus / Pepper / Clove",
    "Passion fruit and citrus brighten a heart of pepper and clove, grounded by guaiac wood and cedar.",
    "Ginger / Gurjum / Alaskan cedar",
    "Iris root, violet blossom and vanilla lead into Atlas cedar and Virginia cedar.",
  ]) {
    assert.ok(german[key]);
    assert.notEqual(translate(key, "DE"), key);
  }
});

test("country labels are localized without changing submitted country values", () => {
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.match(app, /<option value="Germany">\{t\("Germany"\)\}<\/option>/);
  assert.match(app, /<option value="Small">\{t\("Small \(190g\)"\)\}<\/option>/);
  assert.equal(translate("Germany", "DE"), "Deutschland");
});

test("the public contact address is centralized and used by the contact mailto", () => {
  assert.equal(CONTACT_EMAIL, "info@objetdecorativ.art");
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.ok(!app.includes("info@objetdecoratif.de"));
  assert.ok(app.includes("mailto:${CONTACT_EMAIL}?subject="));
  const policy = readFileSync(new URL("../policy-content.ts", import.meta.url), "utf8");
  assert.ok(policy.includes('html.replaceAll("info@objetdecoratif.de", CONTACT_EMAIL)'));
});
