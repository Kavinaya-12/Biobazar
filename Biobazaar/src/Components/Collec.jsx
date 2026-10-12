import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowUpRight, FiCheck, FiFeather, FiFilter, FiRepeat , FiSearch, FiSliders, FiX } from "react-icons/fi";
import { api } from "../api";
import { productCardDescription, productCardImageUrl, productCardName, recognizedProductCategory } from "../utils/productCardPresentation";
import { comparePricePosition } from "../utils/priceComparison";
import { getProductInformationCoverage } from "../utils/productInformationCoverage";
import { fetchProducts } from "../redux/productSlice";
import { PRODUCT_CATEGORIES, productCategoryLabel } from "../productCategories";
import ProductImage from "./ProductImage";
import ProductCardDescription from "./ProductCardDescription";
import ProductComparison from "./ProductComparison";
import { availableComparisonIds, toggleComparedProduct } from "../utils/comparison";
import "./collec.css";

const categories = [{ id: "all", label: "Everything" }, ...PRODUCT_CATEGORIES.map((category) => ({ id: category.key, label: category.label }))];
const categoryFor = recognizedProductCategory;
const productImage = (product) => {
  const raw = product.image || product.imageUrl || product.img || product.photo;
  if (!raw) return "";
  return productCardImageUrl(raw, api.defaults.baseURL, product.sku);
};
const priceOf = (product) => Number(product.price ?? product.amount ?? 0);
const money = (value) => Number.isFinite(value) && value > 0 ? `₹${value.toLocaleString("en-IN")}` : "Price not listed";

export default function Collec() {
  const dispatch = useDispatch();
  const productState = useSelector((state) => state.products || {});
  const products = useMemo(() => {
    const all = [
      ...(productState.foods || []), ...(productState.personalCare || []),
      ...(productState.household || []), ...(productState.lifestyle || []),
    ];
    const unique = all.filter((product, index) => all.findIndex((item) => (item._id || item.id) === (product._id || product.id)) === index);
    return unique.length ? unique : (productState.filteredProducts || []);
  }, [productState]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [comparisonMessage, setComparisonMessage] = useState("");
  const [basketBudget, setBasketBudget] = useState("1000");
  const [matchBudget, setMatchBudget] = useState("500");
  const [matchNeeds, setMatchNeeds] = useState([]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const category = categoryFor(product);
      const text = `${product.name || product.title || ""} ${productCardDescription(product)} ${product.collec || product.type || ""}`.toLowerCase();
      const price = priceOf(product);
      const coverage = getProductInformationCoverage(product);
      const hasDetails = coverage.completedCount > 0;
      const hasRefillInfo = coverage.details.find((detail) => detail.key === "reusable")?.status === "complete";
      const hasMaterialInfo = coverage.details.find((detail) => detail.key === "ingredients")?.status === "complete";
      return (activeCategory === "all" || category === activeCategory)
        && text.includes(query.trim().toLowerCase())
        && (maxPrice === "all" || (price > 0 && price <= Number(maxPrice)))
        && (!matchNeeds.includes("budget") || (Number(matchBudget) > 0 && price > 0 && price <= Number(matchBudget)))
        && (!matchNeeds.includes("verified") || hasDetails)
        && (!matchNeeds.includes("refill") || hasRefillInfo)
        && (!matchNeeds.includes("simple") || hasMaterialInfo);
    });
    if (sort === "price-low") result = [...result].sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "price-high") result = [...result].sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "name") result = [...result].sort((a, b) => String(a.name || a.title).localeCompare(String(b.name || b.title)));
    return result;
  }, [products, activeCategory, query, sort, maxPrice, matchNeeds, matchBudget]);

  const pricePositionsByProduct = useMemo(() => new Map(filteredProducts.map((product) => [String(product._id || product.id), comparePricePosition(product, products)])), [products, filteredProducts]);

  const selectedProducts = selectedIds.map((id) => products.find((product) => String(product._id || product.id) === id)).filter(Boolean);
  const basketTotal = selectedProducts.reduce((sum, product) => sum + priceOf(product), 0);
  const comparisonRef = useRef(null);

  useEffect(() => {
    setSelectedIds((current) => {
      const available = availableComparisonIds(current, products);
      return available.length === current.length ? current : available;
    });
  }, [products]);

  useLayoutEffect(() => {
    if (showCompare) comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showCompare]);

  const toggleCompare = (product) => {
    const id = String(product._id || product.id);
    const result = toggleComparedProduct(selectedIds, id);
    if (result.action === "limit") {
      setComparisonMessage("Three products are selected. Remove one before adding another.");
      return;
    }
    if (result.action === "invalid") return;
    setSelectedIds(result.selectedIds);
    setComparisonMessage(result.action === "added" ? "Product added to comparison." : "Product removed from comparison.");
  };
  const toggleNeed = (need) => setMatchNeeds((current) => current.includes(need) ? current.filter((item) => item !== need) : [...current, need]);

  return <main className="bb-shop">
    <section className="shop-hero">
      <div className="shop-hero-copy">
        <p className="shop-eyebrow"><FiFeather /> THE CONSCIOUS MARKETPLACE</p>
        <h1>Shop with a little<br /><em>more certainty.</em></h1>
        <p>Explore everyday essentials, compare what matters to you and see where product information is clear — and where it is still missing.</p>
        <div className="shop-hero-actions"><a href="#shop-products" className="shop-primary" data-tour="explore-products">Explore products <FiArrowUpRight /></a><button type="button" className="shop-secondary" data-tour="compare-trigger" aria-controls="product-comparison" aria-expanded={showCompare} onClick={() => { setComparisonMessage(""); setShowCompare(true); }}><FiRepeat /> Compare picks ({selectedProducts.length})</button></div>
        <div className="shop-trust-note"><FiFeather /><span><strong>Honest by design</strong><small>Unknown details stay unknown. No made-up green claims.</small></span></div>
      </div>
      <div className="shop-hero-art"><ProductImage src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90" alt="Fresh produce arranged for a thoughtful everyday shop" loading="eager" frameClassName="product-image-frame--fill"/><div className="shop-art-note"><span>THE BETTER-CHOICE EDIT</span><strong>Small steps.<br/><em>Real life.</em></strong></div></div>
    </section>

    {showCompare && <ProductComparison
      panelRef={comparisonRef}
      products={selectedProducts}
      baseUrl={api.defaults.baseURL}
      unavailableCount={selectedIds.length - selectedProducts.length}
      message={comparisonMessage}
      onRemove={toggleCompare}
      onClear={() => { setSelectedIds([]); setComparisonMessage("Comparison selection cleared."); }}
      onClose={() => setShowCompare(false)}
      basketTotal={basketTotal}
      basketBudget={basketBudget}
      onBasketBudgetChange={setBasketBudget}
    />}

    <nav className="shop-category-directory" aria-label="Shop by category" data-tour="categories">
      <p className="shop-eyebrow">FIND YOUR EVERYDAY</p>
      <div className="shop-category-directory-links">
        {[
          ["Pantry", "/collections/foods", "Thoughtful food and provisions"],
          ["Body & care", "/collections/personalcare", "Care for your daily rituals"],
          ["Home & Living", "/collections/household", "Useful things for your space"],
          ["Lifestyle", "/collections/lifestyle", "Considered everyday essentials"],
        ].map(([label, to, description], index) => <Link key={to} to={to} className="shop-category-directory-link"><span>0{index + 1}</span><strong>{label}</strong><small>{description}</small><FiArrowUpRight /></Link>)}
      </div>
    </nav>

    <section className="shop-tool-row" aria-label="Smart shopping tools">
      <article className="shop-tool-card"><span className="shop-tool-icon"><FiFeather /></span><div><h2>Product information</h2><p>Completeness of disclosed details only. It is not a verified environmental impact score.</p></div><span className="tool-index">01</span></article>
      <article className="shop-tool-card"><span className="shop-tool-icon"><FiRepeat /></span><div><h2>BioCompare</h2><p>Pick up to three products to compare price and disclosed details side by side.</p></div><span className="tool-index">02</span></article>
      <article className="shop-tool-card"><span className="shop-tool-icon"><FiSliders /></span><div><h2>BioMatch</h2><p>Filter by your shopping priorities and discover what fits your routine.</p></div><span className="tool-index">03</span></article>
    </section>

    <section className="biomatch-panel">
      <div><p className="shop-eyebrow">YOUR PRIORITIES, YOUR WAY</p><h2>Make the shop <em>feel like yours.</em></h2><p className="biomatch-subtitle">Choose what matters today. These are shopping filters, not verified product ratings.</p></div>
      <div className="match-options">
        {[ ["budget", "Budget-friendly"], ["verified", "More product details"], ["refill", "Reusable / refill info"], ["simple", "Simple ingredients / materials"] ].map(([id, label]) => <button key={id} className={`match-chip ${matchNeeds.includes(id) ? "selected" : ""}`} aria-pressed={matchNeeds.includes(id)} onClick={() => toggleNeed(id)}>{matchNeeds.includes(id) && <FiCheck />}{label}</button>)}
      </div>
      {matchNeeds.includes("budget") && <label className="match-budget">Budget limit <span>₹</span><input type="number" min="1" value={matchBudget} onChange={(event) => setMatchBudget(event.target.value)} placeholder="500" aria-label="BioMatch budget limit" /></label>}
      <p className="match-hint">{matchNeeds.length ? "Your selected BioMatch priorities are filtering the catalogue below." : "Choose a priority to filter the catalogue."}</p>
    </section>

    <section className="shop-products-section" id="shop-products">
      <div className="shop-section-heading"><div><p className="shop-eyebrow">A MORE INFORMED EVERYDAY</p><h2>Shop all <em>good things.</em></h2><p>Browse the marketplace, then compare your shortlist.</p></div><span className="shop-count">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</span></div>
      <div className="shop-controls" data-tour="search-filters">
        <label className="shop-search"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product name or type" aria-label="Search products"/>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><FiX /></button>}</label>
        <label className="shop-select"><FiFilter /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A to Z</option></select></label>
        <label className="shop-select"><span>₹</span><select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} aria-label="Maximum price"><option value="all">Any price</option><option value="250">Up to ₹250</option><option value="500">Up to ₹500</option><option value="1000">Up to ₹1,000</option></select></label>
      </div>
      <div className="shop-category-tabs">{categories.map((category) => <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>{category.label}</button>)}</div>

      {filteredProducts.length ? <div className="smart-product-grid">{filteredProducts.map((product, productIndex) => {
        const id = String(product._id || product.id);
        const selected = selectedIds.includes(id);
        const pricePosition = pricePositionsByProduct.get(id);
        return <article className="smart-product-card" key={id} data-tour={productIndex === 0 ? "product-details" : undefined}>
          <div className="smart-product-image"><ProductImage src={productImage(product)} alt={productCardName(product) || "Marketplace product"} frameClassName="product-image-frame--fill"/><span className="product-category-tag">{productCategoryLabel(categoryFor(product) || product.collec || product.category || product.type)}</span><button type="button" className={`compare-toggle ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => toggleCompare(product)} aria-label={selected ? "Remove from comparison" : "Add to comparison"} title={selected ? "Remove from comparison" : selectedIds.length >= 3 ? "Three products selected; remove one to add another" : "Add to comparison"}>{selected ? <FiCheck /> : <FiRepeat />}</button></div>
          <div className="smart-product-body"><div className="smart-product-title-row"><h3>{productCardName(product) || "Everyday essential"}</h3></div><ProductCardDescription product={product} className="smart-product-description"/><strong className="smart-product-price">{money(priceOf(product))}</strong>
            <div className={`lower-price-alternative price-position-${pricePosition?.kind || "insufficient"}`}><span>{pricePosition?.label || "Price comparison unavailable"}</span>{pricePosition?.kind === "insufficient" ? <><small>{pricePosition.reason}</small><small>You can still use “Add to compare” to view the product details side by side. Missing details will stay marked as not provided.</small></> : <small>{pricePosition.unitPrice} · Based on {pricePosition.eligibleAlternativeCount} matching listings</small>}</div>
            <button className={`compare-add ${selected ? "added" : ""}`} onClick={() => toggleCompare(product)}>{selected ? "Added to compare" : "Add to compare"} {selected ? <FiCheck /> : <FiRepeat />}</button>
          </div>
        </article>;
      })}</div> : <div className="shop-empty"><span><FiSearch /></span><h3>{productState.status === "loading" ? "Loading product listings" : productState.status === "failed" ? "Product listings are unavailable" : products.length ? "No products match these filters" : "Your marketplace is getting ready"}</h3><p>{productState.status === "loading" ? "Gathering published products from the marketplace." : productState.status === "failed" ? "We could not reach the product catalogue. Please try again." : products.length ? "Try another category, search term or price range." : "Once products are available from your store, they will appear here. We do not fill the catalogue with invented listings."}</p>{productState.status === "failed" && <button onClick={() => dispatch(fetchProducts())}>Retry catalogue</button>}{(query || activeCategory !== "all" || maxPrice !== "all") && <button onClick={() => { setQuery(""); setActiveCategory("all"); setMaxPrice("all"); }}>Clear filters</button>}</div>}
    </section>

    <section className="shop-footnote"><FiFeather /><p><strong>Transparency over greenwashing.</strong> Product information coverage counts populated detail fields only. It does not verify certifications or measure environmental impact; absent information stays undisclosed.</p><Link to="/aboutus">Our approach <FiArrowUpRight /></Link></section>
  </main>;
}













