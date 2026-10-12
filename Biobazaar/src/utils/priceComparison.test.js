import test from "node:test";
import assert from "node:assert/strict";
import { comparePricePosition, normalizedUnitPrice } from "./priceComparison.js";

const item = (id, price, quantity, unit = "g", extras = {}) => ({ _id: id, collec: "Foods", productCategory: "breakfast_cereals", productType: "porridge", price, packageQuantity: quantity, packageUnit: unit, inventoryQuantity: 5, status: "published", ...extras });

test("normalizes mass and volume units and rejects missing or invalid package data", () => {
  assert.equal(normalizedUnitPrice(item("a", 200, 500)).price, 400);
  assert.equal(normalizedUnitPrice(item("a", 200, 0, "g")), null);
  assert.equal(normalizedUnitPrice(item("a", 200, 2, "cup")), null);
  assert.equal(normalizedUnitPrice(item("a", 120, 1, "l")).price, 120);
  assert.equal(normalizedUnitPrice(item("a", 50, 10, "piece")).price, 5);
});

test("requires three distinct in-stock alternatives with matching classifications and dimensions", () => {
  const current = item("target", 100, 250);
  const catalogue = [current, item("a", 190, 500), item("b", 380, 1000), item("c", 200, 500), item("duplicate-a", 190, 500, "g", { _id: "a" }), item("wrong-type", 1, 250, "g", { productType: "oats" }), item("wrong-category", 1, 250, "g", { productCategory: "snacks" }), item("out", 1, 250, "g", { inventoryQuantity: 0 }), item("invalid", 0, 250)];
  assert.equal(comparePricePosition(current, catalogue).kind, "middle");
  assert.equal(comparePricePosition(current, [current, catalogue[1], catalogue[2]]).kind, "insufficient");
  assert.equal(comparePricePosition(item("unknown", 100, 250, "g", { productCategory: "", productType: "" }), catalogue).kind, "insufficient");
  assert.equal(comparePricePosition(current, [current, item("ml", 1, 250, "ml"), item("piece", 1, 250, "piece")]).kind, "insufficient");
});

test("legacy development catalogue fields do not qualify as a structured product comparison", () => {
  const porridge = { _id: "apple-cinnamon-porridge", name: "Apple Cinnamon Porridge", collec: "Foods", type: "Pantry", price: 239, inventoryQuantity: 42, status: "published" };
  const legacyFoods = Array.from({ length: 19 }, (_, index) => ({ _id: `food-${index}`, collec: "Foods", type: "Pantry", price: 100 + index, inventoryQuantity: 8 + index, status: "published" }));
  assert.equal(comparePricePosition(porridge, [porridge, ...legacyFoods]).kind, "insufficient");
  assert.equal(comparePricePosition(porridge, [porridge, ...legacyFoods]).label, "Price comparison unavailable");
  assert.match(comparePricePosition(porridge, [porridge, ...legacyFoods]).reason, /actual package size and unit are missing/);
});

test("uses the median and a documented ten percent band for price positions", () => {
  const catalogue = [item("low", 100, 1000), item("middle-a", 200, 1000), item("middle-b", 220, 1000), item("high", 400, 1000)];
  assert.equal(comparePricePosition(catalogue[0], catalogue).kind, "lower");
  assert.equal(comparePricePosition(catalogue[2], catalogue).kind, "middle");
  assert.equal(comparePricePosition(catalogue[3], catalogue).kind, "higher");
  assert.equal(comparePricePosition(item("target", 100, 1000), [{ ...item("target", 100, 1000) }, item("a", 110, 1000), item("b", 120, 1000), item("c", 130, 1000)]).kind, "lower");
});

test("recalculates from changed price, stock, quantity, and classification values", () => {
  const current = item("target", 100, 1000);
  const alternatives = [item("a", 200, 1000), item("b", 210, 1000), item("c", 220, 1000)];
  assert.equal(comparePricePosition(current, [current, ...alternatives]).kind, "lower");
  alternatives[0].inventoryQuantity = 0;
  assert.equal(comparePricePosition(current, [current, ...alternatives]).kind, "insufficient");
  alternatives[0].inventoryQuantity = 5;
  alternatives[1].packageQuantity = 500;
  assert.equal(comparePricePosition(current, [current, ...alternatives]).kind, "lower");
  alternatives[1].productType = "oats";
  assert.equal(comparePricePosition(current, [current, ...alternatives]).kind, "insufficient");
  alternatives[1].productType = "porridge";
  alternatives[2].price = 80;
  current.price = 500;
  assert.equal(comparePricePosition(current, [current, ...alternatives]).kind, "higher");
});
