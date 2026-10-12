import test from "node:test";
import assert from "node:assert/strict";
import { isValidProductClassification, selectMainProductCategory, selectProductCategory } from "./productClassification.js";

test("classification pairs must belong to the selected main category", () => {
  assert.equal(isValidProductClassification("Foods", "breakfast_cereals", "porridge"), true);
  assert.equal(isValidProductClassification("Foods", "breakfast_cereals", "dishwashing_liquid"), false);
  assert.equal(isValidProductClassification("Household", "cleaning", "surface_cleaner"), true);
  assert.equal(isValidProductClassification("Unmapped", "cleaning", "surface_cleaner"), false);
});

test("changing a parent classification clears its dependent selections", () => {
  const form = { collec: "Foods", productCategory: "breakfast_cereals", productType: "porridge", type: "Porridge" };
  assert.deepEqual(selectMainProductCategory(form, "Household"), { ...form, collec: "Household", productCategory: "", productType: "" });
  assert.deepEqual(selectProductCategory(form, "snacks"), { ...form, productCategory: "snacks", productType: "", type: "" });
});
