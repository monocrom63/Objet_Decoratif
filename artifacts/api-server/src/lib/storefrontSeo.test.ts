import assert from "node:assert/strict";
import test from "node:test";
import {
  absoluteMediaUrl,
  productMetaDescription,
  productPageUrl,
  renderProductSeoHtml,
  renderSitemapXml,
  type SeoProduct,
} from "./storefrontSeo.ts";

const product: SeoProduct = {
  id: "barrique",
  name: "Barrique",
  collection: "Barrique",
  category: "Candle",
  description: "Compact, soft and perfectly balanced",
  explanation:
    "A compact concrete form with a soft silhouette, designed to be refilled.",
  priceCents: 6800,
  imagePaths: ["/images/products/barrique-01.webp", "/uploads/wax.mp4"],
  updatedAt: new Date("2026-10-01T12:00:00.000Z"),
};

test("product URLs use a stable, encoded product id", () => {
  assert.equal(
    productPageUrl("barrique"),
    "https://objet-decoratif-storefront.replit.app/produkte/barrique",
  );
  assert.ok(productPageUrl("form name").endsWith("/form%20name"));
});

test("product metadata descriptions are unique source data and stay within search length", () => {
  const description = productMetaDescription(product);
  assert.match(description, /Barrique/);
  assert.match(description, /concrete form/);
  assert.ok(description.length <= 160);
});

test("product page sends absolute image URLs and price/availability schema in the raw HTML", () => {
  const html = renderProductSeoHtml(product, [], '<script src="/app.js"></script>');
  assert.match(html, /<h1 id="od-product-title">Barrique<\/h1>/);
  assert.match(html, /property="og:type" content="product"/);
  assert.match(html, /https:\/\/objet-decoratif-storefront\.replit\.app\/images\/products\/barrique-01\.webp/);
  assert.match(html, /"priceCurrency":"EUR","price":"68\.00","availability":"https:\/\/schema\.org\/InStock"/);
  assert.match(html, /Prices include VAT; shipping extra/);
  assert.match(html, /href="\/shipping-policy">Shipping costs &amp; delivery/);
  assert.match(html, /Delivery time: 3–5 working days/);
  const structuredData = html.match(
    /<script id="product-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1];
  assert.ok(structuredData);
  assert.doesNotMatch(structuredData, /uploads\/wax\.mp4/);
});

test("managed object image paths use the public storage URL", () => {
  assert.equal(
    absoluteMediaUrl("/objects/uploads/product.webp"),
    "https://objet-decoratif-storefront.replit.app/api/storage/objects/uploads/product.webp",
  );
});

test("sitemap XML escapes URLs and preserves last modified dates", () => {
  const xml = renderSitemapXml([
    {
      url: "https://objet-decoratif-storefront.replit.app/produkte/barrique?a=1&b=2",
      lastModified: "2026-10-01T12:00:00.000Z",
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]);
  assert.match(xml, /\/produkte\/barrique\?a=1&amp;b=2/);
  assert.match(xml, /<lastmod>2026-10-01<\/lastmod>/);
  assert.match(xml, /<priority>0\.8<\/priority>/);
});
