import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CatalogMedia } from "@/components/catalog-media";
import { PriceDisclosure } from "@/components/price-disclosure";
import { useLanguage } from "@/lib/language";
import type { FrontendProduct } from "@/lib/catalog";
import "./product-detail-page.css";

type ProductDetailPageProps = {
  product: FrontendProduct;
  onBuy: (product: FrontendProduct, scent: string) => void;
};

export function ProductDetailPage({
  product,
  onBuy,
}: ProductDetailPageProps) {
  const { t } = useLanguage();
  const images = product.images ?? [];
  const scents = product.scentOptions ?? [];
  const [activeImage, setActiveImage] = useState(0);
  const [selectedScent, setSelectedScent] = useState(scents[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState<"Small" | "Big">("Small");

  useEffect(() => {
    setActiveImage(0);
  }, [product.id]);

  useEffect(() => {
    setSelectedScent(scents[0]?.name ?? "");
    setSelectedSize("Small");
  }, [product.id, product.scentOptions]);

  const moveImage = (direction: number) => {
    if (images.length < 2) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };

  return (
    <main className="od-product-page">
      <div className="od-product-page__topline">
        <Link
          href="/#collection"
          className="od-product-page__back"
          data-testid="link-back-to-collection"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{t("Back to the collection")}</span>
        </Link>
        <span className="od-product-page__index">{t(product.collection)} / {t(product.category)}</span>
      </div>

      <div className="od-product-page__layout">
        <section
          className="od-product-page__gallery"
          aria-label={t("Product images")}
          data-testid={`gallery-product-${product.id}`}
        >
          {images.length > 0 ? (
            <>
              <div className="od-product-page__media">
                {images.map((image, index) => (
                  <CatalogMedia
                    key={`${image}-${index}`}
                    className={`od-product-page__image${index === activeImage ? " is-active" : ""}`}
                    src={image}
                    active={index === activeImage}
                    controls
                    alt={`${product.name} concrete candle vessel — ${t(product.description)}`}
                    loading={index === activeImage ? "eager" : "lazy"}
                    aria-hidden={index !== activeImage}
                  />
                ))}
                {images.length > 1 && (
                  <>
                    <button
                      className="od-product-page__gallery-arrow od-product-page__gallery-arrow--previous"
                      type="button"
                      onClick={() => moveImage(-1)}
                      aria-label={t("Previous product image")}
                      data-testid="button-previous-product-image"
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="od-product-page__gallery-arrow od-product-page__gallery-arrow--next"
                      type="button"
                      onClick={() => moveImage(1)}
                      aria-label={t("Next product image")}
                      data-testid="button-next-product-image"
                    >
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="od-product-page__thumbnails" role="group" aria-label={t("Choose product image")}>
                  {images.map((image, index) => (
                    <button
                      key={`${image}-thumb-${index}`}
                      className={`od-product-page__thumbnail${index === activeImage ? " is-active" : ""}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`${t("Show image")} ${index + 1}`}
                      aria-pressed={index === activeImage}
                      data-testid={`button-product-image-${index + 1}`}
                    >
                      <CatalogMedia
                        src={image}
                        active={false}
                        controls={false}
                        alt=""
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="od-product-page__media od-product-page__media--empty">
              <span>{product.name}</span>
            </div>
          )}
        </section>

        <section className="od-product-page__details" aria-labelledby="od-product-title">
          <p className="od-product-page__eyebrow">{t(product.collection)} / {t(product.category)}</p>
          <div className="od-product-page__heading">
            <h1 id="od-product-title">{product.name}</h1>
            <span className="od-product-page__price" data-testid={`text-price-${product.id}`}>
              €{product.price}
            </span>
          </div>
          <PriceDisclosure className="price-disclosure--product" />
          <p className="od-product-page__description">{t(product.description)}</p>

          {product.id === "refill" && (
            <fieldset className="od-product-page__scent-options">
              <legend>{t("Refill size")}</legend>
              <div className="product-card__sizes">
                {(["Small", "Big"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={selectedSize === size ? "is-selected" : ""}
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    data-testid={`button-product-detail-size-${size.toLowerCase()}`}
                  >
                    {t(size === "Small" ? "Small (190g)" : "Big (245g)")}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {scents.length > 0 && (
            <fieldset className="od-product-page__scent-options">
              <legend>{t("Choose a scent")}</legend>
              <div className="od-product-page__scent-list">
                {scents.map((scent, index) => (
                  <label
                    key={scent.id || scent.name}
                    className={`od-product-page__scent-option${selectedScent === scent.name ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`product-scent-${product.id}`}
                      value={scent.name}
                      checked={selectedScent === scent.name}
                      onChange={() => setSelectedScent(scent.name)}
                      data-testid={`input-scent-${index + 1}`}
                    />
                    <span className="od-product-page__scent-mark" aria-hidden="true" />
                    <span className="od-product-page__scent-copy">
                      <strong>{scent.name}</strong>
                      <small>{t(scent.notes)}</small>
                    </span>
                    <span className="od-product-page__scent-number">{String(index + 1).padStart(2, "0")}</span>
                  </label>
                ))}
              </div>
              {scents.find((scent) => scent.name === selectedScent)?.description && (
                <p className="od-product-page__scent-description">
                  {t(scents.find((scent) => scent.name === selectedScent)!.description)}
                </p>
              )}
            </fieldset>
          )}

          <button
            className="od-product-page__buy"
            type="button"
            onClick={() =>
              onBuy(
                product,
                product.id === "refill"
                  ? `${selectedSize} / ${selectedScent}`
                  : selectedScent,
              )
            }
            data-testid={`button-buy-${product.id}`}
          >
            <span>{t("Add to cart")} · €{product.price.toFixed(2)}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <div className="od-product-page__trust" data-testid="product-trust-details">
            <span>{t("Standard delivery · 3–5 working days")}</span>
            <Link href="/returns">{t("Return terms")}</Link>
          </div>

          <div className="od-product-page__about">
            <span>{t("About the object")}</span>
            <p>{t(product.explanation)}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
