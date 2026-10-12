import test from "node:test";
import assert from "node:assert/strict";
import { getProductInformationCoverage, PRODUCT_INFORMATION_FIELDS } from "./productInformationCoverage.js";

test("coverage counts only nonempty actual information values", () => {
  const empty = getProductInformationCoverage({});
  assert.equal(empty.completedCount, 0);
  assert.equal(empty.total, PRODUCT_INFORMATION_FIELDS.length);
  const complete = getProductInformationCoverage(Object.fromEntries(PRODUCT_INFORMATION_FIELDS.map(({ key }) => [key, `Verified ${key}`])));
  assert.equal(complete.completedCount, complete.total);
  for (const { key } of PRODUCT_INFORMATION_FIELDS) {
    assert.equal(getProductInformationCoverage({ [key]: "provided" }).completedCount, 1, `${key} is counted when supplied`);
    assert.notEqual(getProductInformationCoverage({ [key]: "unknown" }).details.find((entry) => entry.key === key).status, "complete");
  }
  assert.equal(getProductInformationCoverage({ ingredients: ["oats", "honey"] }).completedCount, 1);
  assert.equal(getProductInformationCoverage({ ingredients: 42 }).details.find((entry) => entry.key === "ingredients").status, "invalid");
});
