const categoryAliases = {
  Foods: ["Foods", "Food", "Pantry", "Provisions"],
  PersonalCare: ["PersonalCare", "Personal Care", "PersonalCareProducts", "Body Care", "Body & care", "Care"],
  Household: ["Household", "Households", "Home", "Home Living", "Home & Living", "Home & Household"],
  Lifestyle: ["Lifestyle", "Lifestyles", "Lifestyle Essentials"],
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizedAliases = new Map(Object.entries(categoryAliases).flatMap(([canonical, aliases]) => aliases.map((alias) => [normalize(alias), canonical])));

const canonicalProductCategory = (value) => normalizedAliases.get(normalize(value)) || "";
const productCategoryValues = (value) => {
  const canonical = canonicalProductCategory(value);
  return canonical ? categoryAliases[canonical] : [];
};

module.exports = { canonicalProductCategory, productCategoryValues };
