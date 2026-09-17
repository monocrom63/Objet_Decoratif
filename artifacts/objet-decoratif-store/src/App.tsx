import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Menu, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

type ProductCollection = 'Barrique' | 'Milano' | 'Boite' | 'Chateu' | 'Elephant' | 'Sakura' | 'Refill';
type Product = {
  id: string;
  name: string;
  collection: ProductCollection;
  description: string;
  explanation: string;
  price: number;
  art: string;
  tag?: string;
  scents: string[];
  images?: string[];
  scentOptions?: ScentOption[];
};
type CartLine = { product: Product; scent: string; quantity: number };
type ScentOption = {
  name: string;
  notes: string;
  description: string;
  image?: string;
};

const imagePath = (fileName: string) =>
  `${import.meta.env.BASE_URL}images/products/${fileName}`;

const careImagePath = (fileName: string) =>
  `${import.meta.env.BASE_URL}images/care/${fileName}`;

const careImages = [
  { src: careImagePath('care-01.webp'), alt: 'Refill being placed into a sculptural candle vessel' },
  { src: careImagePath('care-02.webp'), alt: 'Candle vessel viewed from above with a wooden wick' },
];

const milanoScents: ScentOption[] = [
  {
    name: 'Thé',
    notes: 'Bergamot / Mate tea / Green tea / Clove',
    description:
      'Rose, lavandin and tea leaves open into patchouli, cedarwood and woody amber.',
    image: imagePath('the-scent.webp'),
  },
  {
    name: 'Santal Cruz',
    notes: 'Cardamom / Frankincense / Sandalwood',
    description:
      'Myrtle, jasmine and white florals rest on sandalwood, amber and vanilla.',
    image: imagePath('santal-cruz-scent.webp'),
  },
  {
    name: 'Tropicale',
    notes: 'Passion fruit / Citrus / Pepper / Clove',
    description:
      'Passion fruit and citrus brighten a heart of pepper and clove, grounded by guaiac wood and cedar.',
    image: imagePath('tropicale-scent.webp'),
  },
  {
    name: 'Cedar Salad',
    notes: 'Ginger / Gurjum / Alaskan cedar',
    description:
      'Iris root, violet blossom and vanilla lead into Atlas cedar and Virginia cedar.',
    image: imagePath('cedar-salad-scent.webp'),
  },
];

const products: Product[] = [
  {
    id: 'barrique',
    name: 'Barrique',
    collection: 'Barrique',
    description: 'Compact, soft and perfectly balanced',
    explanation:
      'A compact concrete form with a soft silhouette. Barrique is made to stay on the shelf between burns and return to the ritual whenever you need it.',
    price: 68,
    art: 'art-barrique',
    tag: 'The original',
    images: [
      imagePath('barrique-01.webp'),
      imagePath('barrique-02.webp'),
      imagePath('barrique-03.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'milano',
    name: 'Milano',
    collection: 'Milano',
    description: 'A taller study in quiet proportion',
    explanation:
      'Milano is a taller, architectural vessel with a hand-finished grid texture. Choose the atmosphere, light the form, and refill it when the wax is gone.',
    price: 82,
    art: 'art-milano',
    tag: 'New form',
    images: [
      imagePath('milano-01.webp'),
      imagePath('milano-02.webp'),
      imagePath('milano-03.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'boite',
    name: 'Boite',
    collection: 'Boite',
    description: 'A dark, tactile form with a softened grid',
    explanation:
      'Boite turns a compact silhouette into a study of shadow and texture. Its rounded grid catches the light differently from every angle, making the vessel feel quietly alive between burns.',
    price: 86,
    art: 'art-boite',
    tag: 'New form',
    images: [
      imagePath('boite-01.webp'),
      imagePath('boite-02.webp'),
      imagePath('boite-03.webp'),
      imagePath('boite-04.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'chateu',
    name: 'Chateu',
    collection: 'Chateu',
    description: 'A pale vessel drawn in fine vertical lines',
    explanation:
      'Chateu is shaped around rhythm: a fluted body, a quiet lid, and a soft architectural profile. A light, composed form for shelves, tables and slow evenings.',
    price: 88,
    art: 'art-chateu',
    tag: 'New form',
    images: [
      imagePath('chateu-01.webp'),
      imagePath('chateu-02.webp'),
      imagePath('chateu-03.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'elephant',
    name: 'Elephant',
    collection: 'Elephant',
    description: 'A grounded sculptural form with a strong presence',
    explanation:
      'Elephant is an object with weight and character. Its generous silhouette is made to hold attention even when the flame is out, then return to the ritual whenever the room needs warmth.',
    price: 94,
    art: 'art-elephant',
    tag: 'New form',
    images: [
      imagePath('elephant-01.webp'),
      imagePath('elephant-02.webp'),
      imagePath('elephant-03.webp'),
      imagePath('elephant-04.webp'),
      imagePath('elephant-05.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    collection: 'Sakura',
    description: 'A gentle form with a calm, rounded silhouette',
    explanation:
      'Sakura brings a softer line to the collection. Its balanced shape and quiet surface are designed to sit lightly in a room while carrying the atmosphere of the flame.',
    price: 82,
    art: 'art-sakura',
    tag: 'New form',
    images: [
      imagePath('sakura-01.webp'),
      imagePath('sakura-02.webp'),
      imagePath('sakura-03.webp'),
      imagePath('sakura-04.webp'),
    ],
    scents: milanoScents.map((scent) => scent.name),
    scentOptions: milanoScents,
  },
  {
    id: 'refill',
    name: 'Refill',
    collection: 'Refill',
    description: 'A new atmosphere for the form you already love',
    explanation:
      'Our sculptural candles are designed to last. With a refill, you extend the life of the form quietly and sustainably, without ever replacing the object itself.',
    price: 38,
    art: 'art-refill',
    tag: 'Refill',
    images: [
      imagePath('refill-01.webp'),
      imagePath('refill-02.webp'),
      imagePath('refill-03.webp'),
    ],
    scents: [
      'Small / Thé',
      'Small / Bois Santal',
      'Small / Tropicale',
      'Small / Cedar Salad',
      'Big / Thé',
      'Big / Bois Santal',
      'Big / Tropicale',
      'Big / Cedar Salad',
    ],
    scentOptions: [
      'Small / Thé',
      'Small / Bois Santal',
      'Small / Tropicale',
      'Small / Cedar Salad',
      'Big / Thé',
      'Big / Bois Santal',
      'Big / Tropicale',
      'Big / Cedar Salad',
    ].map((name) => ({
      name,
      notes: name.startsWith('Small') ? '190g refill' : '245g refill',
      description: 'Hand-poured to renew your sculptural vessel.',
    })),
  },
];

const queryClient = new QueryClient();

function Sculpture({ product, flame = false }: { product: Product; flame?: boolean }) {
  return <div className={`product-art ${product.art}`} data-testid={`img-product-${product.id}`}>
    <div className="vessel"><div className="wax" /><div className="wick" />{flame && <div className="flame" />}</div>
    {product.tag && <span className="product-tag">{product.tag}</span>}
  </div>;
}

function ObjectSlideshow({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images ?? [];

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4300);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="object-media" role="group" aria-label={`${product.name} images`}>
      {images.map((image, index) => (
        <img
          key={image}
          className={`object-photo ${index === activeIndex ? 'active' : ''}`}
          src={image}
          alt={`${product.name} view ${index + 1}`}
        />
      ))}
      <div className="slide-controls" aria-label="Choose product image">
        {images.map((image, index) => (
          <button
            key={image}
            className={`slide-dot ${index === activeIndex ? 'active' : ''}`}
            type="button"
            aria-label={`Show image ${index + 1}`}
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
}: {
  product: Product;
  selectedScent: string;
  onSelect: (scent: string) => void;
}) {
  const options: ScentOption[] =
    product.scentOptions ??
    product.scents.map((name) => ({
      name,
      notes: 'Signature fragrance',
      description: 'A considered fragrance for the everyday ritual.',
    }));
  const selectedIndex = Math.max(0, options.findIndex((option) => option.name === selectedScent));
  const selected = options[selectedIndex] ?? options[0];
  const changeScent = (direction: number) => {
    const nextIndex = (selectedIndex + direction + options.length) % options.length;
    onSelect(options[nextIndex].name);
  };

  return (
    <div className="scent-selector">
      <div className="scent-selector-head">
        <span className="option-label">Choose the atmosphere</span>
        <span className="selected-scent">{String(selectedIndex + 1).padStart(2, '0')} / {String(options.length).padStart(2, '0')}</span>
      </div>
      {selected && (
        <div className="scent-slideshow">
          <div className="scent-slide-image-wrap">
            {options.map((option, index) => option.image ? (
              <img
                key={option.name}
                className={`scent-slide-image ${index === selectedIndex ? 'active' : ''}`}
                src={option.image}
                alt={`${option.name} fragrance`}
                aria-hidden={index !== selectedIndex}
              />
            ) : (
              <span
                key={option.name}
                className={`scent-slide-swatch ${index === selectedIndex ? 'active' : ''}`}
                aria-hidden="true"
              />
            ))}
            {options.length > 1 && (
              <div className="scent-slide-arrows">
                <button type="button" onClick={() => changeScent(-1)} aria-label="Previous scent">
                  <ArrowLeft size={15} />
                </button>
                <button type="button" onClick={() => changeScent(1)} aria-label="Next scent">
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="scent-slide-copy" key={selected.name}>
            <span className="scent-slide-number">Scent / {String(selectedIndex + 1).padStart(2, '0')}</span>
            <strong>{selected.name}</strong>
            <small>{selected.notes}</small>
            <p>{selected.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectShowcase({ product, onOpen }: { product: Product; onOpen: (p: Product, scent: string) => void }) {
  const [selectedScent, setSelectedScent] = useState(product.scentOptions?.[0]?.name ?? product.scents[0]);

  return (
    <article className="object-showcase" data-testid={`object-showcase-${product.id}`}>
      <div className="object-media-wrap">
        <div className="object-index">Object / {product.name}</div>
        {product.images ? (
          <ObjectSlideshow product={product} />
        ) : (
          <div className="object-media object-media-fallback">
            <Sculpture product={product} />
          </div>
        )}
      </div>
      <div className="object-details">
        <div className="section-kicker">{product.collection} collection</div>
        <div className="object-title-row">
          <div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
          <span className="object-price">${product.price}</span>
        </div>
        <div className="object-actions">
          <ScentSelector product={product} selectedScent={selectedScent} onSelect={setSelectedScent} />
          <button className="solid-button object-buy-button" type="button" onClick={() => onOpen(product, selectedScent)} data-testid={`button-open-object-${product.id}`}>
            Choose {product.name} <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div className="object-explanation">
        <span className="object-explanation-label">About the object</span>
        <p>{product.explanation}</p>
      </div>
    </article>
  );
}

function RefillShowcase({ product, onOpen }: { product: Product; onOpen: (p: Product, scent: string) => void }) {
  const [size, setSize] = useState<'Small' | 'Big'>('Small');
  const [scent, setScent] = useState('Thé');
  const selectedVariant = `${size} / ${scent}`;

  return (
    <article className="object-showcase refill-showcase" id="refill" data-testid="object-showcase-refill">
      <div className="object-media-wrap">
        <div className="object-index">Object / Refill</div>
        <ObjectSlideshow product={product} />
      </div>
      <div className="object-details refill-details">
        <div className="section-kicker">Refill / for every form</div>
        <div className="object-title-row">
          <div>
            <h3>Refill</h3>
            <p>A new atmosphere for the form you already love.</p>
          </div>
          <span className="object-price">${product.price}</span>
        </div>
        <div className="refill-options">
          <span className="option-label">Choose your refill</span>
          <div className="refill-select-row">
            <label>
              <span className="refill-select-label">Size</span>
              <select className="refill-select" value={size} onChange={(event) => setSize(event.target.value as 'Small' | 'Big')} aria-label="Refill size">
                <option value="Small">Small (190g)</option>
                <option value="Big">Big (245g)</option>
              </select>
            </label>
            <label>
              <span className="refill-select-label">Scent</span>
              <select className="refill-select" value={scent} onChange={(event) => setScent(event.target.value)} aria-label="Refill scent">
                <option>Thé</option>
                <option>Bois Santal</option>
                <option>Tropicale</option>
                <option>Cedar Salad</option>
              </select>
            </label>
          </div>
        </div>
        <div className="refill-copy">
          <p>Our sculptural candles are designed to last.</p>
          <p>With our refills, you extend their life—quietly, sustainably, and without ever replacing the form itself.</p>
          <p>Each refill is hand-poured in our Berlin atelier and precisely tailored to our sculptures. The minimalist composition allows the fragrance to unfold evenly without overpowering the room.</p>
        </div>
        <button className="solid-button object-buy-button refill-buy-button" type="button" onClick={() => onOpen(product, selectedVariant)} data-testid="button-open-object-refill">
          Choose refill <ArrowRight size={14} />
        </button>
      </div>
      <div className="object-explanation">
        <span className="object-explanation-label">About the refill</span>
        <p>{product.explanation}</p>
      </div>
    </article>
  );
}

function ScentShowcase({ product, onOpen }: { product: Product; onOpen: (p: Product, scent: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = milanoScents[activeIndex];

  const changeScent = (direction: number) => {
    setActiveIndex((current) => (current + direction + milanoScents.length) % milanoScents.length);
  };

  return (
    <>
      <div className="scent-showcase-heading" id="scents">
        <div>
          <div className="section-kicker">The atmosphere / 02</div>
          <h2 className="section-title">Signature<br /><em>scents.</em></h2>
        </div>
        <p className="section-intro">Four scent compositions, each unfolding slowly through the warmth of the candle.</p>
      </div>
      <article className="object-showcase scent-showcase" data-testid="scent-showcase">
        <div className="object-media-wrap">
          <div className="object-index">Atmosphere / {String(activeIndex + 1).padStart(2, '0')}</div>
          <div className="object-media scent-showcase-media" role="group" aria-label="Signature scent images">
            {milanoScents.map((option, index) => (
              <img
                key={option.name}
                className={`object-photo ${index === activeIndex ? 'active' : ''}`}
                src={option.image}
                alt={`${option.name} scent study`}
                aria-hidden={index !== activeIndex}
              />
            ))}
            <div className="slide-controls" aria-label="Choose a scent">
              {milanoScents.map((option, index) => (
                <button
                  key={option.name}
                  className={`slide-dot ${index === activeIndex ? 'active' : ''}`}
                  type="button"
                  aria-label={`Show ${option.name}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <div className="scent-slide-arrows">
              <button type="button" onClick={() => changeScent(-1)} aria-label="Previous scent">
                <ArrowLeft size={15} />
              </button>
              <button type="button" onClick={() => changeScent(1)} aria-label="Next scent">
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="object-details scent-showcase-details">
          <div className="section-kicker">Signature scents / composed in Grasse</div>
          <div className="object-title-row">
            <div>
              <h3 key={selected.name} className="scent-showcase-title">{selected.name}</h3>
              <p>245 gram refill · Up to 65H</p>
            </div>
            <span className="object-price">$38</span>
          </div>
          <div className="scent-showcase-copy" key={`${selected.name}-copy`}>
            <span className="scent-showcase-label">The atmosphere</span>
            <p>{selected.description}</p>
            <span className="scent-showcase-label">Scent notes</span>
            <p>{selected.notes}</p>
          </div>
          <button className="solid-button object-buy-button scent-buy-button" type="button" onClick={() => onOpen(product, `Big / ${selected.name}`)} data-testid={`button-open-scent-${selected.name.toLowerCase().replace(' ', '-')}`}>
            Choose {selected.name} <ArrowRight size={14} />
          </button>
        </div>
        <div className="object-explanation">
          <span className="object-explanation-label">Keep the form. Change the atmosphere.</span>
          <p>When the candle is finished, place a new wax refill inside the same vessel. Choose the same scent or change the atmosphere entirely.</p>
        </div>
      </article>
    </>
  );
}

function CareImageSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % careImages.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  const changeImage = (direction: number) => {
    setActiveIndex((current) => (current + direction + careImages.length) % careImages.length);
  };

  return (
    <div className="care-image-slideshow" role="group" aria-label="Candle care images">
      {careImages.map((image, index) => (
        <img
          key={image.src}
          className={`care-image-slide ${index === activeIndex ? 'active' : ''}`}
          src={image.src}
          alt={image.alt}
          aria-hidden={index !== activeIndex}
        />
      ))}
      <div className="care-image-arrows">
        <button type="button" onClick={() => changeImage(-1)} aria-label="Previous care image">
          <ArrowLeft size={15} />
        </button>
        <button type="button" onClick={() => changeImage(1)} aria-label="Next care image">
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="care-image-dots" aria-label="Choose care image">
        {careImages.map((image, index) => (
          <button
            key={image.src}
            className={index === activeIndex ? 'active' : ''}
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

function Header({ cartCount, onCart, onSearch }: { cartCount: number; onCart: () => void; onSearch: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState<'DE' | 'EN'>('EN');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('objet-decoratif-language');
    if (savedLanguage === 'DE' || savedLanguage === 'EN') {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
    window.localStorage.setItem('objet-decoratif-language', language);
  }, [language]);

  const navTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.remove('nav-target-fade');
      window.requestAnimationFrame(() => {
        target.classList.add('nav-target-fade');
        window.setTimeout(() => target.classList.remove('nav-target-fade'), 900);
      });
    } else {
      window.location.href = `${import.meta.env.BASE_URL}#${id}`;
    }
    setMobileOpen(false);
  };

  return <header>
    <div className="announcement">Free shipping on forms & refills over $100</div>
    <div className="site-header">
       <nav className={`main-nav ${mobileOpen ? 'open' : ''}`} data-testid="nav-main">
        <button className="nav-link" onClick={() => navTo('collection')} data-testid="link-shop-collection">Shop Collection</button>
        <button className="nav-link" onClick={() => navTo('scents')} data-testid="link-signature-scents">Signature Scents</button>
         <Link href="/care" className="nav-link" onClick={() => setMobileOpen(false)} data-testid="link-care">Care</Link>
         <Link href="/about" className="nav-link" onClick={() => setMobileOpen(false)} data-testid="link-about">About</Link>
      </nav>
      <button className="menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label="Open menu" data-testid="button-menu">
        {mobileOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
      <a href="/" className="logo" data-testid="link-logo">Objet Décoratif</a>
      <div className="header-actions">
        <div className="language-switch" role="group" aria-label="Choose language">
          {(['DE', 'EN'] as const).map((option) => (
            <button
              key={option}
              className={`language-option ${language === option ? 'active' : ''}`}
              type="button"
              aria-pressed={language === option}
              onClick={() => setLanguage(option)}
              data-testid={`button-language-${option.toLowerCase()}`}
            >
              {option}
            </button>
          ))}
        </div>
        <button className="header-action search-only" onClick={onSearch} data-testid="button-search"><Search size={14} strokeWidth={1.5} /> <span>Search</span></button>
        <button className="cart-button" onClick={onCart} data-testid="button-cart"><ShoppingBag size={14} strokeWidth={1.5} /><span>Cart</span><span className="cart-count" data-testid="text-cart-count">{cartCount}</span></button>
      </div>
    </div>
  </header>;
}

function Hero({ onExplore }: { onExplore: () => void }) {
  const [videoReady, setVideoReady] = useState(false);

  return <section className="hero">
    <video className={`hero-video ${videoReady ? 'is-ready' : ''}`} autoPlay muted loop playsInline preload="auto" onCanPlay={() => setVideoReady(true)} aria-hidden="true">
      <source src="/videos/hero.mp4" type="video/mp4" />
    </video>
    <div className="hero-copy">
      <span className="eyebrow">Concrete candle collection / 01—25</span>
      <h1>Objects<br /><em>with a glow.</em></h1>
      <p className="hero-note">Architectural vessels cast in concrete. Fragrances made to stay with you long after the flame goes out.</p>
      <button className="outline-button" onClick={onExplore} data-testid="button-explore-collection">Explore the collection <ArrowDown size={13} /></button>
    </div>
    <span className="hero-index">OD / 001</span>
  </section>;
}

function Collection({ onOpen }: { onOpen: (p: Product, scent: string) => void }) {
  const [filter, setFilter] = useState<'All' | ProductCollection>('All');
  const visible = useMemo(() => filter === 'All' ? products : products.filter((p) => p.collection === filter), [filter]);
  const refillProduct = products.find((product) => product.id === 'refill');
  return <section className="section" id="collection">
    <div className="section-header">
      <div><div className="section-kicker">The forms / 01</div><h2 className="section-title">Shop collection</h2></div>
      <p className="section-intro">A small family of concrete forms. Each one is designed to be lived with, then lit again.</p>
    </div>
    <div className="filter-bar">
      {(['All', 'Barrique', 'Milano', 'Boite', 'Chateu', 'Elephant', 'Sakura', 'Refill'] as const).map((item) => <button key={item} className={`filter-button ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} data-testid={`button-filter-${item.toLowerCase()}`}>{item}</button>)}
    </div>
    <div className="object-list">{visible.map((product) => product.id === 'refill' ? <RefillShowcase product={product} onOpen={onOpen} key={product.id} /> : <ObjectShowcase product={product} onOpen={onOpen} key={product.id} />)}</div>
    {(filter === 'All' || filter === 'Refill') && refillProduct && <ScentShowcase product={refillProduct} onOpen={onOpen} />}
  </section>;
}

function Footer() {
  return <footer className="footer editorial-footer" id="footer">
    <div className="footer-grid">
      <div className="footer-column">
        <span className="footer-index">01 / Sitemap</span>
        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/#collection">The Forms</a>
          <a href="/#scents">Signature Scents</a>
          <Link href="/about">About</Link>
          <Link href="/care">Candle Care</Link>
        </div>
      </div>
      <div className="footer-column">
        <span className="footer-index">02 / Information</span>
        <div className="footer-links footer-muted-links">
          <a href="/#footer">Shipping</a>
          <a href="/#footer">Returns</a>
          <a href="/#footer">Privacy</a>
          <a href="/#footer">Terms</a>
          <a href="/#footer">Legal Notice</a>
        </div>
      </div>
      <div className="footer-column footer-contact">
        <span className="footer-index">03 / Contact</span>
        <div className="footer-links">
          <a href="mailto:info@objetdecoratif.de">info@objetdecoratif.de</a>
          <a href="/#newsletter">Contact Form <span aria-hidden="true">↗</span></a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© Objet Décoratif / Made for slow evenings</span>
      <span>Concrete candle collection — Berlin / Everywhere</span>
    </div>
  </footer>;
}

function EditorialPageFrame({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return <div className="store-shell editorial-shell">
    <Header cartCount={0} onCart={() => { window.location.href = `${import.meta.env.BASE_URL}#collection`; }} onSearch={() => setSearchOpen((open) => !open)} />
    <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    <main>{children}</main>
    <Footer />
  </div>;
}

function CarePage() {
  return <EditorialPageFrame>
    <section className="care-top">
      <div className="care-video-panel">
        <video className="care-video" autoPlay muted loop playsInline preload="metadata" poster="/videos/care-01-poster.jpg" aria-label="Objet Décoratif candle care">
          <source src="/videos/care-01.mp4" type="video/mp4" />
        </video>
        <span className="care-video-label">Care / 01</span>
      </div>
      <div className="care-top-copy">
        <div className="editorial-hero-copy">
        <div className="section-kicker">Candle care / Objet Décoratif</div>
        <span className="eyebrow">A considered flame / Care guide</span>
        <h1>Care for<br /><em>the flame.</em></h1>
        <p>A few considered habits help every candle burn evenly, keep the vessel clean and let the perfume unfold as intended.</p>
        <a className="outline-button" href="#care-essentials">View the essentials <ArrowDown size={13} /></a>
        </div>
        <div className="editorial-hero-note">Even burn / Clean vessel / Balanced scent</div>
      </div>
    </section>
    <section className="editorial-section care-essentials" id="care-essentials">
      <div className="editorial-section-label">01 / The essentials<br /><span>Wax / Wick / Vessel</span></div>
      <div className="editorial-section-content">
        <div className="section-kicker">Care extends the ritual</div>
        <h2>A clean, even burn starts with the wick.</h2>
        <div className="care-intro-copy">
          <p>We tested numerous wax and wick combinations. This pairing was selected for a steady burn and balanced scent diffusion. Caring for it well helps the candle perform as intended.</p>
          <p>Let the wax pool become fully liquid on the first burn, keep the wick centered and remove any debris before lighting. Small adjustments make a noticeable difference.</p>
        </div>
      </div>
      <div className="care-facts">
        <div><strong>5 mm</strong><span>Wick trim only after the wax has fully set.</span></div>
        <div><strong>1½–2 h</strong><span>Recommended burn time for regular-sized candles.</span></div>
        <div><strong>4 h</strong><span>Do not exceed four hours in one burn.</span></div>
        <div><strong>10 mm</strong><span>Stop burning when this amount of wax remains.</span></div>
      </div>
    </section>
    <section className="care-split care-steps">
      <div className="care-step-copy">
        <div className="section-kicker">02 / Step by step / Wax / Wick / Vessel</div>
        <h2>How to care<br />for your candle.</h2>
        <div className="care-step-list">
          <div><span>01</span><div><h3>The first burn</h3><p>Allow the melt pool to become fully liquid and reach the edges of the refill. This establishes an even burn and helps prevent tunnelling during future use.</p></div></div>
          <div><span>02</span><div><h3>Each time you burn</h3><p>Place the candle in a well-ventilated room, away from drafts and fans. Burn regular-sized candles for 1½–2 hours at a time and never longer than four hours.</p></div></div>
          <div><span>03</span><div><h3>Care for the wick</h3><p>Keep the wax pool free from wick trimmings, matches and debris. After extinguishing, gently re-center the wick while the wax is still soft. Once fully set, trim it to approximately 5 mm.</p></div></div>
          <div><span>04</span><div><h3>Extinguish and finish</h3><p>Use the lid or a candle snuffer to extinguish the flame. Let the vessel cool before touching or moving it. Discontinue use when approximately 10 mm of wax remains at the bottom.</p></div></div>
        </div>
      </div>
      <CareImageSlideshow />
    </section>
    <section className="care-split care-safety">
      <div className="care-safety-copy">
        <div className="section-kicker">03 / Safety first</div>
        <h2>Never leave a burning candle unattended.</h2>
      </div>
      <div className="care-safety-list">
        <div><span>01</span><div><h3>Keep a clear space</h3><p>Keep away from children, pets and flammable materials.</p></div></div>
        <div><span>02</span><div><h3>Use a stable surface</h3><p>Place on a stable, heat-resistant surface.</p></div></div>
        <div><span>03</span><div><h3>Watch the flame</h3><p>Extinguish if the flame becomes unusually high or the wick moves close to the vessel wall.</p></div></div>
        <div><span>04</span><div><h3>Let the vessel cool</h3><p>Allow the vessel and wax to cool completely before handling.</p></div></div>
      </div>
    </section>
    <section className="care-split care-closing">
      <CareImageSlideshow />
      <div className="care-closing-copy">
        <div className="section-kicker">04 / Continue the ritual / Form / Scent</div>
        <h2>Keep the vessel.<br /><em>Renew the scent.</em></h2>
        <p>Once the candle is finished and the vessel has cooled completely, continue with a new refill. The object remains; only the atmosphere changes.</p>
        <a className="solid-button" href="/#collection">Shop refills <ArrowRight size={13} /></a>
      </div>
    </section>
  </EditorialPageFrame>;
}

function AboutPage() {
  return <EditorialPageFrame>
    <section className="editorial-hero about-hero">
      <div className="editorial-hero-copy">
        <div className="section-kicker">About / Objet Décoratif</div>
        <span className="eyebrow">Berlin / Grasse</span>
        <h1>Objects<br /><em>with meaning.</em></h1>
        <p>A long-standing passion for interiors, transformed into handpicked objects that give a space character, permanence and quiet intention.</p>
        <a className="outline-button" href="#about-story">Read our approach <ArrowDown size={13} /></a>
      </div>
      <div className="editorial-hero-note">Sculptural objects / Refillable by design</div>
    </section>
    <section className="editorial-section about-story" id="about-story">
      <div className="editorial-section-label">01 / Our approach</div>
      <div className="editorial-section-content">
        <div className="section-kicker">Curated with intention</div>
        <h2>We do not simply inhabit spaces. We fill them with meaning.</h2>
        <div className="about-intro-copy">
          <p>Objet Décoratif transforms a long-standing passion for interior design and decoration into handpicked, extraordinary objects. It is the result of a conscious decision: not just to inhabit spaces, but to fill them with meaning.</p>
          <p>Our selection follows a simple rule — we curate only what we truly love ourselves. Beautiful things belong together when they share the same care, clarity and intention.</p>
        </div>
      </div>
      <div className="about-principles">
        <div><span>01</span><h3>Curated with intention</h3><p>Only objects we would choose for our own spaces — considered, distinctive and made with care.</p></div>
        <div><span>02</span><h3>Designed to remain</h3><p>Sculptural vessels that continue beyond the first flame: objects to keep, refill and return to.</p></div>
        <div><span>03</span><h3>Scents from Grasse</h3><p>Our candle perfumes are developed with specialists in Grasse and selected to complement every form.</p></div>
      </div>
    </section>
    <section className="editorial-closing about-closing">
      <div className="about-closing-main">
        <div className="section-kicker">The refill ritual / 02</div>
        <h2>Keep the object.<br /><em>Change the atmosphere.</em></h2>
      </div>
      <div className="about-closing-side">
        <p>Filling spaces with objects that genuinely make you want to have them — that is what we are all about. Not just for ourselves, but for everyone who knows that beauty and care in the details matter.</p>
        <a className="solid-button" href="/#collection">Explore the forms <ArrowRight size={13} /></a>
      </div>
    </section>
  </EditorialPageFrame>;
}

function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  return <div className={`search-panel ${open ? 'open' : ''}`} data-testid="search-panel">
    <div className="search-input"><Search size={17} /><input autoFocus={open} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search forms, scents, rituals…" data-testid="input-search" /><button onClick={onClose} aria-label="Close search" data-testid="button-close-search"><X size={17} /></button></div>
    <div className="search-results">{query ? <span>{products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())).length} objects found</span> : <span>Try “Barrique” or “Santal Cruz”</span>}</div>
  </div>;
}

function ProductModal({ product, initialScent, onClose, onAdd }: { product: Product | null; initialScent?: string; onClose: () => void; onAdd: (p: Product, scent: string, quantity: number) => void }) {
  const [scent, setScent] = useState(initialScent ?? product?.scentOptions?.[0]?.name ?? product?.scents[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setScent(initialScent ?? product?.scentOptions?.[0]?.name ?? product?.scents[0] ?? '');
    setQuantity(1);
  }, [initialScent, product]);
  if (!product) return null;
  const scentOptions = product.scentOptions ?? product.scents.map((name) => ({ name }));
  return <div className="quick-view open" role="dialog" aria-modal="true" data-testid="product-modal">
    <div className="product-modal">
      {product.images ? <img className="modal-product-image" src={product.images[0]} alt={`${product.name} product view`} /> : <div className={`modal-art ${product.art}`}><div className="vessel"><div className="wax" /><div className="wick" /></div></div>}
      <div className="modal-copy"><button className="close-button modal-close" onClick={onClose} aria-label="Close product details" data-testid="button-close-product"><X size={16} /></button><div className="section-kicker">{product.collection} collection</div><h2>{product.name}</h2><p className="modal-subtitle">{product.description}</p><div className="modal-price">${product.price} USD</div><span className="option-label">{product.id === 'refill' ? 'Choose size & scent' : 'Choose your scent'}</span><div className="scent-options">{scentOptions.map((item) => <button key={item.name} className={`scent-option ${scent === item.name ? 'selected' : ''}`} onClick={() => setScent(item.name)} data-testid={`button-scent-${item.name.toLowerCase().replace(' ', '-')}`}>{item.name}</button>)}</div><span className="option-label">Quantity</span><div className="modal-buy"><div className="modal-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity" data-testid="button-modal-decrease"><Minus size={13} /></button><span data-testid="text-modal-quantity">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" data-testid="button-modal-increase"><Plus size={13} /></button></div><button className="solid-button" onClick={() => { onAdd(product, scent, quantity); onClose(); }} data-testid="button-add-to-cart">Add to cart <ArrowRight size={14} /></button></div></div>
    </div>
  </div>;
}

function CartDrawer({ open, lines, onClose, onChange }: { open: boolean; lines: CartLine[]; onClose: () => void; onChange: (id: string, scent: string, delta: number) => void }) {
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return <><div className={`overlay ${open ? 'open' : ''}`} onClick={onClose} /><aside className={`cart-drawer ${open ? 'open' : ''}`} aria-label="Shopping cart" data-testid="cart-drawer"><div className="drawer-head"><h2>Your cart</h2><button className="close-button" onClick={onClose} aria-label="Close cart" data-testid="button-close-cart"><X size={16} /></button></div><div className="cart-items">{lines.length === 0 ? <div className="cart-empty"><strong>Your cart is quiet.</strong><span>Add a form to begin the ritual.</span></div> : lines.map((line) => <div className="cart-item" key={`${line.product.id}-${line.scent}`} data-testid={`cart-item-${line.product.id}`}><div className={`cart-thumb ${line.product.art}`}><div className="vessel"><div className="wax" /></div></div><div className="cart-item-info"><strong>{line.product.name}</strong><small>{line.scent}</small><div className="cart-controls"><button className="qty-button" onClick={() => onChange(line.product.id, line.scent, -1)} aria-label="Decrease item" data-testid={`button-decrease-${line.product.id}`}><Minus size={11} /></button><span className="qty-number">{line.quantity}</span><button className="qty-button" onClick={() => onChange(line.product.id, line.scent, 1)} aria-label="Increase item" data-testid={`button-increase-${line.product.id}`}><Plus size={11} /></button></div></div><span className="cart-item-price">${line.product.price * line.quantity}</span></div>)}</div>{lines.length > 0 && <div className="drawer-foot"><div className="total-line"><span>Subtotal</span><strong data-testid="text-cart-total">${total}</strong></div><button className="solid-button full-button" onClick={() => window.alert('Checkout is coming soon — your objects are reserved.')} data-testid="button-checkout">Continue to checkout <ArrowRight size={14} /></button></div>}</aside></>;
}

function Store() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<{ product: Product; scent: string } | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const addToCart = (product: Product, scent: string, quantity: number) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id && line.scent === scent);
      if (found) return current.map((line) => line === found ? { ...line, quantity: line.quantity + quantity } : line);
      return [...current, { product, scent, quantity }];
    });
    setCartOpen(true);
  };
  const changeCart = (id: string, scent: string, delta: number) => setCart((current) => current.flatMap((line) => line.product.id === id && line.scent === scent ? (line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : []) : [line]));
  const openProduct = (product: Product, scent: string) => setSelected({ product, scent });
  return <div className="store-shell">
    <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onSearch={() => setSearchOpen((open) => !open)} />
    <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
     <main><Hero onExplore={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })} /><section className="intro-strip"><div className="intro-item"><span className="intro-number">01 / Form</span><h2>Cast in concrete.<br />Built to last.</h2><p>Quiet architecture for the everyday.</p></div><div className="intro-item"><span className="intro-number">02 / Scent</span><h2>Four fragrances.</h2><p>Endlessly renewable, never overpowering.</p></div><div className="intro-item"><span className="intro-number">03 / Ritual</span><h2>Burn. Refill.<br />Repeat.</h2><p>One beautiful object, many lives.</p></div></section><Collection onOpen={openProduct} /><section className="newsletter" id="newsletter"><h2>Notes from the studio.</h2>{subscribed ? <span className="success-note">You’re on the list. See you soon.</span> : <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" data-testid="input-newsletter" /><button type="submit" data-testid="button-subscribe">Subscribe <ArrowRight size={13} /></button></form>}</section></main>
     <Footer />
     <ProductModal product={selected?.product ?? null} initialScent={selected?.scent} onClose={() => setSelected(null)} onAdd={addToCart} /><CartDrawer open={cartOpen} lines={cart} onClose={() => setCartOpen(false)} onChange={changeCart} />
  </div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Store} /><Route path="/care" component={CarePage} /><Route path="/about" component={AboutPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(hash);
        if (!target) return;
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        target.classList.remove('nav-target-fade');
        window.requestAnimationFrame(() => {
          target.classList.add('nav-target-fade');
          window.setTimeout(() => target.classList.remove('nav-target-fade'), 900);
        });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return null;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ScrollToTop /><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;