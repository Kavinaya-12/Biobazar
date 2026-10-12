import test from "node:test";
import assert from "node:assert/strict";
import { productCardDescription, productCardImageUrl, productCardName, recognizedProductCategory } from "./productCardPresentation.js";
import { SAMPLE_PRODUCT_IMAGE_URLS } from "./sampleProductImageUrls.js";

const sampleSku = "BB-DEV-SAMPLE-FOODS-001";
const disclaimer = "FICTIONAL DEVELOPMENT SAMPLE · NOT FOR SALE";

test("legacy sample SVG is replaced by the exact supplied URL for its SKU", () => {
  const svg = `<svg><text>Everyday Oat &amp; Seed Mix</text><text>${disclaimer}</text></svg>`;
  const image = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  assert.equal(productCardImageUrl(image, undefined, sampleSku), "https://images.pexels.com/photos/7655885/pexels-photo-7655885.jpeg");
});

test("all 40 sample image URLs are unique and grouped by the intended sample SKUs", () => {
  const entries = Object.entries(SAMPLE_PRODUCT_IMAGE_URLS);
  const pantry = entries.filter(([sku]) => sku.startsWith("BB-DEV-SAMPLE-FOODS-"));
  const personalCare = entries.filter(([sku]) => sku.startsWith("BB-DEV-SAMPLE-PERSONALCARE-"));

  assert.equal(entries.length, 40);
  assert.equal(pantry.length, 20);
  assert.equal(personalCare.length, 20);
  assert.equal(new Set(entries.map(([, image]) => image)).size, 40);
  assert.ok(entries.every(([, image]) => /^https:\/\//.test(image)));
  assert.equal(productCardImageUrl("data:image/svg+xml,stale", undefined, "BB-DEV-SAMPLE-PERSONALCARE-013"), SAMPLE_PRODUCT_IMAGE_URLS["BB-DEV-SAMPLE-PERSONALCARE-013"]);
});

test("manual product images are preserved without sample-specific transformation", () => {
  const image = "data:image/svg+xml,%3Csvg%3E%3Ctext%3EProduct%3C%2Ftext%3E%3C%2Fsvg%3E";
  assert.equal(productCardImageUrl(image, undefined, "SELLER-001"), image);
});

test("seeded product card names display without legacy sample prefixes", () => {
  assert.equal(productCardName({ sku: sampleSku, name: "[DEV SAMPLE] Oat Mix" }), "Oat Mix");
  assert.equal(productCardName({ sku: sampleSku, name: "DEVELOPMENT SAMPLE — Oat Mix" }), "Oat Mix");
  assert.equal(productCardName({ sku: "SELLER-001", name: "[DEV SAMPLE] Real Seller Name" }), "[DEV SAMPLE] Real Seller Name");
});

test("sample descriptions hide development-only suffixes without mutating source data", () => {
  const product = {
    sku: sampleSku,
    description: "A useful product detail. Fictional development sample; not a genuine product or offer for sale.",
  };
  assert.equal(productCardDescription(product), "A useful product detail.");
  assert.match(product.description, /Fictional development sample/);
  assert.equal(productCardDescription({ sku: sampleSku, description: "Fictional development listing for this sample. Not a real product; not for sale." }), "Fictional development listing for this sample. Not a real product; not for sale.");
  assert.equal(productCardDescription({ sku: "SELLER-001", description: "Seller supplied description." }), "Seller supplied description.");
});

test("sample card descriptions preserve API text while hiding only development disclaimers", () => {
  assert.equal(productCardDescription({ sku: sampleSku, description: "Breakfast pantry listing for catalogue and price sorting." }), "Breakfast pantry listing for catalogue and price sorting.");
  assert.equal(productCardDescription({ sku: sampleSku, description: "Cereal listing for catalogue and search testing." }), "Cereal listing for catalogue and search testing.");
  assert.equal(productCardDescription({ sku: sampleSku, description: "Baking ingredient for Foods page testing." }), "Baking ingredient for Foods page testing.");
  assert.equal(productCardDescription({ sku: sampleSku, description: "Cooking ingredient for varied prices." }), "Cooking ingredient for varied prices.");
  assert.equal(productCardDescription({ sku: sampleSku, description: "This sample listing has useful product details for everyday use." }), "This sample listing has useful product details for everyday use.");
  assert.equal(productCardDescription({ sku: "SELLER-001", description: "Catalogue details supplied by a seller." }), "Catalogue details supplied by a seller.");
});

test("category resolution continues until it finds a recognized category", () => {
  assert.equal(recognizedProductCategory({ collec: "Unmapped", category: "Foods", type: "Household" }), "foods");
  assert.equal(recognizedProductCategory({ collec: "Unmapped", category: "Unknown", type: "Lifestyle" }), "lifestyle");
  assert.equal(recognizedProductCategory({ collec: "Unmapped", category: "Unknown", type: "Other" }), "");
});

