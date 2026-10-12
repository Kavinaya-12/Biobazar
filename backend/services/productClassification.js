const taxonomy = require("../../Biobazaar/src/product-classification.json");
const productCategoryLabels = Object.fromEntries(Object.keys(taxonomy).flatMap((main) => Object.keys(taxonomy[main]).map((key) => [key, key.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")])));
const productTypeLabels = Object.fromEntries([...new Set(Object.values(taxonomy).flatMap((categories) => Object.values(categories).flat()))].map((key) => [key, key.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")]));
const validClassification = ({ collec, productCategory, productType }) => Boolean(taxonomy[collec]?.[productCategory]?.includes(productType));

module.exports = { taxonomy, productCategoryLabels, productTypeLabels, validClassification };
