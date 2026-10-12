const placeholder = /^(?:n\/?a|not\s+(?:provided|available|specified)|unknown|tbd|to\s+be\s+determined|nil|-)$/i;

export const PRODUCT_INFORMATION_FIELDS = [
  { key: "certification", label: "Certification" },
  { key: "ingredients", label: "Ingredients / materials" },
  { key: "packaging", label: "Packaging" },
  { key: "reusable", label: "Reuse / refill information" },
  { key: "recyclable", label: "Recycling information" },
  { key: "evidenceNotes", label: "Evidence source / notes" },
];

export function getProductInformationCoverage(product = {}) {
  const details = PRODUCT_INFORMATION_FIELDS.map(({ key, label }) => {
    const rawValue = product[key];
    const value = typeof rawValue === "string" ? rawValue.trim() : Array.isArray(rawValue) && rawValue.every((part) => typeof part === "string") ? rawValue.map((part) => part.trim()).filter(Boolean).join(", ") : "";
    const invalidType = rawValue !== undefined && rawValue !== null && typeof rawValue !== "string" && (!Array.isArray(rawValue) || !rawValue.every((part) => typeof part === "string"));
    const isMissing = !invalidType && value.length === 0;
    const isPlaceholder = !isMissing && placeholder.test(value);
    return { key, label, value, status: isMissing ? "missing" : invalidType || isPlaceholder ? "invalid" : "complete" };
  });
  const completedCount = details.filter((detail) => detail.status === "complete").length;
  return { details, completedCount, total: PRODUCT_INFORMATION_FIELDS.length };
}
