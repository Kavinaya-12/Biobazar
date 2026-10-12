/* eslint-disable react/prop-types */
import { FiRepeat, FiX } from "react-icons/fi";
import { productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import { productComparisonRows } from "../utils/comparison";
import { classificationCategoryLabel, classificationTypeLabel } from "../utils/productClassification";
import ProductImage from "./ProductImage";
import "./product-comparison.css";

const money = (value) => Number.isFinite(value) && value > 0 ? `₹${value.toLocaleString("en-IN")}` : "Price not listed";

export default function ProductComparison({
  panelRef,
  products,
  baseUrl,
  unavailableCount,
  message,
  onRemove,
  onClear,
  onClose,
  basketTotal,
  basketBudget,
  onBasketBudgetChange,
}) {
  const rows = productComparisonRows(products[0] || {});
  const guidance = products.length < 2
    ? `Select ${2 - products.length} more product${2 - products.length === 1 ? "" : "s"} to compare. Choose up to three.`
    : products.length === 3
      ? "Three products selected. Remove one before adding another."
      : message || "Compare these two products now or add one more.";

  return (
    <section id="product-comparison" ref={panelRef} className="compare-drawer" aria-labelledby="comparison-title">
      <div className="compare-drawer-heading">
        <div>
          <p className="shop-eyebrow">BIOCOMPARE</p>
          <h2 id="comparison-title">Your shortlist <em>at a glance.</em></h2>
          <p>Compare two or three products using details each listing provides.</p>
        </div>
        <div className="comparison-actions">
          <span className="comparison-count">{products.length} / 3 selected</span>
          <button type="button" className="comparison-clear" onClick={onClear} disabled={!products.length}>Clear</button>
          <button type="button" className="compare-close" onClick={onClose} aria-label="Close comparison"><FiX /></button>
        </div>
      </div>

      <p className="comparison-status" role="status" aria-live="polite">
        {guidance}
      </p>
      {unavailableCount > 0 && <p className="comparison-unavailable" role="status">{unavailableCount} selected product{unavailableCount === 1 ? " is" : "s are"} no longer available and will be removed.</p>}

      {products.length > 0 && (
        <div className="compare-table-wrap" role="region" aria-label="Product comparison table" tabIndex="0">
          {products.length >= 2 ? (
            <table className="compare-table">
              <colgroup>
                <col className="comparison-label-column" />
                {products.map((product) => <col key={product._id || product.id} />)}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Details</th>
                  {products.map((product) => (
                    <th scope="col" key={product._id || product.id}>
                      <div className="comparison-product-heading">
                        <ProductImage src={productCardImageUrl(product.image, baseUrl, product.sku)} alt={productCardName(product)} frameClassName="comparison-product-image" />
                        <strong>{productCardName(product) || "Product"}</strong>
                        <button type="button" onClick={() => onRemove(product)} aria-label={`Remove ${productCardName(product)} from comparison`}><FiX /> Remove</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ label }) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {products.map((product) => {
                      const rawValue = productComparisonRows(product).find((row) => row.label === label)?.value || "Not provided";
                      const value = label === "Product category" && rawValue !== "Not provided" ? classificationCategoryLabel(rawValue) : label === "Product type" && rawValue !== "Not provided" ? classificationTypeLabel(rawValue) : rawValue;
                      return <td key={product._id || product.id}>{value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="comparison-selection-preview">
              <ProductImage src={productCardImageUrl(products[0].image, baseUrl, products[0].sku)} alt={productCardName(products[0])} frameClassName="comparison-product-image" />
              <strong>{productCardName(products[0]) || "Product"}</strong>
              <button type="button" onClick={() => onRemove(products[0])} aria-label={`Remove ${productCardName(products[0])} from comparison`}><FiX /> Remove</button>
            </div>
          )}
        </div>
      )}

      {products.length >= 2 && (
        <div className="basket-summary">
          <span><FiRepeat /> Shortlist total (one of each)</span>
          <strong>{money(basketTotal)}</strong>
          <label className="basket-budget">Budget target <span>₹</span><input aria-label="Comparison budget target" type="number" min="0" value={basketBudget} onChange={(event) => onBasketBudgetChange(event.target.value)} /></label>
          <small>{basketTotal <= Number(basketBudget) ? "Within your planning target." : `${money(basketTotal - Number(basketBudget))} over your planning target.`} This estimate does not add items to your cart.</small>
        </div>
      )}
    </section>
  );
}
