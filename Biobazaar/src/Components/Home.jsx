import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { searchProduct } from "../redux/productSlice";
import { FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiCheck, FiHeart, FiFeather, FiSearch, FiStar } from "react-icons/fi";
import { productCardDescription, productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import ProductImage from "./ProductImage";
import "./home.css";

const categories = [
  { title: "Good things to eat", subtitle: "Pantry & provisions", to: "/collections/foods", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85", className: "category-food" },
  { title: "Care, made kinder", subtitle: "Personal care", to: "/collections/personalcare", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85", className: "category-care" },
  { title: "A thoughtful home", subtitle: "Home & household", to: "/collections/household", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85", className: "category-home" },
  { title: "Everyday, considered", subtitle: "Lifestyle essentials", to: "/collections/lifestyle", image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85", className: "category-life" },
];
const sampleProducts = [
  { name: "The everyday ritual", description: "A gentler start to your day", price: "Explore the edit", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85", label: "BODY & CARE", to: "/collections/personalcare" },
  { name: "Pantry staples", description: "Good ingredients, less fuss", price: "Explore the edit", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=85", label: "PANTRY", to: "/collections/foods" },
  { name: "Little home upgrades", description: "Useful things, chosen well", price: "Explore the edit", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=85", label: "HOME", to: "/collections/household" },
];

const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `₹${number.toLocaleString("en-IN")}` : "View product";
};
const productImage = (product) => {
  const raw = product.image || product.imageUrl || product.img || product.photo || product.productImage;
  if (!raw) return "";
  return productCardImageUrl(raw, undefined, product.sku);
};

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const productState = useSelector((state) => state.products);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const products = useMemo(() => [
    ...(productState.foods || []), ...(productState.personalCare || []),
    ...(productState.household || []), ...(productState.lifestyle || []),
  ].filter((p, i, arr) => arr.findIndex((x) => (x._id || x.id) === (p._id || p.id)) === i), [productState]);
  const visibleProducts = (showAll ? products : products.slice(0, 4));
  const search = (event) => {
    event.preventDefault();
    if (query.trim()) { dispatch(searchProduct(query)); navigate("/search-results"); }
    else navigate("/collections");
  };

  return <main className="bb-home">
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> A MORE THOUGHTFUL WAY TO SHOP</p>
        <h1>Good choices<br />grow <em>good things.</em></h1>
        <p className="hero-description">Everyday essentials with a little more thought behind them. Discover feel-good finds for you, your home and the world we share.</p>
        <div className="hero-buttons"><Link className="button-primary" to="/collections">Explore the marketplace <FiArrowUpRight /></Link><Link className="text-link" to="/aboutus">What we believe <FiArrowRight /></Link></div>
        <form className="hero-search" onSubmit={search}><FiSearch /><input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Looking for something in particular?"/><button type="submit" aria-label="Search"><FiArrowUpRight /></button></form>
        <div className="hero-note"><span className="note-icon"><FiFeather /></span><span><strong>Less guesswork, more good.</strong><small>Thoughtful choices start here.</small></span></div>
      </div>
      <div className="hero-art" aria-label="Natural products and botanicals">
        <div className="hero-image-main"><ProductImage src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=90" alt="Natural skincare products in warm sunlight" loading="eager" frameClassName="product-image-frame--hero" /></div>
        <div className="hero-image-small"><ProductImage src="https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=500&q=85" alt="Botanical ingredients and natural textures" loading="eager" frameClassName="product-image-frame--hero" /></div>
        <div className="hero-stamp"><span>SHOP WITH</span><strong>intention</strong><FiFeather /></div>
        <svg className="hero-scribble" viewBox="0 0 150 100" fill="none" aria-hidden="true"><path d="M8 88C44 17 93 9 135 16M113 5l23 11-10 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="hero-index"><span>01</span><span className="index-rule"/><span>CONSCIOUS LIVING, MADE SIMPLE</span></div>
    </section>

    <section className="values-strip" aria-label="Our values"><div><FiFeather /><span>Considered essentials</span></div><span className="value-dot">✳</span><div><FiCheck /><span>Clearer information</span></div><span className="value-dot">✳</span><div><FiStar /><span>Better everyday habits</span></div><span className="value-dot">✳</span><div><FiHeart /><span>Care for what matters</span></div></section>

    <section className="category-section section-wrap">
      <div className="section-heading"><div><p className="eyebrow">A LITTLE OF WHAT YOU NEED</p><h2>Find your kind<br className="mobile-break"/> of <em>everyday.</em></h2></div><Link to="/collections" className="round-link">Browse everything <span><FiArrowUpRight /></span></Link></div>
      <div className="category-grid">{categories.map((category, index) => <Link to={category.to} className={`category-card ${category.className}`} key={category.title}><ProductImage src={category.image} alt="" frameClassName="product-image-frame--fill"/><span className="category-number">0{index + 1}</span><div className="category-card-copy"><span>{category.subtitle}</span><h3>{category.title}</h3><span className="category-arrow"><FiArrowUpRight /></span></div></Link>)}</div>
    </section>

    <section className="smart-section"><div className="smart-copy"><p className="eyebrow"><FiStar /> INTRODUCING A SMARTER KIND OF SHOPPING</p><h2>Good for your<br/>routine. <em>Better informed.</em></h2><p>Choosing thoughtfully shouldn&apos;t mean doing hours of research. We&apos;re building tools that help you compare everyday products, understand what&apos;s known and find options that fit your priorities.</p><Link to={isAuthenticated ? "/collections" : "/login"} className="button-light">{isAuthenticated ? "Start exploring" : "Log in"}<FiArrowUpRight /></Link></div><div className="smart-card-stack"><div className="smart-card smart-card-back"><span className="smart-card-label">YOUR EVERYDAY, RECONSIDERED</span><div className="mini-leaf"><FiFeather /></div><p>Small swaps can<br/><em>feel like a big thing.</em></p></div><div className="smart-card smart-card-front"><div className="smart-card-top"><span>THE BIOBAZAAR WAY</span><FiStar /></div><div className="smart-step"><span>01</span><div><strong>Discover</strong><small>Find products for your real life.</small></div><FiArrowUpRight /></div><div className="smart-step"><span>02</span><div><strong>Understand</strong><small>Compare details, not just claims.</small></div><FiArrowUpRight /></div><div className="smart-step"><span>03</span><div><strong>Choose</strong><small>Decide what matters to you.</small></div><FiArrowUpRight /></div><div className="smart-card-foot"><FiFeather /> Thoughtful by nature. Transparent by design.</div></div></div></section>

    <section className="featured-section section-wrap">
      <div className="section-heading"><div><p className="eyebrow">A GOOD PLACE TO BEGIN</p><h2>Little things, <em>chosen well.</em></h2></div><Link to="/collections" className="text-link">Explore the shop <FiArrowRight /></Link></div>
      {products.length ? <div className="product-grid">{visibleProducts.map((product) => <Link className="product-card" to="/collections" key={product._id || product.id || product.name}><div className="product-image"><ProductImage src={productImage(product)} alt={productCardName(product) || "BioBazaar product"} frameClassName="product-image-frame--fill"/><span className="product-tag">IN THE MARKETPLACE</span></div><div className="product-info"><div><h3>{productCardName(product) || "Everyday essential"}</h3><p>{productCardDescription(product) || product.collec || "A considered everyday find"}</p></div><strong>{formatPrice(product.price || product.amount)}</strong></div></Link>)}</div> : <div className="product-grid">{sampleProducts.map((product) => <Link className="product-card editorial-product" to={product.to} key={product.name}><div className="product-image"><ProductImage src={product.image} alt="" frameClassName="product-image-frame--fill"/><span className="product-tag">{product.label}</span><span className="editorial-arrow"><FiArrowUpRight /></span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><span className="product-cta">{product.price} <FiArrowRight /></span></div></Link>)}</div>}
      {products.length > 4 && <button className="button-outline show-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : "See more from the marketplace"}<FiArrowDownRight /></button>}
      {productState.status === "failed" && <p className="product-load-note">Live product listings couldn&apos;t be loaded just now. You can still explore our collections.</p>}
    </section>

    <section className="newsletter-section"><div className="newsletter-leaf"><FiFeather /></div><div className="newsletter-copy"><p className="eyebrow">A NOTE FROM THE GREENER SIDE</p><h2>A little good, <em>in your inbox.</em></h2><p>Ideas for more thoughtful living, new finds and simple swaps. No noise, just the good stuff.</p></div><form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); setNewsletterMessage("Thanks for your interest — newsletter sign-up is coming soon."); }}><label className="sr-only" htmlFor="newsletter-email">Email address (required)</label><input id="newsletter-email" type="email" placeholder="you@example.com" required/><button type="submit" aria-label="Continue"><FiArrowRight /></button><small>{newsletterMessage || "By joining, you&apos;re choosing a more thoughtful inbox."}</small></form></section>
    <footer className="site-footer"><Link to="/" className="footer-brand">bio<span>bazaar</span><small>THE CONSCIOUS MARKETPLACE</small></Link><p>Better everyday choices, made a little simpler.</p><div className="footer-links"><Link to="/collections">Shop</Link><Link to="/aboutus">About Us</Link><Link to="/login">Your account</Link></div><span className="footer-copyright">© {new Date().getFullYear()} BioBazaar</span></footer>
  </main>;
}

export default Home;
