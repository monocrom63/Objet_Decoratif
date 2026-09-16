import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, Menu, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Product = {
  id: string;
  name: string;
  collection: 'Barrique' | 'Milano';
  description: string;
  price: number;
  art: string;
  tag?: string;
  scents: string[];
};
type CartLine = { product: Product; scent: string; quantity: number };

const products: Product[] = [
  { id: 'barrique', name: 'Barrique', collection: 'Barrique', description: 'Compact, soft and perfectly balanced', price: 68, art: 'art-barrique', tag: 'The original', scents: ['Santal Cruz', 'Hinoki', 'Fig Leaf'] },
  { id: 'milano', name: 'Milano', collection: 'Milano', description: 'A taller study in quiet proportion', price: 82, art: 'art-milano', tag: 'New form', scents: ['Santal Cruz', 'Cedar Smoke', 'Orange Peel'] },
  { id: 'santal', name: 'Santal Cruz', collection: 'Barrique', description: 'Warm woods, mineral air, a little salt', price: 32, art: 'art-santal', tag: 'Refill', scents: ['Santal Cruz'], },
  { id: 'refill', name: 'Barrique Refill', collection: 'Barrique', description: 'A renewable ritual for your original form', price: 29, art: 'art-refill', tag: 'Refill', scents: ['Hinoki', 'Fig Leaf', 'Santal Cruz'] },
];

const queryClient = new QueryClient();

function Sculpture({ product, flame = false }: { product: Product; flame?: boolean }) {
  return <div className={`product-art ${product.art}`} data-testid={`img-product-${product.id}`}>
    <div className="vessel"><div className="wax" /><div className="wick" />{flame && <div className="flame" />}</div>
    {product.tag && <span className="product-tag">{product.tag}</span>}
  </div>;
}

function Header({ cartCount, onCart, onSearch }: { cartCount: number; onCart: () => void; onSearch: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };
  return <header>
    <div className="announcement">Free shipping on forms & refills over $100</div>
    <div className="site-header">
      <nav className={`main-nav ${mobileOpen ? 'open' : ''}`} data-testid="nav-main">
        <button className="nav-link" onClick={() => navTo('collection')} data-testid="link-shop-collection">Shop Collection</button>
        <button className="nav-link" onClick={() => navTo('scents')} data-testid="link-signature-scents">Signature Scents</button>
        <button className="nav-link" onClick={() => navTo('ritual')} data-testid="link-care">Care</button>
        <button className="nav-link" onClick={() => navTo('about')} data-testid="link-about">About</button>
      </nav>
      <button className="menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label="Open menu" data-testid="button-menu">
        {mobileOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
      <a href="/" className="logo" data-testid="link-logo">Objet Décoratif</a>
      <div className="header-actions">
        <button className="header-action search-only" onClick={onSearch} data-testid="button-search"><Search size={14} strokeWidth={1.5} /> <span>Search</span></button>
        <button className="cart-button" onClick={onCart} data-testid="button-cart"><ShoppingBag size={14} strokeWidth={1.5} /><span>Cart</span><span className="cart-count" data-testid="text-cart-count">{cartCount}</span></button>
      </div>
    </div>
  </header>;
}

function Hero({ onExplore }: { onExplore: () => void }) {
  return <section className="hero">
    <div className="hero-copy">
      <span className="eyebrow">Concrete candle collection / 01—25</span>
      <h1>Objects<br /><em>with a glow.</em></h1>
      <p className="hero-note">Architectural vessels cast in concrete. Fragrances made to stay with you long after the flame goes out.</p>
      <button className="outline-button" onClick={onExplore} data-testid="button-explore-collection">Explore the collection <ArrowDown size={13} /></button>
    </div>
    <span className="hero-index">OD / 001</span>
  </section>;
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <button onClick={() => onOpen(product)} style={{ border: 0, padding: 0, background: 'transparent', display: 'block', width: '100%', textAlign: 'left' }} data-testid={`button-open-product-${product.id}`}>
      <div style={{ position: 'relative' }}><Sculpture product={product} /><span className="product-open"><ArrowRight size={16} /></span></div>
    </button>
    <div className="product-meta">
      <div><h3 className="product-name">{product.name}</h3><p className="product-description">{product.description}</p></div>
      <span className="product-price">${product.price}</span>
    </div>
  </article>;
}

function Collection({ onOpen }: { onOpen: (p: Product) => void }) {
  const [filter, setFilter] = useState<'All' | 'Barrique' | 'Milano'>('All');
  const visible = useMemo(() => filter === 'All' ? products : products.filter((p) => p.collection === filter), [filter]);
  return <section className="section" id="collection">
    <div className="section-header">
      <div><div className="section-kicker">The forms / 01</div><h2 className="section-title">Shop collection</h2></div>
      <p className="section-intro">A small family of concrete forms. Each one is designed to be lived with, then lit again.</p>
    </div>
    <div className="filter-bar">
      {(['All', 'Barrique', 'Milano'] as const).map((item) => <button key={item} className={`filter-button ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} data-testid={`button-filter-${item.toLowerCase()}`}>{item}</button>)}
    </div>
    <div className="product-grid">{visible.map((product) => <ProductCard product={product} onOpen={onOpen} key={product.id} />)}</div>
  </section>;
}

function Ritual() {
  return <section className="ritual" id="ritual">
    <div className="ritual-copy"><div className="section-kicker">The ritual / 02</div><h2>Keep the form.<br />Change the mood.</h2><p>Our vessels are cast to last beyond a single burn. When the wax is gone, drop in a refill and begin again.</p><button className="outline-button" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-shop-refills">Shop refills <ArrowRight size={13} /></button></div>
    <div className="ritual-steps">
      <div className="step"><span className="step-number">01</span><div><h3>Buy the form</h3><p>A sculptural object, poured and finished by hand in our studio.</p></div></div>
      <div className="step"><span className="step-number">02</span><div><h3>Burn the candle</h3><p>Let the wax pool reach the edge. Take your time with it.</p></div></div>
      <div className="step"><span className="step-number">03</span><div><h3>Refill & repeat</h3><p>One vessel. Many chapters. Less waste, more ritual.</p></div></div>
    </div>
  </section>;
}

function Scents() {
  const scents = [['01', 'Santal Cruz', 'sandalwood / dry cedar'], ['02', 'Hinoki', 'cypress / mineral water'], ['03', 'Fig Leaf', 'green fig / moss'], ['04', 'Cedar Smoke', 'cedar / ember'], ['05', 'Orange Peel', 'citrus / neroli']];
  return <section className="section scent-section" id="scents"><div className="scent-layout"><div><div className="section-kicker">The atmosphere / 03</div><h2 className="section-title">Signature<br /><em>scents.</em></h2><p className="scent-note">Five fragrances, composed to sit quietly in a room. Never loud. Always present.</p></div><div className="scent-list">{scents.map(([number, name, notes]) => <div className="scent-row" key={name} data-testid={`text-scent-${name.toLowerCase().replace(' ', '-')}`}><span>{number}</span><strong>{name}</strong><small>{notes}</small></div>)}</div></div></section>;
}

function About() {
  return <section className="about-band" id="about"><div className="about-art" aria-label="Objet Décoratif studio mark" /><div className="about-copy"><div className="section-kicker">The studio / 04</div><h2>Clean forms, refillable by design.</h2><p>Objet Décoratif began with a simple question: can an everyday candle earn its place on a shelf when it is not lit?</p><p>We work slowly with concrete, fragrance and proportion to make objects that hold a room — and keep holding it.</p><button className="solid-button" onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-stay-close">Stay close <ArrowRight size={13} /></button></div></section>;
}

function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  return <div className={`search-panel ${open ? 'open' : ''}`} data-testid="search-panel">
    <div className="search-input"><Search size={17} /><input autoFocus={open} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search forms, scents, rituals…" data-testid="input-search" /><button onClick={onClose} aria-label="Close search" data-testid="button-close-search"><X size={17} /></button></div>
    <div className="search-results">{query ? <span>{products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())).length} objects found</span> : <span>Try “Barrique” or “Santal Cruz”</span>}</div>
  </div>;
}

function ProductModal({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (p: Product, scent: string, quantity: number) => void }) {
  const [scent, setScent] = useState(product?.scents[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;
  return <div className="quick-view open" role="dialog" aria-modal="true" data-testid="product-modal">
    <div className="product-modal">
      <div className={`modal-art ${product.art}`}><div className="vessel"><div className="wax" /><div className="wick" /></div></div>
      <div className="modal-copy"><button className="close-button modal-close" onClick={onClose} aria-label="Close product details" data-testid="button-close-product"><X size={16} /></button><div className="section-kicker">{product.collection} collection</div><h2>{product.name}</h2><p className="modal-subtitle">{product.description}</p><div className="modal-price">${product.price} USD</div><span className="option-label">Choose your scent</span><div className="scent-options">{product.scents.map((item) => <button key={item} className={`scent-option ${scent === item ? 'selected' : ''}`} onClick={() => setScent(item)} data-testid={`button-scent-${item.toLowerCase().replace(' ', '-')}`}>{item}</button>)}</div><span className="option-label">Quantity</span><div className="modal-buy"><div className="modal-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity" data-testid="button-modal-decrease"><Minus size={13} /></button><span data-testid="text-modal-quantity">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" data-testid="button-modal-increase"><Plus size={13} /></button></div><button className="solid-button" onClick={() => { onAdd(product, scent, quantity); onClose(); }} data-testid="button-add-to-cart">Add to cart <ArrowRight size={14} /></button></div></div>
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
  const [selected, setSelected] = useState<Product | null>(null);
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
  return <div className="store-shell">
    <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onSearch={() => setSearchOpen((open) => !open)} />
    <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    <main><Hero onExplore={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })} /><section className="intro-strip"><div className="intro-item"><span className="intro-number">01 / Form</span><h2>Cast in concrete.<br />Built to last.</h2><p>Quiet architecture for the everyday.</p></div><div className="intro-item"><span className="intro-number">02 / Scent</span><h2>Five fragrances.</h2><p>Endlessly renewable, never overpowering.</p></div><div className="intro-item"><span className="intro-number">03 / Ritual</span><h2>Burn. Refill.<br />Repeat.</h2><p>One beautiful object, many lives.</p></div></section><Collection onOpen={setSelected} /><Ritual /><Scents /><About /><section className="newsletter" id="newsletter"><h2>Notes from the studio.</h2>{subscribed ? <span className="success-note">You’re on the list. See you soon.</span> : <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" data-testid="input-newsletter" /><button type="submit" data-testid="button-subscribe">Subscribe <ArrowRight size={13} /></button></form>}</section></main>
    <footer className="footer"><span>© Objet Décoratif / Made for slow evenings</span><span>Concrete candle collection — Paris / Everywhere</span></footer>
    <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={addToCart} /><CartDrawer open={cartOpen} lines={cart} onClose={() => setCartOpen(false)} onChange={changeCart} />
  </div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Store} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;