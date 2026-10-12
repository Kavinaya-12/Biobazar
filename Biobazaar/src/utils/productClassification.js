import taxonomy from "../product-classification.json" with { type: "json" };

export const CLASSIFICATION_TAXONOMY = taxonomy;
const title = (value) => value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
export const classificationCategoryLabel = (value) => title(value || "");
export const classificationTypeLabel = classificationCategoryLabel;
export function isValidProductClassification(collec, productCategory, productType) {
  return Boolean(CLASSIFICATION_TAXONOMY[collec]?.[productCategory]?.includes(productType));
}
export const selectMainProductCategory = (form, collec) => ({ ...form, collec, productCategory: "", productType: "" });
export const selectProductCategory = (form, productCategory) => ({ ...form, productCategory, productType: "", type: "" });
