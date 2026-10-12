import { API_BASE_URL } from "../apiBaseUrl.js";

export function productImageUrl(value, baseUrl = API_BASE_URL) {
  if (typeof value !== "string" || !value.trim()) return "";
  const image = value.trim();
  if (/^(https?:|data:)/i.test(image)) return image;

  const base = String(baseUrl || API_BASE_URL).replace(/\/+$/, "");
  if (image.startsWith("/")) return `${base}${image}`;
  if (/^uploads\//i.test(image)) return `${base}/${image}`;
  return `${base}/uploads/${image}`;
}
