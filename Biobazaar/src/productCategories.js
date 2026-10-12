export const PRODUCT_CATEGORIES = [
  { value: "Foods", key: "foods", label: "Pantry", slug: "foods" },
  { value: "PersonalCare", key: "personalCare", label: "Body & care", slug: "personalcare" },
  { value: "Household", key: "household", label: "Home & Living", slug: "household" },
  { value: "Lifestyle", key: "lifestyle", label: "Lifestyle", slug: "lifestyle" },
];

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases = new Map([
  ["foods", ["foods", "food", "pantry", "provisions"]],
  ["personalCare", ["personalcare", "personalcareproducts", "bodycare", "care"]],
  ["household", ["household", "households", "home", "homeliving", "homehousehold"]],
  ["lifestyle", ["lifestyle", "lifestyles", "lifestyleessentials"]],
]);

export const canonicalProductCategory = (value) => {
  const normalized = normalize(value);
  return PRODUCT_CATEGORIES.find((category) => aliases.get(category.key)?.includes(normalized))?.value || "";
};

export const productCategoryLabel = (value) => {
  const canonical = canonicalProductCategory(value);
  return PRODUCT_CATEGORIES.find((category) => category.value === canonical)?.label || (value ? String(value) : "Everyday find");
};

export const productCategoryKey = (value) => {
  const canonical = canonicalProductCategory(value);
  return PRODUCT_CATEGORIES.find((category) => category.value === canonical)?.key || "";
};
