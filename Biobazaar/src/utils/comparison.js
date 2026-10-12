import { formattedUnitPrice } from "./priceComparison.js";

export const MAX_COMPARISON_PRODUCTS = 3;
const NOT_PROVIDED = "Not provided";

export function toggleComparedProduct(selectedIds, productId, limit = MAX_COMPARISON_PRODUCTS) {
  const id = String(productId || "");
  if (!id) return { selectedIds, action: "invalid" };
  if (selectedIds.includes(id)) {
    return { selectedIds: selectedIds.filter((selectedId) => selectedId !== id), action: "removed" };
  }
  if (selectedIds.length >= limit) return { selectedIds, action: "limit" };
  return { selectedIds: [...selectedIds, id], action: "added" };
}

export function availableComparisonIds(selectedIds, products) {
  const availableIds = new Set((Array.isArray(products) ? products : []).map((product) => String(product?._id || product?.id || "")));
  return selectedIds.filter((id) => availableIds.has(id));
}

const textValue = (value) => {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ") || NOT_PROVIDED;
  if (value === undefined || value === null || value === false) return NOT_PROVIDED;
  const text = String(value).trim();
  return text || NOT_PROVIDED;
};

const formatPrice = (value) => {
  const price = Number(value);
  return Number.isFinite(price) && price > 0
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)
    : NOT_PROVIDED;
};

const stockValue = (value) => {
  if (value === undefined || value === null || value === "") return NOT_PROVIDED;
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 0 ? `${quantity} available` : NOT_PROVIDED;
};

const packageValue = (product) => {
  const quantity = Number(product.packageQuantity);
  return Number.isFinite(quantity) && quantity > 0 && product.packageUnit
    ? `${quantity} ${product.packageUnit}`
    : NOT_PROVIDED;
};
export function productComparisonRows(product = {}) {
  return [
    { label: "Category", value: textValue(product.collec || product.category) },
    { label: "Product category", value: textValue(product.productCategory) },
    { label: "Product type", value: textValue(product.productType) },
    { label: "Price", value: formatPrice(product.price) },
    { label: "Net quantity / pack size", value: packageValue(product) },
    { label: "Unit price", value: formattedUnitPrice(product) },
    { label: "Ingredients / materials", value: textValue(product.ingredients) },
    { label: "Description / features", value: textValue(product.description) },
    { label: "Packaging", value: textValue(product.packaging) },
    { label: "Product origin", value: NOT_PROVIDED },
    { label: "Certification", value: textValue(product.certification) },
    { label: "Verification details", value: textValue(product.evidenceNotes) },
    { label: "Reusable / refill information", value: textValue(product.reusable) },
    { label: "Recycling information", value: textValue(product.recyclable) },
    { label: "Availability", value: stockValue(product.inventoryQuantity) },
    { label: "Shipping details", value: textValue(product.shippingDetails) },
  ];
}

