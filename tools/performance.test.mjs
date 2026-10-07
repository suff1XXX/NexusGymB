import test from "node:test";
import assert from "node:assert/strict";
import { blankPerformance, performanceData } from "../public/js/performance.js";
test("working load and records can have different weights and repetitions", () => {
  const data = blankPerformance();
  ["30", "40", "50"].forEach((value, k) => { data.entries[k].value = value; });
  data.entries[0].reps = "8–12";
  data.notes = "  З контролем техніки\nНаступна ціль — 55 кг.  ";
  const result = performanceData(data);
  assert.deepEqual(result.entries.map((r) => [r.value, r.reps]), [["30", "8–12"], ["40", "5"], ["50", "1"]]);
  assert.match(result.notes, /^З контролем/);
});
test("unused rows are ignored; arbitrary units and zero values are allowed", () => {
  assert.deepEqual(performanceData(blankPerformance()), { entries: [], notes: "" });
  const row = { label: "Кардіо", value: "5", unit: "км", date: "2026-10-07", reps: "", note: "25 хв" };
  assert.equal(performanceData({ entries: [row], notes: "" }).entries[0].unit, "км");
  row.value = "0";
  assert.equal(performanceData({ entries: [row], notes: "" }).entries[0].value, "0");
});
test("incomplete records and impossible dates are rejected", () => {
  const data = blankPerformance();
  data.entries[0].value = "30"; data.entries[0].date = "2026-02-30";
  assert.throws(() => performanceData(data), /дату/);
  data.entries[0].date = ""; data.entries[0].label = "";
  assert.throws(() => performanceData(data), /назву/);
  assert.throws(() => performanceData({ entries: Array(31).fill({}), notes: "" }));
});
