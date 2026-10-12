import test from "node:test";
import assert from "node:assert/strict";
import { API_BASE_URL, DEVELOPMENT_API_BASE_URL, PRODUCTION_API_BASE_URL } from "./apiBaseUrl.js";
import { productImageUrl } from "./utils/productImageUrl.js";

test("configures the Render URL as the production API fallback", () => {
  assert.equal(PRODUCTION_API_BASE_URL, "https://biobazar.onrender.com");
});

test("keeps local development pointed at the local backend by default", () => {
  assert.equal(API_BASE_URL, DEVELOPMENT_API_BASE_URL);
});

test("builds backend upload URLs from the selected API base URL", () => {
  assert.equal(
    productImageUrl("/uploads/product.png", PRODUCTION_API_BASE_URL),
    "https://biobazar.onrender.com/uploads/product.png"
  );
  assert.equal(
    productImageUrl("uploads/product.png", DEVELOPMENT_API_BASE_URL),
    "http://localhost:8001/uploads/product.png"
  );
});
