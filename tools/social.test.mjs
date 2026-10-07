import test from "node:test";
import assert from "node:assert/strict";
import { ratingValue, ratingSummary, commentText } from "../public/js/social.js";
test("zero is a rating, an empty selection removes it", () => {
  assert.equal(ratingValue("0"), 0);
  assert.equal(ratingValue("5"), 5);
  assert.equal(ratingValue(""), null);
  for (const value of ["6", "-1", "2.5", "oops"]) assert.throws(() => ratingValue(value));
});
test("public average counts zero and excludes invalid scores", () => {
  assert.deepEqual(ratingSummary([]), { count: 0, average: null });
  assert.deepEqual(ratingSummary([{ score: 0 }, { score: 5 }, { score: null }, { score: 9 }]), { count: 2, average: 2.5 });
});
test("comments reject whitespace and excessive length", () => {
  assert.equal(commentText("  Корисна вправа!\n "), "Корисна вправа!");
  assert.throws(() => commentText(" \n "));
  assert.throws(() => commentText("a".repeat(2001)));
});
