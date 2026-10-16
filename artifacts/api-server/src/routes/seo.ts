import { readFile } from "node:fs/promises";
import { Router, type IRouter } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, productsTable, scentsTable } from "@workspace/db";
import {
  productPageUrl,
  renderProductSeoHtml,
  renderSitemapXml,
  storeOrigin,
} from "../lib/storefrontSeo";

const router: IRouter = Router();

const productionFrontendIndex = new URL(
  "../../objet-decoratif-store/dist/public/index.html",
  import.meta.url,
);

let productionAssetTags: Promise<string> | undefined;

async function clientAssetTags(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    return [
      '<link rel="stylesheet" href="/src/components/product-detail-page.css" />',
      '<script type="module" src="/src/main.tsx"></script>',
    ].join("\n");
  }

  productionAssetTags ??= readFile(productionFrontendIndex, "utf8").then(
    (html) => {
      const links = (html.match(/<link\b[^>]*>/gi) ?? []).filter((tag) =>
        /rel=["'](?:stylesheet|preconnect|icon)["']/i.test(tag),
      );
      const scripts =
        html.match(
          /<script\b[^>]*type=["']module["'][^>]*><\/script>/gi,
        ) ?? [];
      if (!scripts.length) {
        throw new Error("The storefront build has no module entry script");
      }
      return [...links, ...scripts].join("\n");
    },
  );
  return productionAssetTags;
}

router.get("/produkte/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug)
    ? req.params.slug[0]
    : req.params.slug;
  if (!slug) {
    res.status(404).type("html").send("<!doctype html><title>Product not found</title>");
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.id, slug),
        eq(productsTable.active, true),
        eq(productsTable.published, true),
      ),
    )
    .limit(1);

  if (!product) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.status(404).type("html").send(
      "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Product not found | Objet Décoratif</title></head><body><main><h1>Product not found</h1><a href=\"/#collection\">Return to the collection</a></main></body></html>",
    );
    return;
  }

  const scents = product.scentIds.length
    ? await db
        .select()
        .from(scentsTable)
        .where(
          and(
            inArray(scentsTable.id, product.scentIds),
            eq(scentsTable.active, true),
            eq(scentsTable.published, true),
          ),
        )
        .orderBy(asc(scentsTable.sortOrder))
    : [];

  const canonicalUrl = productPageUrl(product.id, storeOrigin());
  const html = renderProductSeoHtml(
    product,
    scents,
    await clientAssetTags(),
  );
  res.setHeader("Link", `<${canonicalUrl}>; rel="canonical"`);
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );
  res.status(200).type("html").send(html);
});

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const products = await db
    .select({
      id: productsTable.id,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .where(
      and(eq(productsTable.active, true), eq(productsTable.published, true)),
    )
    .orderBy(asc(productsTable.sortOrder));

  const origin = storeOrigin();
  const staticPaths = [
    "/",
    "/about",
    "/faq",
    "/care",
    "/contact",
    "/shipping-policy",
    "/returns",
    "/terms",
    "/privacy-policy",
    "/legal-notice",
  ];
  const entries = [
    ...staticPaths.map((path) => ({
      url: `${origin}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.4,
    })),
    ...products.map((product) => ({
      url: productPageUrl(product.id, origin),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.type("application/xml").send(renderSitemapXml(entries));
});

export default router;
