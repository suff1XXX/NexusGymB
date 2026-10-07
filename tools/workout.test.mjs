import test from "node:test";
import assert from "node:assert/strict";
import { copy, newSession, completeSet, setPlan, validProgram, pastSession, advance } from "../public/js/model.js";
import { parseImport, importExample, exerciseData } from "../public/js/import.js";
const program = () => copy(importExample.programTemplates[0]);

test("old programs keep common defaults; separate sets control rest and timer", () => {
  const p = program(), item = p.days[0].items[0];
  assert.equal(validProgram(p), true);
  assert.equal(setPlan(item, 0).weight, 8);
  assert.equal(setPlan(item, 1).weight, 10);
  let s = newSession({ ...p, id: "p" }, p.days[0]);
  s = completeSet(s, 12, 8);
  assert.ok(Math.abs(s.restEnd - Date.now() - 60000) < 100);
  s = completeSet(s, 10, 10);
  assert.ok(Math.abs(s.restEnd - Date.now() - 90000) < 100);
  s = completeSet(s, 10, 10);
  assert.throws(() => completeSet(s, 10, 10), /Усі підходи/);
  assert.equal(advance(s).status, "completed");
  delete item.setPlans;
  assert.equal(validProgram(p), true);
  assert.deepEqual(setPlan(item, 1), { reps: "10", weight: 10, seconds: 0, rest: 60 });
});
test("set plans reject mismatched count and invalid loads", () => {
  const p = program();
  p.days[0].items[0].setPlans.pop();
  assert.equal(validProgram(p), false);
  const q = program();
  q.days[0].items[0].setPlans[0].weight = -1;
  assert.equal(validProgram(q), false);
});
test("backdated workouts save exact individual results and duration", () => {
  const p = program(), now = new Date("2026-10-07T12:00:00");
  const s = pastSession(p, "2026-09-15", 45, now);
  assert.equal(s.date, "2026-09-15");
  assert.equal(s.status, "completed");
  assert.equal(s.manual, true);
  assert.equal(s.programId, "");
  assert.equal(s.endedAt - s.startedAt, 45 * 60000);
  assert.deepEqual(s.logs.map((l) => [l.reps, l.weight]), [[12, 8], [10, 10], [10, 10]]);
  assert.equal(s.index, s.items.length);
  assert.throws(() => pastSession(p, "2026-10-08", 0, now));
  assert.throws(() => pastSession(p, "2026-02-30", 0, now));
  assert.throws(() => pastSession(p, "2026-09-15", -1, now));
  p.days[0].items[0].setPlans[0].reps = "10–12";
  assert.throws(() => pastSession(p, "2026-09-15", 0, now), /точну/);
});
test("JSON import accepts exercise-only, template-only and AI code fences", () => {
  const data = parseImport("```json\n" + JSON.stringify(importExample) + "\n```");
  assert.equal(data.exercises.length, 1);
  assert.equal(data.programTemplates.length, 1);
  assert.equal(parseImport(JSON.stringify({ exercises: importExample.exercises })).programTemplates.length, 0);
  assert.equal(parseImport(JSON.stringify({ programTemplates: importExample.programTemplates })).exercises.length, 0);
  const e = exerciseData({ ...importExample.exercises[0], id: "injected", personal: true });
  assert.equal("id" in e, false);
  assert.equal("personal" in e, false);
});
test("invalid import produces no accepted payload", () => {
  for (const text of ["{bad}", "{}", "null", "[]", '{"unknown":[]}',
    JSON.stringify({ exercises: Array(101).fill(importExample.exercises[0]) }),
    JSON.stringify({ programTemplates: [{ name: "bad" }] }),
    JSON.stringify({ exercises: [{ ...importExample.exercises[0], primary: "unknown" }] }),
    JSON.stringify({ exercises: [{ ...importExample.exercises[0], image: "javascript:alert(1)" }] })])
    assert.throws(() => parseImport(text));
});
