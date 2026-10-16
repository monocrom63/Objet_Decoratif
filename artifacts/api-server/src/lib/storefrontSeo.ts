export type SeoProduct = {
  id: string;
  name: string;
  collection: string;
  category: string;
  description: string;
  explanation: string;
  priceCents: number;
  imagePaths: string[];
  updatedAt?: Date | string | null;
};

export type SeoScent = {
  id: string;
  name: string;
  notes: string;
  description: string;
};

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string | null;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const SITE_ORIGIN = "https://objet-decoratif-storefront.replit.app";

export function storeOrigin(): string {
  return SITE_ORIGIN;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isVideoMedia(path: string): boolean {
  return /\.(?:mp4|m4v|mov|webm|ogv)(?:[?#].*)?$/i.test(path);
}

export function absoluteMediaUrl(path: string, origin = SITE_ORIGIN): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/objects/")) return `${origin}/api/storage${path}`;
  if (path.startsWith("/api/storage/")) return `${origin}${path}`;

  const cleanPath = path.replace(/^\/+/, "");
  return `${origin}/${cleanPath.startsWith("images/") ? cleanPath : `images/${cleanPath}`}`;
}

function truncateAtWord(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const candidate = normalized.slice(0, maxLength - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const end = lastSpace >= maxLength * 0.65 ? lastSpace : candidate.length;
  return `${candidate.slice(0, end).trimEnd()}…`;
}

export function productMetaDescription(product: SeoProduct): string {
  return truncateAtWord(
    `${product.name}: ${product.description} ${product.explanation}`,
    160,
  );
}

export function productPageUrl(productId: string, origin = SITE_ORIGIN): string {
  return `${origin}/produkte/${encodeURIComponent(productId)}`;
}

function jsonLdText(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function productJsonLd(
  product: SeoProduct,
  canonicalUrl: string,
  imageUrls: string[],
) {
  const description = `${product.description} ${product.explanation}`.trim();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description,
        sku: product.id,
        category: product.category,
        ...(imageUrls.length ? { image: imageUrls } : {}),
        brand: {
          "@type": "Brand",
          name: "Objet Décoratif",
        },
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "EUR",
          price: (product.priceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "Objet Décoratif",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Shop collection",
            item: `${SITE_ORIGIN}/#collection`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}

function renderMedia(product: SeoProduct, origin: string): string {
  return product.imagePaths
    .map((path, index) => {
      const mediaUrl = escapeHtml(absoluteMediaUrl(path, origin));
      if (isVideoMedia(path)) {
        return `<video class="od-product-page__image${index === 0 ? " is-active" : ""}" ${index === 0 ? "autoplay muted playsinline" : ""} controls preload="metadata" aria-label="${escapeHtml(`${product.name} video ${index + 1}`)}"><source src="${mediaUrl}"></video>`;
      }
      return `<img class="od-product-page__image${index === 0 ? " is-active" : ""}" src="${mediaUrl}" alt="${escapeHtml(`${product.name} — view ${index + 1}`)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} />`;
    })
    .join("");
}

export function renderProductSeoHtml(
  product: SeoProduct,
  scents: SeoScent[],
  assetTags: string,
): string {
  const origin = SITE_ORIGIN;
  const canonicalUrl = productPageUrl(product.id, origin);
  const title = `${product.name} – Refillable Concrete Candle | Objet Décoratif`;
  const description = productMetaDescription(product);
  const images = product.imagePaths
    .filter((path) => !isVideoMedia(path))
    .map((path) => absoluteMediaUrl(path, origin));
  const socialImage = images[0];
  const structuredData = jsonLdText(
    productJsonLd(product, canonicalUrl, images),
  );
  const scentMarkup = scents.length
    ? `<section aria-labelledby="product-scent-heading"><h2 id="product-scent-heading">Choose the atmosphere</h2><ul>${scents
        .map(
          (scent) =>
            `<li><strong>${escapeHtml(scent.name)}</strong><span> — ${escapeHtml(scent.notes)}</span><p>${escapeHtml(scent.description)}</p></li>`,
        )
        .join("")}</ul></section>`
    : "";
  const mediaMarkup = renderMedia(product, origin);
  const price = (product.priceCents / 100).toFixed(2);
  const encodedProductId = encodeURIComponent(product.id);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="Objet Décoratif" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    ${socialImage ? `<meta property="og:image" content="${escapeHtml(socialImage)}" /><meta property="og:image:alt" content="${escapeHtml(`${product.name} concrete candle`)}" />` : ""}
    <meta property="product:price:amount" content="${price}" />
    <meta property="product:price:currency" content="EUR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${socialImage ? `<meta name="twitter:image" content="${escapeHtml(socialImage)}" />` : ""}
    <script id="product-structured-data" type="application/ld+json">${structuredData}</script>
    ${assetTags}
  </head>
  <body>
    <div id="root">
      <div class="store-shell">
        <header style="position:fixed;inset:0 0 auto;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:22px 5vw;background:rgba(238,234,224,.92);color:#20201c">
          <a href="/" style="font:600 20px 'Chakra Petch',sans-serif;letter-spacing:.04em;text-decoration:none;color:inherit">OBJET DÉCORATIF</a>
          <nav aria-label="Main navigation"><a href="/#collection" style="color:inherit">Products</a></nav>
        </header>
        <main class="od-product-page">
          <div class="od-product-page__topline">
            <a class="od-product-page__back" href="/#collection">← <span>Back to the collection</span></a>
            <span class="od-product-page__index">${escapeHtml(product.collection)} / ${escapeHtml(product.category)}</span>
          </div>
          <div class="od-product-page__layout">
            <section class="od-product-page__gallery" aria-label="${escapeHtml(`${product.name} product images`)}">
              <div class="od-product-page__media">${mediaMarkup || `<div class="od-product-page__media od-product-page__media--empty"><span>${escapeHtml(product.name)}</span></div>`}</div>
            </section>
            <section class="od-product-page__details" aria-labelledby="od-product-title">
              <p class="od-product-page__eyebrow">${escapeHtml(product.collection)} / ${escapeHtml(product.category)}</p>
              <div class="od-product-page__heading">
                <h1 id="od-product-title">${escapeHtml(product.name)}</h1>
                <span class="od-product-page__price">€${price}</span>
              </div>
              <p class="od-product-page__description">${escapeHtml(product.description)}</p>
              ${scentMarkup}
              <a class="od-product-page__buy" href="/?product=${encodedProductId}#collection"><span>Add to cart</span> →</a>
              <div class="od-product-page__about">
                <span>About the object</span>
                <p>${escapeHtml(product.explanation)}</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  </body>
</html>`;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString().slice(0, 10)}</lastmod>`
        : "";
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority =
        typeof entry.priority === "number"
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : "";
      return `<url><loc>${xmlEscape(entry.url)}</loc>${lastModified}${changeFrequency}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
