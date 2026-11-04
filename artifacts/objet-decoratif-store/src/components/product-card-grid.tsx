import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CatalogMedia } from "@/components/catalog-media";
import { PriceDisclosure } from "@/components/price-disclosure";
import { isVideoPath } from "@/lib/media";
import { useLanguage } from "@/lib/language";
import { localizedProductDescription } from "@/lib/product-copy";
import type { FrontendProduct } from "@/lib/catalog";
import {
  priceForProductVariant,
  refillOptionsForProduct,
  refillVariant,
  type RefillSize,
} from "@/lib/refill-pricing";

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
  const { t, locale } = useLanguage();
  const scents = product.scentOptions ?? [];
  const [selectedScent, setSelectedScent] = useState(scents[0]?.name ?? product.scents[0] ?? "");
  const refillOptions = refillOptionsForProduct(product.refillOptions);
  const [selectedSize, setSelectedSize] = useState<RefillSize>(
    refillOptions[0]!.quantityGrams,
  );
  useEffect(() => {
    if (!refillOptions.some((option) => option.quantityGrams === selectedSize)) {
      setSelectedSize(refillOptions[0]!.quantityGrams);
    }
  }, [product.refillOptions, selectedSize, refillOptions]);
  const image = product.images?.find((path) => !isVideoPath(path));
  const selectedPrice = priceForProductVariant(
    product.id,
    product.price,
    `${selectedSize} g`,
    product.refillOptions,
  );
  const selectedVariant =
    product.id === "refill"
      ? refillVariant(selectedSize, selectedScent)
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
              fallbackSrc={product.fallbackImages?.[0]}
              alt={`${product.name} concrete candle vessel — ${localizedProductDescription(product, locale, t)}`}
              controls={false}
              loading="lazy"
            />
          ) : (
            <span className="product-card__image-fallback">{product.name}</span>
          )}
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
          <strong>€{selectedPrice.toFixed(2)}</strong>
        </div>
        <p className="product-card__description">{localizedProductDescription(product, locale, t)}</p>
        <PriceDisclosure className="price-disclosure--catalog" />
        {product.id === "refill" && (
          <div className="product-card__sizes" role="group" aria-label={t("Refill size")}>
            {refillOptions.map((option) => (
              <button
                key={option.quantityGrams}
                type="button"
                className={selectedSize === option.quantityGrams ? "is-selected" : ""}
                onClick={() => setSelectedSize(option.quantityGrams)}
                aria-pressed={selectedSize === option.quantityGrams}
                data-testid={`button-product-card-size-${option.quantityGrams}g`}
              >
                {option.quantityGrams} g
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
          {t("Add to cart")} · €{selectedPrice.toFixed(2)}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
