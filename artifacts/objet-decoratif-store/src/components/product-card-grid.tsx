import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CatalogMedia } from "@/components/catalog-media";
import { PriceDisclosure } from "@/components/price-disclosure";
import { isVideoPath } from "@/lib/media";
import { useLanguage } from "@/lib/language";
import type { FrontendProduct } from "@/lib/catalog";

export function ProductCardGrid({
  products,
  onAdd,
}: {
  products: FrontendProduct[];
  onAdd: (product: FrontendProduct, scent: string, quantity: number) => void;
}) {
  return (
    <div className="product-card-grid" data-testid="product-card-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: FrontendProduct;
  onAdd: (product: FrontendProduct, scent: string, quantity: number) => void;
}) {
  const { t } = useLanguage();
  const scents = product.scentOptions ?? [];
  const [selectedScent, setSelectedScent] = useState(scents[0]?.name ?? product.scents[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<"Small" | "Big">("Small");
  const image = product.images?.find((path) => !isVideoPath(path));
  const selectedVariant =
    product.id === "refill"
      ? `${selectedSize} / ${selectedScent}`
      : selectedScent;

  return (
    <article className="product-card" data-testid={`card-product-${product.id}`}>
      <Link
        href={`/produkte/${encodeURIComponent(product.id)}`}
        className="product-card__image-link"
        aria-label={`${t("View")} ${product.name}`}
      >
        <div className="product-card__image">
          {image ? (
            <CatalogMedia
              src={image}
              alt={`${product.name} concrete candle vessel — ${t(product.description)}`}
              controls={false}
              loading="lazy"
            />
          ) : (
            <span className="product-card__image-fallback">{product.name}</span>
          )}
          {product.tag && <span className="product-card__tag">{t(product.tag)}</span>}
        </div>
      </Link>
      <div className="product-card__body">
        <div className="product-card__heading">
          <div>
            <span className="product-card__collection">{t(product.collection)}</span>
            <h3>
              <Link href={`/produkte/${encodeURIComponent(product.id)}`}>
                {product.name}
              </Link>
            </h3>
          </div>
          <strong>€{product.price.toFixed(2)}</strong>
        </div>
        <p className="product-card__description">{t(product.description)}</p>
        <PriceDisclosure className="price-disclosure--catalog" />
        {product.id === "refill" && (
          <div className="product-card__sizes" role="group" aria-label={t("Refill size")}>
            {(["Small", "Big"] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={selectedSize === size ? "is-selected" : ""}
                onClick={() => setSelectedSize(size)}
                aria-pressed={selectedSize === size}
                data-testid={`button-product-card-size-${size.toLowerCase()}`}
              >
                {t(size === "Small" ? "Small (190g)" : "Big (245g)")}
              </button>
            ))}
          </div>
        )}
        {scents.length > 0 && (
          <div className="product-card__scents" role="group" aria-label={t("Choose a scent")}>
            {scents.map((scent) => (
              <button
                key={scent.id}
                type="button"
                className={selectedScent === scent.name ? "is-selected" : ""}
                onClick={() => setSelectedScent(scent.name)}
                aria-pressed={selectedScent === scent.name}
                data-testid={`button-product-card-scent-${product.id}-${scent.id}`}
              >
                {scent.name}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="product-card__buy"
          onClick={() => onAdd(product, selectedVariant, 1)}
          data-testid={`button-product-card-add-${product.id}`}
        >
          {t("Add to cart")} · €{product.price.toFixed(2)}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
        <div className="product-card__trust">
          <span>{t("Standard delivery · 3–5 working days")}</span>
          <Link href="/returns">{t("Return terms")}</Link>
        </div>
      </div>
    </article>
  );
}
