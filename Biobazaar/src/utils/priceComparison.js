import { isValidProductClassification } from "./productClassification.js";

const configuredMinimum = Number(import.meta.env?.VITE_MIN_COMPARISON_ALTERNATIVES);
// Minimum is three other listings by default; deployments may set VITE_MIN_COMPARISON_ALTERNATIVES.
export const MIN_COMPARABLE_ALTERNATIVES = Number.isInteger(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 3;
export const SIMILAR_PRICE_TOLERANCE = 0.1;
const INSUFFICIENT = "Price comparison unavailable";

const validPrice = (product) => {
  const value = product?.price ?? product?.amount;
  if (value === "" || value === null || value === undefined) return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
};

export function normalizedUnitPrice(product) {
  const price = validPrice(product);
  const rawQuantity = product?.packageQuantity;
  const quantity = rawQuantity === "" || rawQuantity === null || rawQuantity === undefined ? NaN : Number(rawQuantity);
  const unit = product?.packageUnit;
  if (!price || !Number.isFinite(quantity) || quantity <= 0) return null;
  const units = {
    g: ["weight", quantity / 1000, "kg"], kg: ["weight", quantity, "kg"],
    ml: ["volume", quantity / 1000, "l"], l: ["volume", quantity, "l"],
    piece: ["count", quantity, "piece"], count: ["count", quantity, "piece"],
  };
  const normalized = units[unit];
  if (!normalized || normalized[1] <= 0 || (normalized[0] === "count" && !Number.isInteger(quantity))) return null;
  return { dimension: normalized[0], unit: normalized[2], amount: normalized[1], price: Math.round((price / normalized[1]) * 10000) / 10000 };
}

export function formattedUnitPrice(product) {
  const unit = normalizedUnitPrice(product);
  if (!unit) return "Not provided";
  const amount = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(unit.price);
  return `\u20B9${amount} / ${unit.unit}`;
}

const productId = (product) => String(product?._id || product?.id || "");
const available = (product) => Number(product?.inventoryQuantity) > 0 && (!product?.status || product.status === "published");
const compareGroup = (product) => `${product?.collec || ""}/${product?.productCategory || ""}/${product?.productType || ""}`;
const formatMoney = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

function currentProductIssues(product) {
  const issues = [];
  if (!productId(product)) issues.push("The listing ID is missing.");
  if (!validPrice(product)) issues.push("The listed price is missing or invalid.");
  if (!available(product)) issues.push("This listing is unavailable or out of stock.");
  if (!isValidProductClassification(product?.collec, product?.productCategory, product?.productType)) issues.push("The seller has not provided a valid product type.");
  if (!normalizedUnitPrice(product)) issues.push("The actual package size and unit are missing or invalid (for example, 500 g or 1 l).");
  return issues;
}

export function eligibleComparisonAlternatives(product, catalog) {
  if (currentProductIssues(product).length) return [];
  const ownId = productId(product);
  const ownGroup = compareGroup(product);
  const ownUnit = normalizedUnitPrice(product);
  const seen = new Set([ownId]);
  return (Array.isArray(catalog) ? catalog : []).filter((candidate) => {
    const id = productId(candidate);
    if (!id || seen.has(id) || compareGroup(candidate) !== ownGroup) return false;
    if (!available(candidate) || !validPrice(candidate) || !isValidProductClassification(candidate?.collec, candidate?.productCategory, candidate?.productType)) return false;
    const unit = normalizedUnitPrice(candidate);
    if (!unit || unit.dimension !== ownUnit.dimension || unit.unit !== ownUnit.unit) return false;
    seen.add(id);
    return true;
  });
}

export function comparePricePosition(product, catalog, minimum = MIN_COMPARABLE_ALTERNATIVES) {
  const required = Number.isInteger(minimum) && minimum > 0 ? minimum : MIN_COMPARABLE_ALTERNATIVES;
  const issues = currentProductIssues(product);
  const alternatives = eligibleComparisonAlternatives(product, catalog);
  const eligibleAlternativeCount = alternatives.length;
  if (issues.length || eligibleAlternativeCount < required) {
    const reason = issues.length
      ? `We cannot compare this product fairly yet. ${issues.join(" ")} Once those details are provided, we need ${required} matching, in-stock listings to show a price comparison.`
      : `We found ${eligibleAlternativeCount} matching, in-stock ${eligibleAlternativeCount === 1 ? "listing" : "listings"}. We need ${required} before we can show a price comparison.`;
    return { kind: "insufficient", label: INSUFFICIENT, eligibleAlternativeCount, requiredAlternativeCount: required, reason };
  }

  const currentUnit = normalizedUnitPrice(product);
  const alternativePrices = alternatives.map((alternative) => normalizedUnitPrice(alternative).price).sort((a, b) => a - b);
  const middle = Math.floor(alternativePrices.length / 2);
  const median = alternativePrices.length % 2 ? alternativePrices[middle] : (alternativePrices[middle - 1] + alternativePrices[middle]) / 2;
  const ratio = currentUnit.price / median;
  const label = ratio < 1 - SIMILAR_PRICE_TOLERANCE
    ? "Lower-priced among comparable products."
    : ratio > 1 + SIMILAR_PRICE_TOLERANCE
      ? "Higher-priced among comparable products."
      : "Around the middle of comparable prices.";
  return { kind: ratio < 0.9 ? "lower" : ratio > 1.1 ? "higher" : "middle", label, eligibleAlternativeCount, requiredAlternativeCount: required, comparisonBasis: `Unit price (${currentUnit.unit})`, unitPrice: formatMoney(currentUnit.price), unit: currentUnit };
}
