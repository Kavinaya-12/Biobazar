import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiArrowUpRight, FiBox, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { api } from "../api";
import { PRODUCT_CATEGORIES, productCategoryLabel } from "../productCategories";
import { CLASSIFICATION_TAXONOMY, classificationCategoryLabel, classificationTypeLabel, selectMainProductCategory, selectProductCategory } from "../utils/productClassification";
import { productCardImageUrl } from "../utils/productCardPresentation";
import { fetchProducts } from "../redux/productSlice";
import { SellerNavigation } from "./SellerHub";
import ProductImage from "./ProductImage";
import "./seller-hub.css";

const emptyProduct = { name: "", type: "", description: "", collec: "Foods", productCategory: "", productType: "", packageQuantity: "", packageUnit: "", price: "", inventoryQuantity: "0", sku: "", shippingDetails: "", status: "published", imageUrl: "" };
const categories = PRODUCT_CATEGORIES.map(({ value, label }) => [value, label]);

export function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState(emptyProduct);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (id) api.get(`/seller/products/${id}`).then(({ data }) => setForm({ ...emptyProduct, ...data.product, price: String(data.product.price), inventoryQuantity: String(data.product.inventoryQuantity ?? 0), imageUrl: /^https?:/.test(data.product.image || "") ? data.product.image : "" })).catch((requestError) => setError(requestError.response?.data?.message || "Could not load this product.")).finally(() => setLoading(false)); }, [id]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const productCategories = Object.keys(CLASSIFICATION_TAXONOMY[form.collec] || {});
  const productTypes = CLASSIFICATION_TAXONOMY[form.collec]?.[form.productCategory] || [];
  const classificationRequired = !id || Boolean(form.productCategory || form.productType);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (key !== "imageUrl" || value) payload.append(key, value); });
    if (image) payload.append("image", image);
    try {
      await api({ method: id ? "patch" : "post", url: id ? `/seller/products/${id}` : "/seller/products", data: payload });
      let catalogueRefreshed = true;
      try { await dispatch(fetchProducts()).unwrap(); } catch { catalogueRefreshed = false; }
      const savedStatus = form.status;
      const message = savedStatus === "draft"
        ? (id ? "Draft updated." : "Draft saved. It will not appear in public listings until published.")
        : savedStatus === "archived"
          ? "Product archived. It is hidden from public listings."
          : id ? "Product updated." : "Product added.";
      toast.success(catalogueRefreshed ? message : `${message} The storefront could not refresh; reload it to see the latest listings.`);
      navigate("/seller/products");
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not save this product."); }
    finally { setSaving(false); }
  };
  if (loading) return <main className="seller-shell"><p className="seller-state">Loading product...</p></main>;
  return (
    <main className="seller-shell">
      <SellerNavigation active="products" />
      <Link to="/seller/products" className="seller-back-link"><FiArrowLeft /> Products</Link>
      <header className="seller-page-heading">
        <p className="seller-eyebrow">PRODUCT MANAGEMENT</p>
        <h1>{id ? "Edit product." : "Add a product."}</h1>
        <p>Keep listing details, price, and available inventory up to date.</p>
      </header>
      <form className="seller-form" onSubmit={submit}>
        <section className="seller-form-section">
          <div className="seller-field-grid">
            <div className="seller-field">
              <label htmlFor="product-name">Product name (required)</label>
              <input id="product-name" minLength="3" maxLength="120" value={form.name} onChange={(event) => change("name", event.target.value)} placeholder="e.g. Organic cotton towel" required />
            </div>
            <div className="seller-field">
              <label htmlFor="product-sku">SKU (optional)</label>
              <input id="product-sku" maxLength="80" value={form.sku} onChange={(event) => change("sku", event.target.value)} placeholder="Your stock-keeping code" />
            </div>
          </div>
          <div className="seller-field">
            <label htmlFor="product-description">Description (required)</label>
            <textarea id="product-description" rows="4" minLength="10" maxLength="2000" value={form.description} onChange={(event) => change("description", event.target.value)} placeholder="Describe the product, its use, and key details" required />
          </div>
          <div className="seller-field-grid">
            <div className="seller-field">
              <label htmlFor="product-category">Category (required)</label>
              <select id="product-category" value={form.collec} onChange={(event) => setForm((current) => selectMainProductCategory(current, event.target.value))}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
          </div>
          <div className="seller-field-grid">
            <div className="seller-field"><label htmlFor="product-subcategory">Product category {classificationRequired ? "(required)" : "(optional for existing listings)"}</label><select id="product-subcategory" required={classificationRequired} value={form.productCategory || ""} onChange={(event) => setForm((current) => selectProductCategory(current, event.target.value))}><option value="">Choose a product category</option>{productCategories.map((value) => <option key={value} value={value}>{classificationCategoryLabel(value)}</option>)}</select></div>
            <div className="seller-field"><label htmlFor="product-classification-type">Product type {classificationRequired ? "(required)" : "(optional for existing listings)"}</label><select id="product-classification-type" required={classificationRequired} disabled={!form.productCategory} value={form.productType || ""} onChange={(event) => setForm((current) => ({ ...current, productType: event.target.value, type: classificationTypeLabel(event.target.value) }))}><option value="">Choose a product type</option>{productTypes.map((value) => <option key={value} value={value}>{classificationTypeLabel(value)}</option>)}</select></div>
          </div>
          <div className="seller-field-grid">
            <div className="seller-field"><label htmlFor="package-quantity">Package quantity (optional)</label><input id="package-quantity" type="number" min="0.001" max="1000000" step="any" value={form.packageQuantity ?? ""} onChange={(event) => change("packageQuantity", event.target.value)} placeholder="e.g. 500" /></div>
            <div className="seller-field"><label htmlFor="package-unit">Package unit (optional)</label><select id="package-unit" value={form.packageUnit || ""} onChange={(event) => change("packageUnit", event.target.value)}><option value="">Choose unit</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="piece">pieces</option></select><small>Use the quantity and unit printed on the package. Both are needed for unit-price comparisons.</small></div>
          </div>
          <div className="seller-field-grid">
            <div className="seller-field">
              <label htmlFor="product-price">Price in rupees (required)</label>
              <input id="product-price" type="number" min="0.01" max="10000000" step="0.01" value={form.price} onChange={(event) => change("price", event.target.value)} placeholder="e.g. 299.00" required />
            </div>
            <div className="seller-field">
              <label htmlFor="product-stock">Available quantity (required)</label>
              <input id="product-stock" type="number" min="0" step="1" value={form.inventoryQuantity} onChange={(event) => change("inventoryQuantity", event.target.value)} placeholder="0" required />
              <small>Enter available units as a whole number; 0 is allowed.</small>
            </div>
          </div>
          <div className="seller-field-grid">
            <div className="seller-field">
              <label htmlFor="product-status">Listing status</label>
              <select id="product-status" value={form.status} onChange={(event) => change("status", event.target.value)}><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
            </div>
            <div className="seller-field">
              <label htmlFor="shipping-info">Shipping details (optional)</label>
              <input id="shipping-info" maxLength="1000" value={form.shippingDetails} onChange={(event) => change("shippingDetails", event.target.value)} placeholder="Handling or delivery details" />
            </div>
          </div>
          <div className="seller-field">
            <label htmlFor="product-image">Product image (optional)</label>
            <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            <small>JPEG, PNG, or WebP; maximum 5 MB. {id ? "Leave empty to keep the current image." : "You can also provide a direct image URL below."}</small>
          </div>
          <div className="seller-field">
            <label htmlFor="product-image-url">Direct image URL (optional)</label>
            <input id="product-image-url" type="url" value={form.imageUrl} onChange={(event) => change("imageUrl", event.target.value)} placeholder="https://example.com/product.jpg" />
          </div>
          <fieldset className="seller-evidence-fields">
            <legend>Product information (optional)</legend>
            {[ ["certification", "Certification", "Name the stated certification or standard"], ["ingredients", "Ingredients / materials", "List disclosed ingredients or materials"], ["packaging", "Packaging", "Describe the packaging materials"], ["reusable", "Reuse / refill details", "Describe stated reuse or refill information"], ["recyclable", "Recycling details", "Describe stated recycling information"], ["evidenceNotes", "Evidence source / notes", "Source name, URL, or supporting note"] ].map(([key, label, placeholder]) => <div className="seller-field" key={key}><label htmlFor={`product-${key}`}>{label} (optional)</label><textarea id={`product-${key}`} rows="2" maxLength="2000" value={form[key] || ""} onChange={(event) => change(key, event.target.value)} placeholder={placeholder} /></div>)}
          </fieldset>
        </section>
        {error && <p className="seller-form-error" role="alert">{error}</p>}
        <div className="seller-form-actions">
          <Link to="/seller/products" className="seller-secondary-button">Cancel</Link>
          <button type="submit" className="seller-primary-link" disabled={saving}>{saving ? "Saving..." : "Save product"} <FiArrowUpRight /></button>
        </div>
      </form>
    </main>
  );
}

export default function SellerProducts() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});
  const load = () => { setLoading(true); api.get("/seller/products").then(({ data }) => { setProducts(data.products); setQuantities(Object.fromEntries(data.products.map((product) => [product._id, String(product.inventoryQuantity ?? 0)]))); }).catch((requestError) => setError(requestError.response?.data?.message || "Could not load products.")).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const updateInventory = async (productId) => { try { await api.patch(`/seller/products/${productId}/inventory`, { inventoryQuantity: Number(quantities[productId]) }); await dispatch(fetchProducts()).unwrap(); toast.success("Inventory updated."); load(); } catch (requestError) { toast.error(requestError.response?.data?.message || "Could not update inventory or refresh the storefront."); } };
  const archive = async (product) => { if (!window.confirm(`Archive ${product.name}?`)) return; try { await api.delete(`/seller/products/${product._id}`); await dispatch(fetchProducts()).unwrap(); toast.success("Product archived."); load(); } catch (requestError) { toast.error(requestError.response?.data?.message || "Could not archive product or refresh the storefront."); } };
  return <main className="seller-shell"><SellerNavigation active="products"/><header className="seller-page-heading seller-list-heading"><div><p className="seller-eyebrow">YOUR CATALOGUE</p><h1>Products.</h1><p>Manage your active listings and inventory.</p></div><Link to="/seller/products/new" className="seller-primary-link"><FiPlus /> Add product</Link></header>{loading ? <p className="seller-state">Loading products...</p> : error ? <p className="seller-alert" role="alert">{error}</p> : products.length === 0 ? <section className="seller-empty"><FiBox /><h2>No products yet</h2><p>Your products will appear here after you add a listing.</p><Link to="/seller/products/new" className="seller-primary-link">Add your first product <FiArrowUpRight /></Link></section> : <section className="seller-product-list">{products.map((product) => <article className="seller-product-row" key={product._id}><div className="seller-product-picture"><ProductImage src={product.image ? productCardImageUrl(product.image, api.defaults.baseURL, product.sku) : ""} alt={product.name} frameClassName="product-image-frame--seller" /></div><div className="seller-product-copy"><span className={`seller-product-status status-${product.status}`}>{product.status.replace("_", " ")}</span><h2>{product.name}</h2><p>{productCategoryLabel(product.collec)} · ₹{Number(product.price).toLocaleString("en-IN")} {product.sku && `· SKU ${product.sku}`}</p></div><label className="seller-inventory"><span>Stock</span><input type="number" min="0" step="1" aria-label={`Inventory for ${product.name}`} value={quantities[product._id] ?? "0"} onChange={(event) => setQuantities((current) => ({ ...current, [product._id]: event.target.value }))} /><button type="button" onClick={() => updateInventory(product._id)}>Update</button></label><div className="seller-row-actions"><Link to={`/seller/products/${product._id}/edit`} aria-label={`Edit ${product.name}`}><FiEdit2 /></Link><button type="button" onClick={() => archive(product)} aria-label={`Archive ${product.name}`}><FiTrash2 /></button></div></article>)}</section>}</main>;
}
