import { productImageUrl } from "./productImageUrl.js";
import { productCategoryKey } from "../productCategories.js";
import { SAMPLE_PRODUCT_IMAGE_URLS } from "./sampleProductImageUrls.js";

const DEVELOPMENT_SAMPLE_SKU_PREFIX = "BB-DEV-SAMPLE-";

export function productCardName(product) {
  const name = String(product?.name || product?.title || "");
  if (!String(product?.sku || "").startsWith(DEVELOPMENT_SAMPLE_SKU_PREFIX)) return name;
  return name.replace(/^\s*\[?(?:DEV|DEVELOPMENT)\s+SAMPLE\]?\s*(?:[-:|·—]\s*)?/i, "").trim();
}

export function productCardDescription(product) {
  const description = String(product?.description || "");
  if (!String(product?.sku || "").startsWith(DEVELOPMENT_SAMPLE_SKU_PREFIX)) return description;

  const cleanDescription = description
    .replace(/\s*Fictional development sample;\s*not a genuine product or offer for sale\.\s*$/i, "")
    .trim();
  return cleanDescription;
}

export function recognizedProductCategory(product) {
  return [product?.collec, product?.category, product?.type]
    .map(productCategoryKey)
    .find(Boolean) || "";
}

export function productCardImageUrl(value, baseUrl, sku) {
  const sampleImage = SAMPLE_PRODUCT_IMAGE_URLS[String(sku || "")];
  if (sampleImage) return sampleImage;

  const image = productImageUrl(value, baseUrl);
  if (!String(sku || "").startsWith(DEVELOPMENT_SAMPLE_SKU_PREFIX) || !image.startsWith("data:image/svg+xml,")) return image;

  try {
    const svg = decodeURIComponent(image.slice("data:image/svg+xml,".length));
    const cleanSvg = svg.replace(/<text\b[^>]*>\s*FICTIONAL DEVELOPMENT SAMPLE\s*·\s*NOT FOR SALE\s*<\/text>/i, "");
    return `data:image/svg+xml,${encodeURIComponent(cleanSvg)}`;
  } catch {
    return image;
  }
}
