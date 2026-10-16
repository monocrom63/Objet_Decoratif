import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Show, SignIn, SignUp, UserButton, useUser } from "@clerk/react";
import {
  useCreateOrder,
  useGetMe,
  getGetMeQueryKey,
  useListAdminOrders,
  useListAdminUsers,
  useListMyOrders,
  useUpdateOrderStatus,
  type OrderStatus,
  type Order,
} from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LogoutButton } from "@/components/logout-button";
import { CatalogMedia } from "@/components/catalog-media";
import { ProductDetailPage } from "@/components/product-detail-page";
import { ProductCardGrid } from "@/components/product-card-grid";
import { FaqPage } from "@/components/faq-page";
import { PriceDisclosure } from "@/components/price-disclosure";
import { HeaderNavMenu } from "@/components/header-nav-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { isVideoPath } from "@/lib/media";
import { useLanguage } from "@/lib/language";
import { CONTACT_EMAIL } from "@/lib/store-config";
import { freeShippingProgress, shippingForSubtotal } from "@/lib/commerce-pricing";
import { scentShowcaseSource } from "@/lib/scent-media";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import {
  decodePolicyHtml,
  legalNoticeData,
  privacyPolicyData,
  returnsPolicyData,
  shippingPolicyData,
  termsPolicyData,
} from "@/policy-content";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  useCatalogFrontend,
  type FrontendProduct as Product,
  type ScentOption,
  type ProductCollection,
} from "@/lib/catalog";
import { CatalogCms } from "@/components/admin/catalog-cms";
import { demoOrders, demoUsers } from "@/components/admin/demo-data";
import { useGetCatalog } from "@workspace/api-client-react";

type CartLine = { product: Product; scent: string; quantity: number };

const publicStoreOrigin = "https://objet-decoratif-storefront.replit.app";
const homeDescription =
  "Sculptural concrete candle vessels, considered fragrances and refillable forms, made for a quieter everyday ritual.";

function updateMetaTag(
  attribute: "name" | "property",
  key: string,
  content: string | null,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function updateStorePageSeo(
  product: Product | undefined,
  locale: string,
  t: (text: string) => string,
) {
  const isGerman = locale === "de-DE";
  const isRefill = /refill/i.test(`${product?.id ?? ""} ${product?.category ?? ""}`);
  const title = product
    ? isGerman
      ? isRefill
        ? `${product.name} – Duftwachs-Refill | Objet Décoratif`
        : `${product.name} – Nachfüllbare Betonkerze | Objet Décoratif`
      : isRefill
        ? `${product.name} – Candle Wax Refill | Objet Décoratif`
        : `${product.name} – Refillable Concrete Candle | Objet Décoratif`
    : isGerman
      ? "Nachfüllbare Betonkerzen | Objet Décoratif"
      : "Refillable Concrete Candles | Objet Décoratif";
  const rawDescription = product
    ? `${product.name}: ${t(product.description)} ${t(product.explanation)}`
    : isGerman
      ? "Skulpturale Betonkerzen mit ausgewählten Düften und austauschbarem Wachs-Refill. Entdecke die Formen von Objet Décoratif."
      : homeDescription;
  const description =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trimEnd()}…`
      : rawDescription;
  const canonicalUrl = product
    ? `${publicStoreOrigin}/produkte/${encodeURIComponent(product.id)}`
    : `${publicStoreOrigin}/`;

  document.title = title;
  updateMetaTag("name", "description", description);
  updateMetaTag("name", "robots", "index, follow");
  updateMetaTag("property", "og:site_name", "Objet Décoratif");
  updateMetaTag("property", "og:type", product ? "product" : "website");
  updateMetaTag("property", "og:title", title);
  updateMetaTag("property", "og:description", description);
  updateMetaTag("property", "og:url", canonicalUrl);
  updateMetaTag("name", "twitter:card", "summary_large_image");
  updateMetaTag("name", "twitter:title", title);
  updateMetaTag("name", "twitter:description", description);
  updateCanonical(canonicalUrl);

  const image =
    product?.images?.find((path) => !isVideoPath(path)) ??
    (product ? undefined : "/images/products/elephant-01.webp");
  const absoluteImage = image ? new URL(image, publicStoreOrigin).toString() : null;
  updateMetaTag("property", "og:image", absoluteImage);
  updateMetaTag(
    "property",
    "og:image:alt",
    image
      ? `${product?.name ?? "Objet Décoratif"} concrete candle vessel`
      : null,
  );
  updateMetaTag("name", "twitter:image", absoluteImage);

  let structuredData = document.head.querySelector<HTMLScriptElement>(
    "#product-structured-data",
  );
  if (!product) {
    structuredData?.remove();
    return;
  }
  if (!structuredData) {
    structuredData = document.createElement("script");
    structuredData.id = "product-structured-data";
    structuredData.type = "application/ld+json";
    document.head.appendChild(structuredData);
  }
  const images = (product.images ?? [])
    .filter((path) => !isVideoPath(path))
    .map((path) => new URL(path, publicStoreOrigin).toString());
  structuredData.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: `${t(product.description)} ${t(product.explanation)}`,
        sku: product.id,
        category: product.category,
        ...(images.length ? { image: images } : {}),
        brand: { "@type": "Brand", name: "Objet Décoratif" },
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "EUR",
          price: product.price.toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Objet Décoratif" },
        },
      },
      {
        "@type": "Organization",
        name: "Objet Décoratif",
        url: `${publicStoreOrigin}/`,
        email: CONTACT_EMAIL,
        sameAs: ["https://www.instagram.com/objet_decoratif/"],
      },
    ],
  });
}

const imagePath = (fileName: string) =>
  `${import.meta.env.BASE_URL}images/products/${fileName}`;

const careImagePath = (fileName: string) =>
  `${import.meta.env.BASE_URL}images/care/${fileName}`;

const careImages = [
  {
    src: careImagePath("care-01.webp"),
    alt: "Refill being placed into a sculptural candle vessel",
  },
  {
    src: careImagePath("care-02.webp"),
    alt: "Candle vessel viewed from above with a wooden wick",
  },
];

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const CART_STORAGE_KEY = "objet-decoratif-cart";

function readStoredCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Sculpture({
  product,
  flame = false,
}: {
  product: Product;
  flame?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={`product-art ${product.art}`}
      data-testid={`img-product-${product.id}`}
    >
      <div className="vessel">
        <div className="wax" />
        <div className="wick" />
        {flame && <div className="flame" />}
      </div>
      {product.tag && <span className="product-tag">{t(product.tag)}</span>}
    </div>
  );
}

function ObjectSlideshow({ product }: { product: Product }) {
  const { t, locale } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images ?? [];

  useEffect(() => {
    setActiveIndex((current) => current < images.length ? current : 0);
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2 || isVideoPath(images[activeIndex])) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4300);
    return () => window.clearInterval(timer);
  }, [images.length, activeIndex, images[activeIndex]]);

  return (
    <div
      className="object-media"
      role="group"
      aria-label={`${product.name} images and videos`}
    >
      {images.map((image, index) => (
        <CatalogMedia
          key={image}
          className={`object-photo ${index === activeIndex ? "active" : ""}`}
          src={image}
          active={index === activeIndex}
          alt={`${product.name} concrete candle vessel — ${t(product.description)}`}
          loading={index === activeIndex ? "eager" : "lazy"}
        />
      ))}
      <div className="slide-controls" aria-label={t("Choose product media")}>
        {images.map((image, index) => (
          <button
            key={image}
            className={`slide-dot ${index === activeIndex ? "active" : ""}`}
            type="button"
            aria-label={`Show ${isVideoPath(image) ? "video" : "image"} ${index + 1}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

function ScentSelector({
  product,
  selectedScent,
  onSelect,
  onAdd,
}: {
  product: Product;
  selectedScent: string;
  onSelect: (scent: string) => void;
  onAdd: () => void;
}) {
  const { t, locale } = useLanguage();
  const options: ScentOption[] =
    product.scentOptions ??
    product.scents.map((name) => ({
      id: name,
      name,
      notes: "Signature fragrance",
      description: "A considered fragrance for the everyday ritual.",
    }));
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.name === selectedScent),
  );
  const selected = options[selectedIndex] ?? options[0];
  const changeScent = (direction: number) => {
    const nextIndex =
      (selectedIndex + direction + options.length) % options.length;
    onSelect(options[nextIndex].name);
  };

  return (
    <div className="scent-selector">
      <div className="scent-selector-head">
        <span className="option-label">{t("Choose the atmosphere")}</span>
        <span className="selected-scent">
          {String(selectedIndex + 1).padStart(2, "0")} /{t(" ")}
          {String(options.length).padStart(2, "0")}
        </span>
      </div>
      {selected && (
        <div className="scent-slideshow">
          <div className="scent-slide-image-wrap">
            {options.map((option, index) =>
              option.image ? (
                <CatalogMedia
                  key={option.name}
                  className={`scent-slide-image ${index === selectedIndex ? "active" : ""}`}
                  src={option.image}
                  active={index === selectedIndex}
                  controls={false}
                  autoPlay
                  loop
                  alt={`${option.name} fragrance`}
                  aria-hidden={index !== selectedIndex}
                />
              ) : (
                <span
                  key={option.name}
                  className={`scent-slide-swatch ${index === selectedIndex ? "active" : ""}`}
                  aria-hidden="true"
                />
              ),
            )}
            {options.length > 1 && (
              <div className="scent-slide-arrows">
                <button
                  type="button"
                  onClick={() => changeScent(-1)}
                  aria-label={t("Previous scent")}
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => changeScent(1)}
                  aria-label={t("Next scent")}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="scent-slide-copy" key={selected.name}>
            <span className="scent-slide-number">{t("Scent / ")}{String(selectedIndex + 1).padStart(2, "0")}
            </span>
            <strong>{selected.name}</strong>
            <small>{t(selected.notes)}</small>
            <p>{t(selected.description)}</p>
            <button
              className="solid-button object-buy-button scent-slide-buy-button"
              type="button"
              onClick={onAdd}
              data-testid={`button-open-object-${product.id}`}
            >
              {t("Add to cart")} · €{product.price.toFixed(2)}{" "}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectShowcase({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [selectedScent, setSelectedScent] = useState(
    product.scentOptions?.[0]?.name ?? product.scents[0],
  );

  return (
    <article
      className="object-showcase"
      data-testid={`object-showcase-${product.id}`}
    >
      <div className="object-media-wrap">
        <div className="object-index">{t("Object / ")}{product.name}</div>
        {product.images ? (
          <ObjectSlideshow product={product} />
        ) : (
          <div className="object-media object-media-fallback">
            <Sculpture product={product} />
          </div>
        )}
      </div>
      <div className="object-details">
        <div className="section-kicker">{product.collection}{t(" collection")}</div>
        <div className="object-title-row">
          <div>
            <h3>
              <Link
                className="object-detail-title"
                href={`/produkte/${encodeURIComponent(product.id)}`}
              >
                {product.name}
              </Link>
            </h3>
            <p>{t(product.description)}</p>
          </div>
          <span className="object-price">€{product.price}</span>
        </div>
        <PriceDisclosure className="price-disclosure--catalog" />
        <div className="object-actions">
          <ScentSelector
            product={product}
            selectedScent={selectedScent}
            onSelect={setSelectedScent}
            onAdd={() => onAdd(product, selectedScent, 1)}
          />
        </div>
      </div>
      <div className="object-explanation object-explanation-with-action">
        <div className="object-explanation-copy">
          <span className="object-explanation-label">{t("About the object")}</span>
          <p>{t(product.explanation)}</p>
        </div>
      </div>
    </article>
  );
}

function RefillShowcase({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [size, setSize] = useState<"Small" | "Big">("Small");
  const [scent, setScent] = useState("Thé");
  const selectedVariant = `${size} / ${scent}`;

  return (
    <article
      className="object-showcase refill-showcase"
      id="refill"
      data-testid="object-showcase-refill"
    >
      <div className="object-media-wrap">
        <div className="object-index">{t("Object / Refill")}</div>
        <ObjectSlideshow product={product} />
      </div>
      <div className="object-details refill-details">
        <div className="section-kicker">{t("Refill / for every form")}</div>
        <div className="object-title-row">
          <div>
            <h3>{t("Refill")}</h3>
            <p>{t("A new atmosphere for the form you already love.")}</p>
          </div>
          <span className="object-price">€{product.price}</span>
        </div>
        <PriceDisclosure className="price-disclosure--catalog" />
        <div className="refill-options">
          <span className="option-label">{t("Choose your refill")}</span>
          <div className="refill-select-row">
            <label>
              <span className="refill-select-label">{t("Size")}</span>
              <select
                className="refill-select"
                value={size}
                onChange={(event) =>
                  setSize(event.target.value as "Small" | "Big")
                }
                aria-label={t("Refill size")}
              >
                <option value="Small">{t("Small (190g)")}</option>
                <option value="Big">{t("Big (245g)")}</option>
              </select>
            </label>
            <label>
              <span className="refill-select-label">{t("Scent")}</span>
              <select
                className="refill-select"
                value={scent}
                onChange={(event) => setScent(event.target.value)}
                aria-label={t("Refill scent")}
              >
                <option value="Thé">{t("Thé")}</option>
                <option value="Bois Santal">{t("Bois Santal")}</option>
                <option value="Tropicale">{t("Tropicale")}</option>
                <option value="Cedar Salad">{t("Cedar Salad")}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="refill-copy">
          <p>{t("Our sculptural candles are designed to last.")}</p>
          <p>{t("With our refills, you extend their life—quietly, sustainably, and without ever replacing the form itself.")}</p>
          <p>{t("Each refill is hand-poured in our Berlin atelier and precisely tailored to our sculptures. The minimalist composition allows the fragrance to unfold evenly without overpowering the room.")}</p>
        </div>
        <button
          className="solid-button object-buy-button refill-buy-button"
          type="button"
          onClick={() => onAdd(product, selectedVariant, 1)}
          data-testid="button-open-object-refill"
        >{t("Add to cart")} · €{product.price.toFixed(2)}<ArrowRight size={14} />
        </button>
      </div>
      <div className="object-explanation">
        <span className="object-explanation-label">{t("About the refill")}</span>
        <p>{t(product.explanation)}</p>
      </div>
    </article>
  );
}

function ScentShowcase({
  product,
  scents,
  onAdd,
}: {
  product: Product;
  scents: ScentOption[];
  onAdd: (p: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = scents[activeIndex];

  const changeScent = (direction: number) => {
    setActiveIndex(
      (current) => (current + direction + scents.length) % scents.length,
    );
  };

  return (
    <>
      <div className="scent-showcase-heading" id="scents">
        <div>
          <div className="section-kicker">{t("The atmosphere / 02")}</div>
          <h2 className="section-title">{t("Signature")}<br />
            <em>{t("scents.")}</em>
          </h2>
        </div>
        <p className="section-intro">{t("Four scent compositions, each unfolding slowly through the warmth of the candle.")}</p>
      </div>
      <article
        className="object-showcase scent-showcase"
        data-testid="scent-showcase"
      >
        <div className="object-media-wrap">
          <div className="object-index">{t("Atmosphere / ")}{String(activeIndex + 1).padStart(2, "0")}
          </div>
          <div
            className="object-media scent-showcase-media"
            role="group"
            aria-label={t("Signature scent images and videos")}
          >
            {scents.map((option, index) => (
              <CatalogMedia
                key={option.name}
                className={`object-photo ${index === activeIndex ? "active" : ""}`}
                src={scentShowcaseSource(option)}
                active={index === activeIndex}
                controls={false}
                autoPlay
                loop
                alt={`${option.name} scent study`}
                aria-hidden={index !== activeIndex}
              />
            ))}
            <div className="slide-controls" aria-label={t("Choose a scent")}>
              {scents.map((option, index) => (
                <button
                  key={option.name}
                  className={`slide-dot ${index === activeIndex ? "active" : ""}`}
                  type="button"
                  aria-label={`Show ${option.name}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <div className="scent-slide-arrows">
              <button
                type="button"
                onClick={() => changeScent(-1)}
                aria-label={t("Previous scent")}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => changeScent(1)}
                aria-label={t("Next scent")}
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="object-details scent-showcase-details">
          <div className="section-kicker">{t("Signature scents / composed in Grasse")}</div>
          <div className="object-title-row">
            <div>
              <h3 key={selected.name} className="scent-showcase-title">
                {selected.name}
              </h3>
              <p>{t("245 gram refill · Up to 65H")}</p>
            </div>
            <span className="object-price">€{product.price}</span>
          </div>
          <PriceDisclosure className="price-disclosure--catalog" />
          <div className="scent-showcase-copy" key={`${selected.name}-copy`}>
            <span className="scent-showcase-label">{t("The atmosphere")}</span>
            <p>{t(selected.description)}</p>
            <span className="scent-showcase-label">{t("Scent notes")}</span>
            <p>{t(selected.notes)}</p>
          </div>
          <button
            className="solid-button object-buy-button scent-buy-button"
            type="button"
            onClick={() => onAdd(product, `Big / ${selected.name}`, 1)}
            data-testid={`button-open-scent-${selected.name.toLowerCase().replace(" ", "-")}`}
          >{t("Add to cart")} · €{product.price.toFixed(2)} <ArrowRight size={14} />
          </button>
        </div>
        <div className="object-explanation">
          <span className="object-explanation-label">{t("Keep the form. Change the atmosphere.")}</span>
          <p>{t("When the candle is finished, place a new wax refill inside the same vessel. Choose the same scent or change the atmosphere entirely.")}</p>
        </div>
      </article>
    </>
  );
}

function CareImageSlideshow() {
  const { t, locale } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % careImages.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  const changeImage = (direction: number) => {
    setActiveIndex(
      (current) =>
        (current + direction + careImages.length) % careImages.length,
    );
  };

  return (
    <div
      className="care-image-slideshow"
      role="group"
      aria-label={t("Candle care images")}
    >
      {careImages.map((image, index) => (
        <img
          key={image.src}
          className={`care-image-slide ${index === activeIndex ? "active" : ""}`}
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          aria-hidden={index !== activeIndex}
        />
      ))}
      <div className="care-image-arrows">
        <button
          type="button"
          onClick={() => changeImage(-1)}
          aria-label={t("Previous care image")}
        >
          <ArrowLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => changeImage(1)}
          aria-label={t("Next care image")}
        >
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="care-image-dots" aria-label={t("Choose care image")}>
        {careImages.map((image, index) => (
          <button
            key={image.src}
            className={index === activeIndex ? "active" : ""}
            type="button"
            aria-label={`Show care image ${index + 1}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

function Header({
  cartCount,
  onCart,
  onSearch,
}: {
  cartCount: number;
  onCart: () => void;
  onSearch: () => void;
}) {
  const { t, locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"products" | "od" | null>(null);
  const { language, setLanguage } = useLanguage();

  const changeMenu = (menu: "products" | "od", open: boolean) => {
    setOpenMenu((current) => (open ? menu : current === menu ? null : current));
  };

  const navTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.remove("nav-target-fade");
      window.requestAnimationFrame(() => {
        target.classList.add("nav-target-fade");
        window.setTimeout(
          () => target.classList.remove("nav-target-fade"),
          900,
        );
      });
    } else {
      window.location.href = `${import.meta.env.BASE_URL}#${id}`;
    }
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <header>
      <div className="announcement">{t("Free shipping on forms & refills over €100")}</div>
      <div className="site-header">
        <nav
          className={`main-nav ${mobileOpen ? "open" : ""}`}
          data-testid="nav-main"
        >
          <HeaderNavMenu
            label={t("Products")}
            testId="button-products-menu"
            open={openMenu === "products"}
            onOpenChange={(open) => changeMenu("products", open)}
          >
            <DropdownMenuItem
              className="header-nav-item"
              onSelect={() => navTo("collection")}
              data-testid="link-shop-collection"
            >{t("Candels")}</DropdownMenuItem>
            <DropdownMenuItem
              className="header-nav-item"
              onSelect={() => navTo("scents")}
              data-testid="link-signature-scents"
            >{t("Scents")}</DropdownMenuItem>
          </HeaderNavMenu>
          <HeaderNavMenu
            label={t("OD")}
            testId="button-od-menu"
            open={openMenu === "od"}
            onOpenChange={(open) => changeMenu("od", open)}
          >
            <DropdownMenuItem className="header-nav-item" asChild>
              <Link
                href="/about"
                onClick={() => {
                  setMobileOpen(false);
                  setOpenMenu(null);
                }}
                data-testid="link-about"
              >{t("About")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="header-nav-item" asChild>
              <Link
                href="/care"
                onClick={() => {
                  setMobileOpen(false);
                  setOpenMenu(null);
                }}
                data-testid="link-care"
              >{t("Care")}</Link>
            </DropdownMenuItem>
          </HeaderNavMenu>
          <Show when="signed-in">
            <LogoutButton
              className="nav-link mobile-logout-button"
              label={language === "DE" ? "Abmelden" : "Log out"}
              pendingLabel={language === "DE" ? "Wird abgemeldet…" : "Logging out…"}
              testId="button-logout-mobile"
            />
          </Show>
        </nav>
        <button
          className="menu-button"
          onClick={() => {
            setOpenMenu(null);
            setMobileOpen((open) => !open);
          }}
          aria-label={t("Open menu")}
          data-testid="button-menu"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <a href="/" className="logo" data-testid="link-logo">{t("Objet Décoratif")}</a>
        <div className="header-actions">
          <div
            className="language-switch"
            role="group"
            aria-label={t("Choose language")}
          >
            {(["DE", "EN"] as const).map((option) => (
              <button
                key={option}
                className={`language-option ${language === option ? "active" : ""}`}
                type="button"
                aria-pressed={language === option}
                onClick={() => setLanguage(option)}
                data-testid={`button-language-${option.toLowerCase()}`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            className="header-action search-only"
            onClick={onSearch}
            data-testid="button-search"
          >
            <Search size={14} strokeWidth={1.5} /> <span>{t("Search")}</span>
          </button>
          <Show when="signed-in">
            <Link href="/account" className="header-action account-link">{t("Account")}</Link>
            <LogoutButton
              className="header-action header-logout-button"
              label={language === "DE" ? "Abmelden" : "Log out"}
              pendingLabel={language === "DE" ? "Wird abgemeldet…" : "Logging out…"}
            />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="header-action account-link">{t("Sign in")}</Link>
          </Show>
          <button
            className="cart-button"
            onClick={onCart}
            aria-label={`${t("Cart")} (${cartCount})`}
            data-testid="button-cart"
          >
            <ShoppingBag size={14} strokeWidth={1.5} />
            <span className="cart-label">{t("Cart")}</span>
            <span className="cart-count" data-testid="text-cart-count">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({
  onExplore,
  product,
}: {
  onExplore: () => void;
  product?: Product;
}) {
  const { t } = useLanguage();
  const heroImage = product?.images?.find((path) => !isVideoPath(path));

  return (
    <section className="hero">
      {heroImage && (
        <img
          className="hero-product-image"
          src={heroImage}
          alt={`${product?.name} refillable concrete candle`}
          width={1600}
          height={1000}
          fetchPriority="high"
        />
      )}
      <div className="hero-copy">
        <span className="eyebrow">{t("Concrete candle collection / 01—25")}</span>
        <h1 className="hero-keyword">{t("Refillable concrete candles")}</h1>
        <p className="hero-brand-line">{t("Objects")}<br /><em>{t("With a Glow")}</em></p>
        <p className="hero-note">{t("Architectural vessels cast in concrete. Fragrances made to stay with you long after the flame goes out.")}</p>
        <button
          className="outline-button"
          onClick={onExplore}
          data-testid="button-explore-collection"
        >{t("Explore the collection ")}<ArrowDown size={13} />
        </button>
      </div>
      <span className="hero-index">{t("OD / 001")}</span>
    </section>
  );
}

function Collection({
  products,
  scents,
  onAdd,
}: {
  products: Product[];
  scents: ScentOption[];
  onAdd: (p: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [filter, setFilter] = useState<"All" | ProductCollection>("All");
  const visible = useMemo(
    () =>
      filter === "All"
        ? products
        : products.filter((p) => p.collection === filter),
    [filter],
  );
  const refillProduct = products.find((product) => product.id === "refill");
  return (
    <section className="section" id="collection">
      <div className="section-header">
        <div>
          <div className="section-kicker">{t("The forms / 01")}</div>
          <h2 className="section-title">{t("Shop collection")}</h2>
        </div>
        <p className="section-intro">{t("A small family of concrete forms. Each one is designed to be lived with, then lit again.")}</p>
      </div>
      <ProductCardGrid products={products} onAdd={onAdd} />
      <div className="collection-story-heading">
        <span>{t("The forms / 02")}</span>
        <p>{t("Explore each form in more detail.")}</p>
      </div>
      <div className="filter-bar">
        {(
          [
            "All",
            "Barrique",
            "Milano",
            "Boite",
            "Chateu",
            "Elephant",
            "Sakura",
            "Refill",
          ] as const
        ).map((item) => (
          <button
            key={item}
            className={`filter-button ${filter === item ? "active" : ""}`}
            onClick={() => setFilter(item)}
            data-testid={`button-filter-${item.toLowerCase()}`}
          >
            {t(item)}
          </button>
        ))}
      </div>
      <div
        key={filter}
        className="collection-results collection-results--fade-in"
      >
        <div className="object-list">
          {visible.map((product) =>
            product.id === "refill" ? (
              <RefillShowcase
                product={product}
                onAdd={onAdd}
                key={product.id}
              />
            ) : (
              <ObjectShowcase
                product={product}
                onAdd={onAdd}
                key={product.id}
              />
            ),
          )}
        </div>
        {(filter === "All" || filter === "Refill") && refillProduct && (
          <ScentShowcase
            product={refillProduct}
            scents={scents}
            onAdd={onAdd}
          />
        )}
      </div>
    </section>
  );
}

function Footer() {
  const { t, locale } = useLanguage();
  return (
    <footer className="footer editorial-footer" id="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <span className="footer-index">{t("01 / Sitemap")}</span>
          <div className="footer-links">
            <a href="/">{t("Home")}</a>
            <a href="/#collection">{t("The Forms")}</a>
            <a href="/#scents">{t("Signature Scents")}</a>
            <Link href="/about">{t("About")}</Link>
            <Link href="/faq">{t("FAQ")}</Link>
            <Link href="/care">{t("Candle Care")}</Link>
          </div>
        </div>
        <div className="footer-column">
          <span className="footer-index">{t("02 / Information")}</span>
          <div className="footer-links footer-muted-links">
            <Link href="/shipping-policy">{t("Shipping Policy")}</Link>
            <Link href="/returns">{t("Returns")}</Link>
            <Link href="/privacy-policy">{t("Privacy")}</Link>
            <Link href="/terms">{t("Terms")}</Link>
            <Link href="/legal-notice">{t("Legal Notice")}</Link>
          </div>
        </div>
        <div className="footer-column footer-contact">
          <span className="footer-index">{t("03 / Contact")}</span>
          <div className="footer-links">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CONTACT_EMAIL}
            </a>
            <Link href="/contact">{t("Contact Form ")}<span aria-hidden="true">↗</span>
            </Link>
            <a
              href="https://www.instagram.com/objet_decoratif/"
              target="_blank"
              rel="noreferrer"
            >{t("Instagram ")}<span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>{t("© Objet Décoratif / Made for slow evenings")}</span>
        <span>{t("Concrete candle collection — Berlin / Everywhere")}</span>
      </div>
    </footer>
  );
}

function EditorialPageFrame({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { products } = useCatalogFrontend();
  return (
    <div className="store-shell editorial-shell">
      <Header
        cartCount={0}
        onCart={() => {
          window.location.href = `${import.meta.env.BASE_URL}#collection`;
        }}
        onSearch={() => setSearchOpen((open) => !open)}
      />
      <SearchPanel
        products={products}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function PolicyPage({
  title,
  label,
  encodedContent,
}: {
  title: string;
  label: string;
  encodedContent: string;
}) {
  const { t, locale } = useLanguage();
  const [content, setContent] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const previousTitle = document.title;
    document.title = `${title} — Objet Décoratif`;

    decodePolicyHtml(encodedContent)
      .then((html) => {
        if (active) setContent(html);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
      document.title = previousTitle;
    };
  }, [encodedContent, title]);

  return (
    <EditorialPageFrame>
      <section className="policy-hero">
        <div className="section-kicker">{label}{t(" / Objet Décoratif")}</div>
        <h1>{title}</h1>
        <p>{t("Legal information for the Objet Décoratif store.")}</p>
        <small>{t("Legal documents are displayed in their original language.")}</small>
      </section>
      <section className="policy-layout">
        <div className="policy-index">{label}</div>
        {loadError ? (
          <p className="policy-status" role="alert">{t("The policy could not be displayed.")}</p>
        ) : content ? (
          <article
            className="policy-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="policy-status" role="status">{t("Loading policy…")}</p>
        )}
      </section>
    </EditorialPageFrame>
  );
}

function TermsPage() {
  const { t, locale } = useLanguage();
  return (
    <PolicyPage
      title={t("Terms of service")}
      label={t("Terms")}
      encodedContent={termsPolicyData}
    />
  );
}

function PrivacyPolicyPage() {
  const { t, locale } = useLanguage();
  return (
    <PolicyPage
      title={t("Privacy policy")}
      label={t("Privacy")}
      encodedContent={privacyPolicyData}
    />
  );
}

function ShippingPolicyPage() {
  const { t, locale } = useLanguage();
  return (
    <PolicyPage
      title={t("Shipping policy")}
      label={t("Shipping")}
      encodedContent={shippingPolicyData}
    />
  );
}

function ReturnsPolicyPage() {
  const { t, locale } = useLanguage();
  return (
    <PolicyPage
      title={t("Returns")}
      label={t("Returns")}
      encodedContent={returnsPolicyData}
    />
  );
}

function LegalNoticePage() {
  const { t, locale } = useLanguage();
  return (
    <PolicyPage
      title={t("Legal notice")}
      label={t("Legal")}
      encodedContent={legalNoticeData}
    />
  );
}

function ContactPage() {
  const { t, locale } = useLanguage();
  const [prepared, setPrepared] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${t("Contact")} — Objet Décoratif`;
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  const prepareEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const topic = String(form.get("topic") ?? "");
    const orderNumber = String(form.get("orderNumber") ?? "");
    const message = String(form.get("message") ?? "");
    const subject = encodeURIComponent(`${topic} — ${name}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        orderNumber ? `Order number: ${orderNumber}` : "",
        `Topic: ${topic}`,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    setPrepared(true);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <EditorialPageFrame>
      <section className="contact-hero">
        <div className="section-kicker">{t("Contact / Objet Décoratif")}</div>
        <h1>{t("Have a question")}<br />{t("or need support?")}</h1>
        <div className="contact-intro">
          <p>{t("We’re here to assist you with any inquiries about our candles, our process, or upcoming releases.")}</p>
          <p>{t("Feel free to send us a message — we respond as soon as we can.")}</p>
          <p>{t("For direct communication, you can always email us at")}{t(" ")}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </section>
      <section className="contact-layout">
        <div className="contact-aside">
          <span>{t("01 / Message")}</span>
          <p>{t("Tell us how we can help. Required fields are marked with an asterisk.")}</p>
        </div>
        <form className="contact-form" onSubmit={prepareEmail}>
          <div className="contact-form-grid">
            <label>
              <span>{t("Name *")}</span>
              <input name="name" type="text" autoComplete="name" required />
            </label>
            <label>
              <span>{t("Email *")}</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
          </div>
          <div className="contact-form-grid">
            <label>
              <span>{t("Topic *")}</span>
              <select name="topic" defaultValue="" required>
                <option value="" disabled>{t("Select a topic")}</option>
                <option value="Product question">{t("Product question")}</option>
                <option value="Order support">{t("Order support")}</option>
                <option value="Candle care">{t("Candle care")}</option>
                <option value="Press or collaboration">{t("Press or collaboration")}</option>
                <option value="Other">{t("Other")}</option>
              </select>
            </label>
            <label>
              <span>{t("Order number")}</span>
              <input
                name="orderNumber"
                type="text"
                autoComplete="off"
                placeholder={t("Optional")}
              />
            </label>
          </div>
          <label>
            <span>{t("Message *")}</span>
            <textarea name="message" rows={8} required />
          </label>
          <div className="contact-form-actions">
            <button className="solid-button" type="submit">{t("Prepare email ")}<ArrowRight size={13} />
            </button>
            <small>{t("Your email application will open with your message addressed to us.")}</small>
          </div>
          {prepared && (
            <p className="contact-status" role="status">{t("Your email application should now be open. If it did not open, write directly to")}{t(" ")}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              .
            </p>
          )}
        </form>
      </section>
    </EditorialPageFrame>
  );
}

function CarePage() {
  const { t, locale } = useLanguage();
  return (
    <EditorialPageFrame>
      <section className="care-top">
        <div className="care-video-panel">
          <video
            className="care-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/care-01-poster.jpg"
            aria-label={t("Objet Décoratif candle care")}
          >
            <source src="/videos/care-01.mp4" type="video/mp4" />
          </video>
          <span className="care-video-label">{t("Care / 01")}</span>
        </div>
        <div className="care-top-copy">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Candle care / Objet Décoratif")}</div>
            <span className="eyebrow">{t("A considered flame / Care guide")}</span>
            <h1>{t("Care for")}<br />
              <em>{t("the flame.")}</em>
            </h1>
            <p>{t("A few considered habits help every candle burn evenly, keep the vessel clean and let the perfume unfold as intended.")}</p>
            <a className="outline-button" href="#care-essentials">{t("View the essentials ")}<ArrowDown size={13} />
            </a>
          </div>
          <div className="editorial-hero-note">{t("Even burn / Clean vessel / Balanced scent")}</div>
        </div>
      </section>
      <section
        className="editorial-section care-essentials"
        id="care-essentials"
      >
        <div className="editorial-section-label">{t("01 / The essentials")}<br />
          <span>{t("Wax / Wick / Vessel")}</span>
        </div>
        <div className="editorial-section-content">
          <div className="section-kicker">{t("Care extends the ritual")}</div>
          <h2>{t("A clean, even burn starts with the wick.")}</h2>
          <div className="care-intro-copy">
            <p>{t("We tested numerous wax and wick combinations. This pairing was selected for a steady burn and balanced scent diffusion. Caring for it well helps the candle perform as intended.")}</p>
            <p>{t("Let the wax pool become fully liquid on the first burn, keep the wick centered and remove any debris before lighting. Small adjustments make a noticeable difference.")}</p>
          </div>
        </div>
        <div className="care-facts">
          <div>
            <strong>{t("5 mm")}</strong>
            <span>{t("Wick trim only after the wax has fully set.")}</span>
          </div>
          <div>
            <strong>{t("1½–2 h")}</strong>
            <span>{t("Recommended burn time for regular-sized candles.")}</span>
          </div>
          <div>
            <strong>{t("4 h")}</strong>
            <span>{t("Do not exceed four hours in one burn.")}</span>
          </div>
          <div>
            <strong>{t("10 mm")}</strong>
            <span>{t("Stop burning when this amount of wax remains.")}</span>
          </div>
        </div>
      </section>
      <section className="care-split care-steps">
        <div className="care-step-copy">
          <div className="section-kicker">{t("02 / Step by step / Wax / Wick / Vessel")}</div>
          <h2>{t("How to care")}<br />{t("for your candle.")}</h2>
          <div className="care-step-list">
            <div>
              <span>01</span>
              <div>
                <h3>{t("The first burn")}</h3>
                <p>{t("Allow the melt pool to become fully liquid and reach the edges of the refill. This establishes an even burn and helps prevent tunnelling during future use.")}</p>
              </div>
            </div>
            <div>
              <span>02</span>
              <div>
                <h3>{t("Each time you burn")}</h3>
                <p>{t("Place the candle in a well-ventilated room, away from drafts and fans. Burn regular-sized candles for 1½–2 hours at a time and never longer than four hours.")}</p>
              </div>
            </div>
            <div>
              <span>03</span>
              <div>
                <h3>{t("Care for the wick")}</h3>
                <p>{t("Keep the wax pool free from wick trimmings, matches and debris. After extinguishing, gently re-center the wick while the wax is still soft. Once fully set, trim it to approximately 5 mm.")}</p>
              </div>
            </div>
            <div>
              <span>04</span>
              <div>
                <h3>{t("Extinguish and finish")}</h3>
                <p>{t("Use the lid or a candle snuffer to extinguish the flame. Let the vessel cool before touching or moving it. Discontinue use when approximately 10 mm of wax remains at the bottom.")}</p>
              </div>
            </div>
          </div>
        </div>
        <CareImageSlideshow />
      </section>
      <section className="care-split care-safety">
        <div className="care-safety-copy">
          <div className="section-kicker">{t("03 / Safety first")}</div>
          <h2>{t("Never leave a burning candle unattended.")}</h2>
        </div>
        <div className="care-safety-list">
          <div>
            <span>01</span>
            <div>
              <h3>{t("Keep a clear space")}</h3>
              <p>{t("Keep away from children, pets and flammable materials.")}</p>
            </div>
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>{t("Use a stable surface")}</h3>
              <p>{t("Place on a stable, heat-resistant surface.")}</p>
            </div>
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>{t("Watch the flame")}</h3>
              <p>{t("Extinguish if the flame becomes unusually high or the wick moves close to the vessel wall.")}</p>
            </div>
          </div>
          <div>
            <span>04</span>
            <div>
              <h3>{t("Let the vessel cool")}</h3>
              <p>{t("Allow the vessel and wax to cool completely before handling.")}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="care-split care-closing">
        <CareImageSlideshow />
        <div className="care-closing-copy">
          <div className="section-kicker">{t("04 / Continue the ritual / Form / Scent")}</div>
          <h2>{t("Keep the vessel.")}<br />
            <em>{t("Renew the scent.")}</em>
          </h2>
          <p>{t("Once the candle is finished and the vessel has cooled completely, continue with a new refill. The object remains; only the atmosphere changes.")}</p>
          <a className="solid-button" href="/#collection">{t("Shop refills ")}<ArrowRight size={13} />
          </a>
        </div>
      </section>
    </EditorialPageFrame>
  );
}

function AboutPage() {
  const { t, locale } = useLanguage();
  return (
    <EditorialPageFrame>
      <section className="editorial-hero about-hero">
        <div className="editorial-hero-copy">
          <div className="section-kicker">{t("About / Objet Décoratif")}</div>
          <span className="eyebrow">{t("Berlin / Grasse")}</span>
          <h1>{t("Objects")}<br />
            <em>{t("with meaning.")}</em>
          </h1>
          <p>{t("A long-standing passion for interiors, transformed into handpicked objects that give a space character, permanence and quiet intention.")}</p>
          <a className="outline-button" href="#about-story">{t("Read our approach ")}<ArrowDown size={13} />
          </a>
        </div>
        <div className="editorial-hero-note">{t("Sculptural objects / Refillable by design")}</div>
      </section>
      <section className="editorial-section about-story" id="about-story">
        <div className="editorial-section-label">{t("01 / Our approach")}</div>
        <div className="editorial-section-content">
          <div className="section-kicker">{t("Curated with intention")}</div>
          <h2>{t("We do not simply inhabit spaces. We fill them with meaning.")}</h2>
          <div className="about-intro-copy">
            <p>{t("Objet Décoratif transforms a long-standing passion for interior design and decoration into handpicked, extraordinary objects. It is the result of a conscious decision: not just to inhabit spaces, but to fill them with meaning.")}</p>
            <p>{t("Our selection follows a simple rule — we curate only what we truly love ourselves. Beautiful things belong together when they share the same care, clarity and intention.")}</p>
          </div>
        </div>
        <div className="about-principles">
          <div>
            <span>01</span>
            <h3>{t("Curated with intention")}</h3>
            <p>{t("Only objects we would choose for our own spaces — considered, distinctive and made with care.")}</p>
          </div>
          <div>
            <span>02</span>
            <h3>{t("Designed to remain")}</h3>
            <p>{t("Sculptural vessels that continue beyond the first flame: objects to keep, refill and return to.")}</p>
          </div>
          <div>
            <span>03</span>
            <h3>{t("Scents from Grasse")}</h3>
            <p>{t("Our candle perfumes are developed with specialists in Grasse and selected to complement every form.")}</p>
          </div>
        </div>
      </section>
      <section className="editorial-section about-facts">
        <div className="editorial-section-label">{t("02 / Made with intention")}</div>
        <div className="editorial-section-content">
          <div className="section-kicker">{t("Berlin / Grasse")}</div>
          <h2>{t("From the atelier to the atmosphere.")}</h2>
          <div className="about-facts-grid">
            <article>
              <span>01</span>
              <h3>{t("Berlin atelier")}</h3>
              <p>{t("Each refill is hand-poured in our Berlin atelier and precisely tailored to our sculptures.")}</p>
            </article>
            <article>
              <span>02</span>
              <h3>{t("Fragrance from Grasse")}</h3>
              <p>{t("Our candle perfumes are developed with specialists in Grasse and selected to complement every form.")}</p>
            </article>
          </div>
        </div>
      </section>
      <section className="editorial-closing about-closing">
        <div className="about-closing-main">
          <div className="section-kicker">{t("The refill ritual / 02")}</div>
          <h2>{t("Keep the object.")}<br />
            <em>{t("Change the atmosphere.")}</em>
          </h2>
        </div>
        <div className="about-closing-side">
          <p>{t("Filling spaces with objects that genuinely make you want to have them — that is what we are all about. Not just for ourselves, but for everyone who knows that beauty and care in the details matter.")}</p>
          <a className="solid-button" href="/#collection">{t("Explore the forms ")}<ArrowRight size={13} />
          </a>
        </div>
      </section>
    </EditorialPageFrame>
  );
}

function SearchPanel({
  products,
  open,
  onClose,
}: {
  products: Product[];
  open: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  return (
    <div
      className={`search-panel ${open ? "open" : ""}`}
      data-testid="search-panel"
    >
      <div className="search-input">
        <Search size={17} />
        <input
          autoFocus={open}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("Search forms, scents, rituals…")}
          data-testid="input-search"
        />
        <button
          onClick={onClose}
          aria-label={t("Close search")}
          data-testid="button-close-search"
        >
          <X size={17} />
        </button>
      </div>
      <div className="search-results">
        {query ? (
          <span>
            {
              products.filter((p) =>
                `${p.name} ${p.description} ${t(p.description)}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ).length
            }{t(" ")}{t("objects found")}</span>
        ) : (
          <span>{t("Try “Barrique” or “Santal Cruz”")}</span>
        )}
      </div>
    </div>
  );
}

function ProductModal({
  product,
  initialScent,
  onClose,
  onAdd,
}: {
  product: Product | null;
  initialScent?: string;
  onClose: () => void;
  onAdd: (p: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [scent, setScent] = useState(
    initialScent ??
      product?.scentOptions?.[0]?.name ??
      product?.scents[0] ??
      "",
  );
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setScent(
      initialScent ??
        product?.scentOptions?.[0]?.name ??
        product?.scents[0] ??
        "",
    );
    setQuantity(1);
  }, [initialScent, product]);
  if (!product) return null;
  const scentOptions =
    product.scentOptions ?? product.scents.map((name) => ({ name }));
  return (
    <div
      className="quick-view open"
      role="dialog"
      aria-modal="true"
      data-testid="product-modal"
    >
      <div className="product-modal">
        {product.images ? (
          <CatalogMedia
            className="modal-product-image"
            src={product.images[0]}
            alt={`${product.name} product view`}
          />
        ) : (
          <div className={`modal-art ${product.art}`}>
            <div className="vessel">
              <div className="wax" />
              <div className="wick" />
            </div>
          </div>
        )}
        <div className="modal-copy">
          <button
            className="close-button modal-close"
            onClick={onClose}
            aria-label={t("Close product details")}
            data-testid="button-close-product"
          >
            <X size={16} />
          </button>
          <div className="section-kicker">{product.collection}{t(" collection")}</div>
          <h2>{product.name}</h2>
          <p className="modal-subtitle">{t(product.description)}</p>
          <div className="modal-price">€{product.price}{t(" EUR")}</div>
          <PriceDisclosure className="price-disclosure--modal" />
          <span className="option-label">
            {product.id === "refill"
              ? t("Choose size & scent")
              : t("Choose your scent")}
          </span>
          <div className="scent-options">
            {scentOptions.map((item) => (
              <button
                key={item.name}
                className={`scent-option ${scent === item.name ? "selected" : ""}`}
                onClick={() => setScent(item.name)}
                data-testid={`button-scent-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <span className="option-label">{t("Quantity")}</span>
          <div className="modal-buy">
            <div className="modal-quantity">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label={t("Decrease quantity")}
                data-testid="button-modal-decrease"
              >
                <Minus size={13} />
              </button>
              <span data-testid="text-modal-quantity">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label={t("Increase quantity")}
                data-testid="button-modal-increase"
              >
                <Plus size={13} />
              </button>
            </div>
            <button
              className="solid-button"
              onClick={() => {
                onAdd(product, scent, quantity);
                onClose();
              }}
              data-testid="button-add-to-cart"
            >{t("Add to cart ")}<ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  lines,
  refillProduct,
  onClose,
  onChange,
  onAdd,
}: {
  open: boolean;
  lines: CartLine[];
  refillProduct?: Product;
  onClose: () => void;
  onChange: (id: string, scent: string, delta: number) => void;
  onAdd: (product: Product, scent: string, quantity: number) => void;
}) {
  const { t, locale } = useLanguage();
  const total = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const shippingProgress = freeShippingProgress(total);
  const alreadyHasRefill = lines.some((line) => line.product.id === "refill");
  const refillScent =
    refillProduct?.scentOptions?.[0]?.name ?? refillProduct?.scents[0] ?? "";
  return (
    <>
      <div className={`overlay ${open ? "open" : ""}`} onClick={onClose} />
      <aside
        className={`cart-drawer ${open ? "open" : ""}`}
        aria-label={t("Shopping cart")}
        data-testid="cart-drawer"
      >
        <div className="drawer-head">
          <h2>{t("Your cart")}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label={t("Close cart")}
            data-testid="button-close-cart"
          >
            <X size={16} />
          </button>
        </div>
        <div className="cart-items">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <strong>{t("Your cart is quiet.")}</strong>
              <span>{t("Add a form to begin the ritual.")}</span>
            </div>
          ) : (
            lines.map((line) => (
              <div
                className="cart-item"
                key={`${line.product.id}-${t(line.scent)}`}
                data-testid={`cart-item-${line.product.id}`}
              >
                <div className="cart-thumb">
                  {line.product.images?.[0] ? (
                    <CatalogMedia
                      src={line.product.images[0]}
                      controls={false}
                      alt={`${line.product.name} product view`}
                    />
                  ) : (
                    <div className={`cart-thumb-art ${line.product.art}`}>
                      <div className="vessel">
                        <div className="wax" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="cart-item-info">
                  <strong>{line.product.name}</strong>
                  <small>{t(line.scent)}</small>
                  <div className="cart-controls">
                    <button
                      className="qty-button"
                      onClick={() => onChange(line.product.id, line.scent, -1)}
                      aria-label={t("Decrease item")}
                      data-testid={`button-decrease-${line.product.id}`}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="qty-number">{line.quantity}</span>
                    <button
                      className="qty-button"
                      onClick={() => onChange(line.product.id, line.scent, 1)}
                      aria-label={t("Increase item")}
                      data-testid={`button-increase-${line.product.id}`}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
                <span className="cart-item-price">
                  €{line.product.price * line.quantity}
                </span>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="cart-shipping-progress" data-testid="cart-shipping-progress">
              <div className="cart-shipping-progress__copy">
                {shippingProgress.reached
                  ? t("You have unlocked free shipping.")
                  : `${t("Add ")}€${shippingProgress.remaining.toFixed(2)}${t(" for free shipping.")}`}
              </div>
              <div
                className="cart-shipping-progress__track"
                role="progressbar"
                aria-label={t("Free shipping progress")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(shippingProgress.percent)}
              >
                <span style={{ width: `${shippingProgress.percent}%` }} />
              </div>
            </div>
            {refillProduct && !alreadyHasRefill && (
              <div className="cart-refill-suggestion" data-testid="cart-refill-suggestion">
                {refillProduct.images?.[0] && (
                  <CatalogMedia
                    src={refillProduct.images[0]}
                    controls={false}
                    alt={`${refillProduct.name} wax refill`}
                    loading="lazy"
                  />
                )}
                <div>
                  <span>{t("Complete the ritual")}</span>
                  <strong>{t("Add a small refill (190g)")}</strong>
                  <small>€{refillProduct.price.toFixed(2)}</small>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(refillProduct, `Small / ${refillScent}`, 1)}
                  aria-label={`${t("Add")} ${refillProduct.name}`}
                  data-testid="button-cart-add-refill"
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="total-line">
              <span>{t("Subtotal")}</span>
              <strong data-testid="text-cart-total">€{total}</strong>
            </div>
            <button
              className="solid-button full-button"
              onClick={() => {
                onClose();
                window.location.href = `${import.meta.env.BASE_URL}checkout`;
              }}
              data-testid="button-checkout"
            >{t("Continue to checkout ")}<ArrowRight size={14} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

type CheckoutForm = {
  email: string;
  country: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  phone: string;
  cardNumber: string;
  expiration: string;
  securityCode: string;
  cardName: string;
};

const emptyCheckoutForm: CheckoutForm = {
  email: "",
  country: "Germany",
  firstName: "",
  lastName: "",
  company: "",
  address: "",
  apartment: "",
  postalCode: "",
  city: "",
  phone: "",
  cardNumber: "",
  expiration: "",
  securityCode: "",
  cardName: "",
};

function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { isLoaded, isSignedIn } = useUser();
  const [lines, setLines] = useState<CartLine[]>(readStoredCart);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paypal" | "klarna"
  >("card");
  const [form, setForm] = useState<CheckoutForm>(emptyCheckoutForm);
  const [submitted, setSubmitted] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [placedAsGuest, setPlacedAsGuest] = useState(false);
  const createOrder = useCreateOrder();
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const hasAddress = Boolean(
    form.address.trim() && form.postalCode.trim() && form.city.trim(),
  );
  const shipping = hasAddress ? shippingForSubtotal(subtotal) : 0;
  const total = subtotal + shipping;
  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const showReview = () => {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const editDetails = () => {
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeCheckoutLine = (id: string, scent: string, delta: number) => {
    setLines((current) =>
      current.flatMap((line) =>
        line.product.id === id && line.scent === scent
          ? line.quantity + delta > 0
            ? [{ ...line, quantity: line.quantity + delta }]
            : []
          : [line],
      ),
    );
  };
  const removeCheckoutLine = (id: string, scent: string) => {
    setLines((current) =>
      current.filter((line) => line.product.id !== id || line.scent !== scent),
    );
  };
  const placeOrder = async () => {
    if (!isLoaded || createOrder.isPending || lines.length === 0) return;
    try {
      const order = await createOrder.mutateAsync({
        data: {
          guest: !isSignedIn,
          email: form.email,
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          company: form.company,
          address: form.address,
          apartment: form.apartment,
          postalCode: form.postalCode,
          city: form.city,
          country: form.country,
          paymentMethod,
          cardLastFour:
            paymentMethod === "card"
              ? form.cardNumber.replace(/\s/g, "").slice(-4)
              : null,
          items: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            scent: line.scent,
            quantity: line.quantity,
            unitPrice: line.product.price,
          })),
        },
      });
      setPlacedOrderNumber(order.orderNumber);
      setPlacedAsGuest(order.isGuest);
      setLines([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // React Query displays the error below; keep the cart and form for retry.
    }
  };

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  if (placedOrderNumber) {
    return (
      <div className="checkout-page checkout-empty-page">
        <header className="checkout-header">
          <Link href="/" className="checkout-logo">{t("Objet Décoratif")}</Link>
        </header>
        <main className="checkout-empty-state">
          <span className="section-kicker">{t("Order received")}</span>
          <h1>{t("Thank you.")}</h1>
          <p>{t("Your order ")}<strong>{placedOrderNumber}</strong>{t("is saved. No payment has been charged yet.")}</p>
          {placedAsGuest ? (
            <>
              <p>{t("Your guest order was received without creating an account. Please keep your order number for any questions.")}</p>
              <Link href="/" className="solid-button">{t("Return to store ")}<ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <Link href="/account" className="solid-button">{t("View my orders ")}<ArrowRight size={14} />
            </Link>
          )}
        </main>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-page checkout-empty-page">
        <header className="checkout-header">
          <Link href="/" className="checkout-logo">{t("Objet Décoratif")}</Link>
        </header>
        <main className="checkout-empty-state">
          <span className="section-kicker">{t("Checkout")}</span>
          <h1>{t("Your cart is quiet.")}</h1>
          <p>{t("Add a form before continuing to checkout.")}</p>
          <Link href="/#collection" className="solid-button">{t("Explore the collection ")}<ArrowRight size={14} />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link href="/" className="checkout-logo">{t("Objet Décoratif")}</Link>
        <Link href="/" className="checkout-back">{t("Return to store")}</Link>
      </header>
      <main className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={(event) => {
            event.preventDefault();
            showReview();
          }}
        >
          {!submitted && (
            <>
              <section className="checkout-section checkout-express">
                <span className="checkout-overline">{t("Express checkout")}</span>
                <div className="express-buttons">
                  <button type="button" className="express-button shop-pay">{t("shop")}</button>
                  <button type="button" className="express-button paypal-pay">{t("PayPal")}</button>
                  <button type="button" className="express-button gpay">
                    <span className="gpay-mark">{t("G")}</span>{t(" Pay")}
                  </button>
                </div>
                <div className="checkout-or">
                  <span>{t("OR")}</span>
                </div>
              </section>

              <section className="checkout-section">
                <h2>{t("Contact")}</h2>
                <Show when="signed-out">
                  <div className="checkout-review-notice" data-testid="guest-checkout-notice">
                    <strong>{t("Guest checkout — no registration required.")}</strong>
                    <span>{t("Enter your contact and delivery details to order as a guest. Already have an account? ")}<Link href="/sign-in">{t("Sign in")}</Link>.
                    </span>
                  </div>
                </Show>
                <label className="checkout-field">
                  <span className="sr-only">{t("Email")}</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder={t("Email")}
                    autoComplete="email"
                  />
                  <span className="field-help">?</span>
                </label>
                <label className="checkout-checkbox">
                  <input type="checkbox" />{t(" ")}
                  <span>{t("Email me with news and offers")}</span>
                </label>
              </section>

              <section className="checkout-section">
                <h2>{t("Delivery")}</h2>
                <label className="checkout-field checkout-select">
                  <span>{t("Country/Region")}</span>
                  <select
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    autoComplete="country"
                  >
                    <option value="Germany">{t("Germany")}</option>
                    <option value="Austria">{t("Austria")}</option>
                    <option value="Switzerland">{t("Switzerland")}</option>
                    <option value="France">{t("France")}</option>
                    <option value="United Kingdom">{t("United Kingdom")}</option>
                  </select>
                </label>
                <div className="checkout-field-grid">
                  <label className="checkout-field">
                    <span className="sr-only">{t("First name")}</span>
                    <input
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        updateField("firstName", event.target.value)
                      }
                      placeholder={t("First name")}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="sr-only">{t("Last name")}</span>
                    <input
                      required
                      value={form.lastName}
                      onChange={(event) =>
                        updateField("lastName", event.target.value)
                      }
                      placeholder={t("Last name")}
                      autoComplete="family-name"
                    />
                  </label>
                </div>
                <label className="checkout-field">
                  <span className="sr-only">{t("Company")}</span>
                  <input
                    value={form.company}
                    onChange={(event) =>
                      updateField("company", event.target.value)
                    }
                    placeholder={t("Company (optional)")}
                    autoComplete="organization"
                  />
                </label>
                <label className="checkout-field">
                  <span className="sr-only">{t("Address")}</span>
                  <input
                    required
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder={t("Address")}
                    autoComplete="street-address"
                  />
                  <Search size={15} />
                </label>
                <label className="checkout-field">
                  <span className="sr-only">{t("Apartment, suite, etc.")}</span>
                  <input
                    value={form.apartment}
                    onChange={(event) =>
                      updateField("apartment", event.target.value)
                    }
                    placeholder={t("Apartment, suite, etc. (optional)")}
                    autoComplete="address-line2"
                  />
                </label>
                <div className="checkout-field-grid">
                  <label className="checkout-field">
                    <span className="sr-only">{t("Postal code")}</span>
                    <input
                      required
                      value={form.postalCode}
                      onChange={(event) =>
                        updateField("postalCode", event.target.value)
                      }
                      placeholder={t("Postal code")}
                      autoComplete="postal-code"
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="sr-only">{t("City")}</span>
                    <input
                      required
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      placeholder={t("City")}
                      autoComplete="address-level2"
                    />
                  </label>
                </div>
                <label className="checkout-field">
                  <span className="sr-only">{t("Phone")}</span>
                  <input
                    required
                    type="tel"
                    minLength={6}
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder={t("Phone")}
                    autoComplete="tel"
                  />
                  <span className="field-help">?</span>
                </label>
              </section>

              <section className="checkout-section checkout-shipping">
                <h2>{t("Shipping method")}</h2>
                <div className="shipping-notice">
                  {hasAddress
                    ? t("Standard delivery · 3–5 working days")
                    : t("Enter your shipping address to view available shipping methods.")}
                </div>
              </section>

              <section className="checkout-section checkout-payment">
                <h2>{t("Payment")}</h2>
                <p className="payment-note">{t("All transactions are secure and encrypted.")}</p>
                <div className="payment-methods">
                  <div
                    className={`payment-method ${paymentMethod === "card" ? "selected" : ""}`}
                  >
                    <button
                      type="button"
                      className="payment-method-toggle"
                      onClick={() => setPaymentMethod("card")}
                    >
                      <span className="payment-radio" />
                      <strong>{t("Credit card")}</strong>
                      <span className="card-brands">
                        <b>{t("VISA")}</b>
                        <b className="mastercard">●●</b>
                        <b className="amex">{t("MC")}</b>
                        <b>+2</b>
                      </span>
                    </button>
                    {paymentMethod === "card" && (
                      <div className="card-fields">
                        <label className="checkout-field">
                          <span className="sr-only">{t("Card number")}</span>
                          <input
                            required
                            value={form.cardNumber}
                            onChange={(event) =>
                              updateField("cardNumber", event.target.value)
                            }
                            placeholder={t("Card number")}
                            autoComplete="cc-number"
                          />
                          <span className="field-lock">▢</span>
                        </label>
                        <div className="checkout-field-grid">
                          <label className="checkout-field">
                            <span className="sr-only">{t("Expiration date")}</span>
                            <input
                              required
                              value={form.expiration}
                              onChange={(event) =>
                                updateField("expiration", event.target.value)
                              }
                              placeholder={t("Expiration date (MM / YY)")}
                              autoComplete="cc-exp"
                            />
                          </label>
                          <label className="checkout-field">
                            <span className="sr-only">{t("Security code")}</span>
                            <input
                              required
                              value={form.securityCode}
                              onChange={(event) =>
                                updateField("securityCode", event.target.value)
                              }
                              placeholder={t("Security code")}
                              autoComplete="cc-csc"
                            />
                            <span className="field-help">?</span>
                          </label>
                        </div>
                        <label className="checkout-field">
                          <span className="sr-only">{t("Name on card")}</span>
                          <input
                            required
                            value={form.cardName}
                            onChange={(event) =>
                              updateField("cardName", event.target.value)
                            }
                            placeholder={t("Name on card")}
                            autoComplete="cc-name"
                          />
                        </label>
                        <label className="checkout-checkbox billing-checkbox">
                          <input type="checkbox" defaultChecked />{t(" ")}
                          <span>{t("Use shipping address as billing address")}</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`payment-method payment-method-option ${paymentMethod === "paypal" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("paypal")}
                  >
                    <span className="payment-radio" />
                    <strong>{t("PayPal")}</strong>
                    <b className="paypal-logo">{t("PayPal")}</b>
                  </button>
                  <button
                    type="button"
                    className={`payment-method payment-method-option ${paymentMethod === "klarna" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("klarna")}
                  >
                    <span className="payment-radio" />
                    <strong>{t("Klarna")}</strong>
                    <b className="klarna-logo">{t("Klarna")}</b>
                  </button>
                </div>
              </section>

              <button className="checkout-review-button" type="submit">{t("Review order")}</button>
            </>
          )}

          {submitted && (
            <section
              className="checkout-review"
              aria-labelledby="checkout-review-title"
            >
              <div className="checkout-review-heading">
                <div>
                  <span className="checkout-overline">{t("Final check")}</span>
                  <h1 id="checkout-review-title">{t("Review your order")}</h1>
                </div>
                <button
                  type="button"
                  className="checkout-edit-button"
                  onClick={editDetails}
                >{t("Edit details")}</button>
              </div>

              <div className="checkout-review-block">
                <h2>{t("Items")}</h2>
                <div className="checkout-review-items">
                  {lines.map((line) => (
                    <div key={`${line.product.id}-${t(line.scent)}`}>
                      <span>
                        <strong>{line.product.name}</strong>
                        <small>
                          {t(line.scent)}{t(" · Quantity ")}{line.quantity}
                        </small>
                      </span>
                      <b>€{(line.product.price * line.quantity).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="checkout-review-grid">
                <div className="checkout-review-block">
                  <h2>{t("Contact")}</h2>
                  <p>{form.email}</p>
                  <p>{form.phone}</p>
                </div>
                <div className="checkout-review-block">
                  <h2>{t("Ship to")}</h2>
                  <p>
                    {form.firstName} {form.lastName}
                  </p>
                  {form.company && <p>{form.company}</p>}
                  <p>
                    {form.address}
                    {form.apartment ? `, ${form.apartment}` : t("")}
                  </p>
                  <p>
                    {form.postalCode} {form.city}
                  </p>
                  <p>{t(form.country)}</p>
                </div>
                <div className="checkout-review-block">
                  <h2>{t("Shipping")}</h2>
                  <p>{t("Standard delivery")}</p>
                  <p>
                    {shipping === 0
                      ? t("Free shipping")
                      : `${t("3–5 working days · €")}${shipping.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
                <div className="checkout-review-block">
                  <h2>{t("Payment")}</h2>
                  <p>
                    {paymentMethod === "card"
                      ? `Credit card ending in ${form.cardNumber.replace(/\s/g, "").slice(-4)}`
                      : paymentMethod === "paypal"
                        ? t("PayPal")
                        : t("Klarna")}
                  </p>
                  {paymentMethod === "card" && <p>{form.cardName}</p>}
                </div>
              </div>

              <div className="checkout-review-total">
                <div>
                  <span>{t("Subtotal")}</span>
                  <b>€{subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
                <div>
                  <span>{t("Shipping")}</span>
                  <b>€{shipping.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
                <div>
                  <strong>{t("Total")}</strong>
                  <strong>{t("EUR €")}{total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
              <PriceDisclosure className="price-disclosure--checkout" />

              <div className="checkout-review-notice" role="status">
                <strong>{t("No payment will be charged.")}</strong>
                <span>{t("Your order will be saved for the shop team")}{isSignedIn ? t(" and your account") : t("")}{t(". Payment and SMS are not connected.")}</span>
              </div>
                <button
                  className="checkout-review-button"
                  type="button"
                  disabled={!isLoaded || createOrder.isPending}
                  onClick={placeOrder}
                  data-testid="button-place-order"
                >
                  {!isLoaded
                    ? t("Loading checkout…")
                    : createOrder.isPending
                      ? t("Saving order…")
                      : isSignedIn
                        ? t("Place order")
                        : t("Place order as guest")}
                </button>
              {createOrder.isError && (
                <p className="checkout-order-error">{t("The order could not be saved. Please try again.")}</p>
              )}
              <button
                className="checkout-edit-secondary"
                type="button"
                onClick={editDetails}
              >{t("Return to checkout details")}</button>
            </section>
          )}

          <nav
            className="checkout-footer-links"
            aria-label={t("Checkout information")}
          >
            <Link href="/returns" target="_blank" rel="noopener noreferrer">{t("Refund policy")}</Link>
            <Link
              href="/shipping-policy"
              target="_blank"
              rel="noopener noreferrer"
            >{t("Shipping")}</Link>
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >{t("Privacy policy")}</Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer">{t("Terms of service")}</Link>
            <Link
              href="/legal-notice"
              target="_blank"
              rel="noopener noreferrer"
            >{t("Legal notice")}</Link>
            <Link href="/contact" target="_blank" rel="noopener noreferrer">{t("Contact")}</Link>
            <a href="#cookies">{t("Cookies")}</a>
          </nav>
        </form>

        <aside className="checkout-summary" aria-label={t("Order summary")}>
          <div className="checkout-summary-inner">
            <div className="checkout-summary-items">
              {lines.map((line) => (
                <div
                  className="checkout-summary-item"
                  key={`${line.product.id}-${t(line.scent)}`}
                >
                  <div className="checkout-summary-thumb">
                    {line.product.images?.[0] ? (
                      <CatalogMedia
                        src={line.product.images[0]}
                        controls={false}
                        alt={`${line.product.name} product view`}
                      />
                    ) : (
                      <div className={`cart-thumb-art ${line.product.art}`}>
                        <div className="vessel">
                          <div className="wax" />
                        </div>
                      </div>
                    )}
                    <span>{line.quantity}</span>
                  </div>
                  <div className="checkout-summary-item-info">
                    <strong>{line.product.name}</strong>
                    <small>{t(line.scent)}</small>
                    <div className="checkout-summary-actions">
                      <div
                        className="checkout-quantity"
                        aria-label={`Quantity for ${line.product.name}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            changeCheckoutLine(line.product.id, line.scent, -1)
                          }
                          aria-label={`Decrease ${line.product.name} quantity`}
                        >
                          <Minus size={10} />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            changeCheckoutLine(line.product.id, line.scent, 1)
                          }
                          aria-label={`Increase ${line.product.name} quantity`}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="checkout-remove-item"
                        onClick={() =>
                          removeCheckoutLine(line.product.id, line.scent)
                        }
                      >{t("Remove")}</button>
                    </div>
                  </div>
                  <b>€{(line.product.price * line.quantity).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
              ))}
            </div>
            <div className="checkout-total-lines">
              <div>
                <span>{t("Subtotal")}</span>
                <b>€{subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              </div>
              <div>
                <span>{t("Shipping ")}<small>?</small>
                </span>
                <span className={hasAddress ? "" : "checkout-muted"}>
                  {hasAddress
                    ? `€${shipping.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : t("Enter shipping address")}
                </span>
              </div>
              <div className="checkout-grand-total">
                <strong>{t("Total")}</strong>
                <b>
                  <small>{t("EUR")}</small> €{total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
              </div>
            </div>
            <PriceDisclosure className="price-disclosure--checkout" />
          </div>
        </aside>
      </main>
    </div>
  );
}

function Store({ productSlug }: { productSlug?: string } = {}) {
  const { t, locale } = useLanguage();
  const { products, scents, isLoading } = useCatalogFrontend();
  const productPage = productSlug
    ? products.find((product) => product.id === productSlug)
    : undefined;
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<{
    product: Product;
    scent: string;
  } | null>(null);
  const [cart, setCart] = useState<CartLine[]>(readStoredCart);
  const [subscribed, setSubscribed] = useState(false);
  const handledDirectAdd = useRef(false);
  const addToCart = useCallback(
    (product: Product, scent: string, quantity: number) => {
      setCart((current) => {
        const found = current.find(
          (line) => line.product.id === product.id && line.scent === scent,
        );
        if (found)
          return current.map((line) =>
            line === found
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          );
        return [...current, { product, scent, quantity }];
      });
      setCartOpen(true);
    },
    [],
  );
  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (isLoading) return;
    updateStorePageSeo(productPage, locale, t);
  }, [isLoading, productPage, locale, t]);
  useEffect(() => {
    if (isLoading || productSlug) return;
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("product");
    if (!requestedId) return;
    const requestedProduct = products.find((product) => product.id === requestedId);
    if (!requestedProduct) return;
    if (params.get("add") === "1") {
      if (handledDirectAdd.current) return;
      handledDirectAdd.current = true;
      const requestedScent = params.get("scent");
      const choices = requestedProduct.scentOptions?.map((scent) => scent.name) ??
        requestedProduct.scents;
      const scent =
        requestedScent && choices.includes(requestedScent)
          ? requestedScent
          : choices[0] ?? "";
      const requestedSize = params.get("size");
      const size = requestedSize === "Big" ? "Big" : "Small";
      const variant =
        requestedProduct.id === "refill" ? `${size} / ${scent}` : scent;
      addToCart(requestedProduct, variant, 1);
      const cleanUrl = new URL(window.location.href);
      ["add", "product", "scent", "size"].forEach((key) =>
        cleanUrl.searchParams.delete(key),
      );
      window.history.replaceState(
        {},
        "",
        `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
      );
      return;
    }
    setSelected({
      product: requestedProduct,
      scent: requestedProduct.scentOptions?.[0]?.name ?? requestedProduct.scents[0] ?? "",
    });
  }, [addToCart, isLoading, productSlug, products]);
  if (isLoading)
    return (
      <div className="store-shell">
        <div className="flex h-screen items-center justify-center">{t("Loading...")}</div>
      </div>
    );
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const changeCart = (id: string, scent: string, delta: number) =>
    setCart((current) =>
      current.flatMap((line) =>
        line.product.id === id && line.scent === scent
          ? line.quantity + delta > 0
            ? [{ ...line, quantity: line.quantity + delta }]
            : []
          : [line],
      ),
    );
  return (
    <div className="store-shell">
      <Header
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        onSearch={() => setSearchOpen((open) => !open)}
      />
      <SearchPanel
        products={products}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      {productSlug ? (
        productPage ? (
          <ProductDetailPage
            product={productPage}
            onBuy={(product, scent) => addToCart(product, scent, 1)}
          />
        ) : (
          <NotFound />
        )
      ) : (
        <main>
          <Hero
            product={products.find((item) => item.id === "elephant") ?? products.find((item) => item.id === "boite") ?? products[0]}
            onExplore={() =>
              document
                .getElementById("collection")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          />
          <section className="intro-strip">
            <div className="intro-item">
              <span className="intro-number">{t("01 / Form")}</span>
              <h2>{t("Cast in concrete.")}<br />{t("Built to last.")}</h2>
              <p>{t("Quiet architecture for the everyday.")}</p>
            </div>
            <div className="intro-item">
              <span className="intro-number">{t("02 / Scent")}</span>
              <h2>{t("Four fragrances.")}</h2>
              <p>{t("Endlessly renewable, never overpowering.")}</p>
            </div>
            <div className="intro-item">
              <span className="intro-number">{t("03 / Ritual")}</span>
              <h2>{t("Burn. Refill.")}<br />{t("Repeat.")}</h2>
              <p>{t("One beautiful object, many lives.")}</p>
            </div>
          </section>
          <Collection
            products={products}
            scents={scents}
            onAdd={addToCart}
          />
          <section className="newsletter" id="newsletter">
            <h2>{t("Notes from the studio.")}</h2>
            {subscribed ? (
              <span className="success-note">{t("You’re on the list. See you soon.")}</span>
            ) : (
              <form
                className="newsletter-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubscribed(true);
                }}
              >
                <input
                  type="email"
                  required
                  placeholder={t("Your email address")}
                  aria-label={t("Your email address")}
                  data-testid="input-newsletter"
                />
                <button type="submit" data-testid="button-subscribe">{t("Subscribe ")}<ArrowRight size={13} />
                </button>
              </form>
            )}
          </section>
        </main>
      )}
      <Footer />
      <ProductModal
        product={selected?.product ?? null}
        initialScent={selected?.scent}
        onClose={() => setSelected(null)}
        onAdd={addToCart}
      />
      <CartDrawer
        open={cartOpen}
        lines={cart}
        refillProduct={products.find((product) => product.id === "refill")}
        onClose={() => setCartOpen(false)}
        onChange={changeCart}
        onAdd={addToCart}
      />
    </div>
  );
}

function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <EditorialPageFrame>
      <section className="auth-hero">
        {mode === "sign-in" ? (
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
          />
        ) : (
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
          />
        )}
      </section>
    </EditorialPageFrame>
  );
}

function AccountContent() {
  const { t, locale } = useLanguage();
  const me = useGetMe();
  const orders = useListMyOrders();
  return (
    <EditorialPageFrame>
      <section className="editorial-hero care-hero">
        <div className="editorial-hero-copy">
          <div className="section-kicker">{t("Account / Objet Décoratif")}</div>
          <span className="eyebrow">{me.data?.name || me.data?.email}</span>
          <h1>{t("My")}<br />
            <em>{t("orders.")}</em>
          </h1>
          <p>{t("Review your saved orders and continue the ritual.")}</p>
          <div className="account-hero-actions">
            {me.data?.role === "admin" && (
              <Link href="/admin" className="outline-button">{t("Admin dashboard ")}<ArrowRight size={13} />
              </Link>
            )}
            <UserButton />
            <LogoutButton className="outline-button" testId="button-logout-account" />
          </div>
        </div>
        <div className="editorial-hero-note">{t("Customer Account / History")}</div>
      </section>

      <section className="editorial-section">
        <div className="editorial-section-label">{t("01 / Order history")}<br />
          <span>{t("Saved objects")}</span>
        </div>
        <div className="editorial-section-content">
          <div className="section-kicker">{t("Saved orders")}</div>
          <h2>{t("Forms & Refills")}</h2>

          {orders.isLoading && <p>{t("Loading orders…")}</p>}
          {orders.data?.length === 0 && (
            <div className="account-empty-state">
              <p>{t("No orders have been saved yet.")}</p>
            </div>
          )}

          <div className="account-orders-list">
            {orders.data?.map((order) => (
              <article key={order.id} className="account-order-row">
                <div className="account-order-meta">
                  <strong>{order.orderNumber}</strong>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString(locale)}
                  </span>
                  <span className={`order-status order-status-${t(order.status)}`}>
                    {t(order.status)}
                  </span>
                </div>
                <div className="account-order-items">
                  {order.items.map((item) => (
                    <span key={item.id}>
                      {item.quantity} × {item.name} · {t(item.scent)}
                    </span>
                  ))}
                </div>
                <b className="account-order-total">€{order.total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              </article>
            ))}
          </div>
        </div>
      </section>
    </EditorialPageFrame>
  );
}

function AccountPage() {
  const { t, locale } = useLanguage();
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded)
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>{t("Loading account…")}</p>
        </main>
      </EditorialPageFrame>
    );

  if (!isSignedIn) {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero about-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Account / Objet Décoratif")}</div>
            <h1>{t("Please")}<br />
              <em>{t("sign in.")}</em>
            </h1>
            <p>{t("Access your saved orders and continue the ritual.")}</p>
            <div className="account-hero-actions">
              <Link href="/sign-in" className="outline-button">{t("Sign in ")}<ArrowRight size={13} />
              </Link>
            </div>
          </div>
          <div className="editorial-hero-note">{t("Customer Account")}</div>
        </section>
      </EditorialPageFrame>
    );
  }

  return <AccountContent />;
}

function OrderDetailDrawer({
  order,
  onClose,
  isDemo = false,
}: {
  order: Order | null;
  onClose: () => void;
  isDemo?: boolean;
}) {
  const { t, locale } = useLanguage();
  if (!order) return null;

  const getGermanStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "new":
      case "processing":
        return "Bestellt";
      case "shipped":
        return "In Zustellung";
      case "completed":
        return "Geliefert";
      case "cancelled":
        return "Storniert";
      default:
        return status;
    }
  };

  return (
    <>
      <div
        className={`overlay ${order ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer order-detail-drawer ${order ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("Order Details")}
      >
        <div className="drawer-head">
          <h2>{t("Order ")}{order.orderNumber}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label={t("Close order details")}
            type="button"
          >
            <X size={15} />
          </button>
        </div>
        <div className="order-detail-content">
          {isDemo && (
            <p className="admin-demo-notice">{t("Demo-Bestellung · Nur Vorschau. Keine echte Bestellung oder Zahlung.")}</p>
          )}
          <div className="order-detail-grid">
            <div className="order-detail-section">
              <span className="order-detail-section-title">{t("Order Info")}</span>
              <p className="order-detail-text">
                <strong>{t("Date:")}</strong>{t(" ")}
                {new Date(order.createdAt).toLocaleDateString(locale)}
                <br />
                <strong>{t("Status:")}</strong> {getGermanStatusLabel(order.status)}
              </p>
            </div>

            <div className="order-detail-section">
              <span className="order-detail-section-title">{t("Customer")}</span>
              <p className="order-detail-text">
                <strong>{order.customerName}</strong>
                <br />
                {order.customerEmail}
                <br />
                {order.phone}
              </p>
            </div>

            <div className="order-detail-section">
              <span className="order-detail-section-title">{t("Delivery Address")}</span>
              <p
                className="order-detail-text"
                style={{ whiteSpace: "pre-line" }}
              >
                {order.address}
              </p>
            </div>

            <div className="order-detail-section">
              <span className="order-detail-section-title">{t("Payment Method")}</span>
              <p
                className="order-detail-text"
                style={{ textTransform: "capitalize" }}
              >
                {order.paymentMethod === "manual"
                  ? t("Payment requested separately")
                  : order.paymentMethod}
              </p>
            </div>

            <div className="order-detail-items">
              <span className="order-detail-section-title">{t("Items")}</span>
              {order.items.map((item) => (
                <div key={item.id} className="order-detail-item">
                  <div className="order-detail-item-info">
                    <strong>{item.name}</strong>
                    <small>{t(item.scent)}</small>
                    <small>{t("Qty: ")}{item.quantity} × €{item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </small>
                  </div>
                  <span className="order-detail-item-price">
                    €{item.lineTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="order-detail-totals">
              <div className="order-detail-total-row">
                <span>{t("Subtotal")}</span>
                <span>€{order.subtotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="order-detail-total-row">
                <span>{t("Shipping")}</span>
                <span>€{order.shipping.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="order-detail-total-row grand-total">
                <span>{t("Total")}</span>
                <span>€{order.total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminContent() {
  const { t, locale } = useLanguage();
  const me = useGetMe();
  const orders = useListAdminOrders();
  const users = useListAdminUsers();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<{
    order: Order;
    isDemo: boolean;
  } | null>(null);

  const changeStatus = async (id: number, status: OrderStatus) => {
    await updateStatus.mutateAsync({ id, data: { status } });
    await orders.refetch();
  };

  const getGermanStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "new":
      case "processing":
        return "Bestellt";
      case "shipped":
        return "In Zustellung";
      case "completed":
        return "Geliefert";
      case "cancelled":
        return "Storniert";
      default:
        return status;
    }
  };

  if (me.isLoading)
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>{t("Loading…")}</p>
        </main>
      </EditorialPageFrame>
    );

  if (me.data?.role !== "admin") {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Administration / Objet Décoratif")}</div>
            <h1>{t("Admin access")}<br />
              <em>{t("required.")}</em>
            </h1>
            <div className="account-hero-actions">
              <Link href="/account" className="outline-button">{t("Return to account ")}<ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </EditorialPageFrame>
    );
  }

  const revenue =
    orders.data
      ?.filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0) ?? 0;

  return (
    <>
      <EditorialPageFrame>
        <section className="editorial-hero about-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Administration / Objet Décoratif")}</div>
            <span className="eyebrow">{me.data?.name || me.data?.email}</span>
            <h1>{t("Admin")}<br />
              <em>{t("dashboard.")}</em>
            </h1>
            <p>{t("Manage customers and fulfillment across the store.")}</p>
            <div className="account-hero-actions">
              <Link href="/admin/catalog" className="solid-button">{t("Catalog CMS ")}<ArrowRight size={13} />
              </Link>
              <Link href="/account" className="outline-button">{t("Customer view ")}<ArrowRight size={13} />
              </Link>
              <UserButton />
            </div>
          </div>
          <div className="editorial-hero-note">{t("Orders: ")}{orders.data?.length ?? 0}{t(" / Revenue: €")}{revenue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">{t("01 / Store overview")}<br />
            <span>{t("Fulfilment & Customers")}</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">{t("Store metrics")}</div>
            <h2>{t("Overview")}</h2>
            <div className="admin-metrics">
              <div className="admin-metric">
                <span>{t("Orders")}</span>
                <strong>{orders.data?.length ?? 0}</strong>
              </div>
              <div className="admin-metric">
                <span>{t("Customers")}</span>
                <strong>
                  {users.data?.filter((user) => user.role === "customer")
                    .length ?? 0}
                </strong>
              </div>
              <div className="admin-metric">
                <span>{t("Order value")}</span>
                <strong>€{revenue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">{t("02 / All orders")}<br />
            <span>{t("Fulfilment")}</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">{t("Order management")}</div>
            <h2>{t("All orders")}</h2>
            <div className="admin-orders-list">
              <div className="admin-orders-header">
                <span>{t("Order")}</span>
                <span>{t("Customer")}</span>
                <span>{t("Items")}</span>
                <span>{t("Total")}</span>
                <span>{t("Status")}</span>
              </div>
              {orders.data?.map((order) => (
                <div
                  key={order.id}
                  className="admin-order-row"
                  onClick={() => setSelectedOrder({ order, isDemo: false })}
                  data-testid={`row-order-${order.id}`}
                >
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString(locale)}
                    </small>
                  </div>
                  <div>
                    <span className="admin-customer-name">
                      {order.customerName}
                    </span>
                    <small>{order.customerEmail}</small>
                    {order.isGuest && <small>{t("Guest order")}</small>}
                  </div>
                  <div>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div>€{order.total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      className="admin-status-select"
                      value={
                        order.status === "new" ? "processing" : order.status
                      }
                      onChange={(event) =>
                        changeStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                      data-testid={`select-status-${order.id}`}
                    >
                      <option value="processing">{t("Bestellt")}</option>
                      <option value="shipped">{t("In Zustellung")}</option>
                      <option value="completed">{t("Geliefert")}</option>
                      <option value="cancelled">{t("Storniert")}</option>
                    </select>
                  </div>
                </div>
              ))}
              <div className="admin-demo-heading">
                <span className="admin-demo-label">{t("Demo · Nur Vorschau")}</span>
                <p>{t("Beispielbestellungen – nicht in Umsatz und Kennzahlen enthalten.")}</p>
              </div>
              {demoOrders.map((order) => (
                <div
                  key={order.orderNumber}
                  className="admin-order-row admin-demo-row"
                  onClick={() => setSelectedOrder({ order, isDemo: true })}
                  data-testid={`row-demo-order-${order.orderNumber}`}
                >
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString(locale)}
                    </small>
                  </div>
                  <div>
                    <span className="admin-customer-name">
                      {order.customerName}
                    </span>
                    <small>{order.customerEmail}</small>
                  </div>
                  <div>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div>€{order.total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div>
                    <span className="admin-demo-status">
                      {getGermanStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">{t("03 / Users")}<br />
            <span>{t("Accounts")}</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">{t("Customer management")}</div>
            <h2>{t("All users")}</h2>
            <div className="admin-users-list">
              {users.data?.map((user) => (
                <div key={user.id} className="admin-user-row">
                  <div className="admin-user-info">
                    <strong>{user.name || "Unnamed customer"}</strong>
                    <small>
                      {user.email} · {user.role}
                    </small>
                  </div>
                  <div className="admin-user-stats">
                    <span>{user.orderCount}{t(" orders")}</span>
                    <b>€{user.totalSpent.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                  </div>
                </div>
              ))}
              <div className="admin-demo-heading">
                <span className="admin-demo-label">{t("Demo · Nur Vorschau")}</span>
                <p>{t("Beispielkunden – keine echten Nutzerkonten.")}</p>
              </div>
              {demoUsers.map((user) => (
                <div key={user.id} className="admin-user-row admin-demo-row">
                  <div className="admin-user-info">
                    <strong>{user.name}</strong>
                    <small>{user.email}{t(" · Demo-Kunde")}</small>
                  </div>
                  <div className="admin-user-stats">
                    <span>{user.orderCount}{t(" Demo-Bestellungen")}</span>
                    <b>€{user.totalSpent.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{t(" Demo")}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </EditorialPageFrame>
      <OrderDetailDrawer
        order={selectedOrder?.order ?? null}
        isDemo={selectedOrder?.isDemo}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}
function AdminPage() {
  const { t, locale } = useLanguage();
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded)
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>{t("Loading administration…")}</p>
        </main>
      </EditorialPageFrame>
    );

  if (!isSignedIn) {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Administration / Objet Décoratif")}</div>
            <h1>{t("Please")}<br />
              <em>{t("sign in.")}</em>
            </h1>
            <div className="account-hero-actions">
              <Link href="/sign-in" className="outline-button">{t("Sign in ")}<ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </EditorialPageFrame>
    );
  }

  return <AdminContent />;
}

function AdminCatalogPage() {
  const { t, locale } = useLanguage();
  const { isLoaded, isSignedIn } = useUser();
  const me = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn, retry: false },
  });

  if (!isLoaded || (isSignedIn && me.isLoading)) {
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>{t("Loading administration…")}</p>
        </main>
      </EditorialPageFrame>
    );
  }

  if (!isSignedIn || me.data?.role !== "admin") {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">{t("Administration / Objet Décoratif")}</div>
            <h1>{t("Admin access")}<br />
              <em>{t("required.")}</em>
            </h1>
            <div className="account-hero-actions">
              <Link
                href={!isSignedIn ? "/sign-in" : "/account"}
                className="outline-button"
              >
                {!isSignedIn ? t("Sign in") : t("Return")} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </EditorialPageFrame>
    );
  }

  return (
    <EditorialPageFrame>
      <CatalogCms />
    </EditorialPageFrame>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/produkte/:slug">
          {(params) => <Store productSlug={params.slug} />}
        </Route>
        <Route path="/">
          {() => <Store />}
        </Route>
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/sign-in/*?">{() => <AuthPage mode="sign-in" />}</Route>
        <Route path="/sign-up/*?">{() => <AuthPage mode="sign-up" />}</Route>
        <Route path="/account" component={AccountPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/catalog" component={AdminCatalogPage} />
        <Route path="/care" component={CarePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/shipping-policy" component={ShippingPolicyPage} />
        <Route path="/returns" component={ReturnsPolicyPage} />
        <Route path="/legal-notice" component={LegalNoticePage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(hash);
        if (!target) return;
        target.scrollIntoView({ behavior: "auto", block: "start" });
        target.classList.remove("nav-target-fade");
        window.requestAnimationFrame(() => {
          target.classList.add("nav-target-fade");
          window.setTimeout(
            () => target.classList.remove("nav-target-fade"),
            900,
          );
        });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
