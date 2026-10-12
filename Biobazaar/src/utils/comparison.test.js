import test from "node:test";
import assert from "node:assert/strict";
import { availableComparisonIds, productComparisonRows, toggleComparedProduct } from "./comparison.js";

test("comparison selection toggles distinct products and enforces a three-product maximum", () => {
  let result = toggleComparedProduct([], "product-1");
  result = toggleComparedProduct(result.selectedIds, "product-1");
  assert.deepEqual(result, { selectedIds: [], action: "removed" });

  let selected = ["product-1", "product-2"];
  result = toggleComparedProduct(selected, "product-2");
  assert.deepEqual(result, { selectedIds: ["product-1"], action: "removed" });
  selected = ["product-1", "product-2", "product-3"];
  assert.deepEqual(toggleComparedProduct(selected, "product-4"), { selectedIds: selected, action: "limit" });
});

test("comparison selection rejects missing IDs and prunes unavailable products", () => {
  assert.equal(toggleComparedProduct([], "").action, "invalid");
  assert.deepEqual(availableComparisonIds(["kept", "missing"], [{ _id: "kept" }]), ["kept"]);
});

test("comparison rows use only available product fields and label missing values", () => {
  const rows = productComparisonRows({
    collec: "Foods",
    type: "Pantry",
    price: 1250,
    ingredients: "Oats",
    description: "Product description",
    inventoryQuantity: 0,
  });
  const values = Object.fromEntries(rows.map(({ label, value }) => [label, value]));

  assert.equal(values.Category, "Foods");
  assert.equal(values["Product type"], "Not provided");
  assert.equal(values["Product category"], "Not provided");
  assert.equal(values.Price, "₹1,250");
  assert.equal(values["Ingredients / materials"], "Oats");
  assert.equal(values["Description / features"], "Product description");
  assert.equal(values.Availability, "0 available");
  assert.equal(values["Net quantity / pack size"], "Not provided");
  assert.equal(values["Unit price"], "Not provided");
  assert.equal(values["Product origin"], "Not provided");
  assert.equal(values.Certification, "Not provided");
});
