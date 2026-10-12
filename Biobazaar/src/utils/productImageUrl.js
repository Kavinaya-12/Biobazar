const FALLBACK_API_URL = "http://localhost:8001";

export function productImageUrl(value, baseUrl = import.meta.env?.VITE_API_BASE_URL || FALLBACK_API_URL) {
  if (typeof value !== "string" || !value.trim()) return "";
  const image = value.trim();
  if (/^(https?:|data:)/i.test(image)) return image;

  const base = String(baseUrl || FALLBACK_API_URL).replace(/\/+$/, "");
  if (image.startsWith("/")) return `${base}${image}`;
  if (/^uploads\//i.test(image)) return `${base}/${image}`;
  return `${base}/uploads/${image}`;
}
