export const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
export const dayCodes = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export const groups = [
  "Груди",
  "Спина",
  "Плечі",
  "Біцепс",
  "Трицепс",
  "Ноги",
  "Сідниці",
  "Прес",
  "Кардіо",
  "Розминка",
];
export const types = ["Верх / Низ", "Спліт", "Все тіло", "Власна програма"];
export const copy = (x) => structuredClone(x);
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekday(d = new Date()) {
  return (d.getDay() + 6) % 7;
}
export function remaining(end, now = Date.now()) {
  return Math.max(0, Math.ceil((end - now) / 1000));
}
export function clock(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function schedule(program, day = weekday()) {
  return program?.days.find((x) => x.weekday === day);
}
export function nextDay(program, day = weekday()) {
  return [...(program?.days || [])].sort(
    (a, b) => ((a.weekday - day + 7) % 7) - ((b.weekday - day + 7) % 7),
  )[0];
}
export function newSession(program, day) {
  return {
    programId: program.id,
    name: day.name,
    date: localDate(),
    startedAt: Date.now(),
    endedAt: 0,
    status: "active",
    index: 0,
    restEnd: 0,
    timerEnd: 0,
    items: copy(day.items),
    logs: [],
    skipped: [],
    updatedAt: Date.now(),
  };
}
export function validMetrics(metrics) {
  return (
    metrics === undefined ||
    (Array.isArray(metrics) &&
      metrics.length <= 8 &&
      metrics.every(
        (m) =>
          m &&
          typeof m.name === "string" &&
          m.name.trim().length > 0 &&
          m.name.length <= 40 &&
          typeof m.value === "string" &&
          m.value.trim().length > 0 &&
          m.value.length <= 80 &&
          typeof m.unit === "string" &&
          m.unit.length <= 20,
      ))
  );
}
const bounded = (v, max) => Number.isFinite(v) && v >= 0 && v <= max;
export function validProgram(p) {
  return (
    !!p &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 100 &&
    types.includes(p.type) &&
    Array.isArray(p.days) &&
    p.days.length > 0 &&
    p.days.length <= 7 &&
    new Set(p.days.map((d) => d.weekday)).size === p.days.length &&
    p.days.every(
      (d) =>
        Number.isInteger(d.weekday) &&
        d.weekday >= 0 &&
        d.weekday <= 6 &&
        typeof d.name === "string" &&
        d.name.trim().length > 0 &&
        d.name.length <= 100 &&
        typeof d.groups === "string" &&
        d.groups.length <= 200 &&
        Array.isArray(d.items) &&
        d.items.length <= 30 &&
        d.items.every(
          (i) =>
            typeof i.name === "string" &&
            i.name.trim() &&
            Number.isInteger(i.sets) &&
            i.sets >= 1 &&
            i.sets <= 20 &&
            typeof i.reps === "string" &&
            i.reps.length <= 20 &&
            bounded(i.rest, 600) &&
            bounded(i.seconds, 7200) &&
            bounded(i.weight, 1000) &&
            (i.note === undefined || (typeof i.note === "string" && i.note.length <= 500)) &&
            validMetrics(i.metrics),
        ),
    )
  );
}
export function completeSet(session, reps, weight, metrics = []) {
  const s = copy(session),
    item = s.items[s.index];
  if (s.status !== "active" || !item) throw Error("Вправу не знайдено");
  if (
    !Number.isInteger(reps) ||
    !bounded(reps, 1000) ||
    !bounded(weight, 1000) ||
    !validMetrics(metrics)
  )
    throw Error("Перевір значення підходу");
  const planned = item.metrics || [];
  if (
    metrics.length !== planned.length ||
    metrics.some((m, k) => m.name !== planned[k].name || m.unit !== planned[k].unit)
  )
    throw Error("Параметри не відповідають вправі");
  if (s.logs.filter((l) => l.index === s.index).length >= item.sets)
    throw Error("Усі підходи вже виконано");
  s.logs.push({ index: s.index, reps, weight, metrics: copy(metrics), at: Date.now() });
  s.timerEnd = 0;
  s.restEnd = Date.now() + item.rest * 1000;
  return s;
}
export function advance(session, skip = false) {
  const s = copy(session);
  if (skip && !s.skipped.includes(s.index)) s.skipped.push(s.index);
  s.index++;
  s.restEnd = 0;
  s.timerEnd = 0;
  if (s.index >= s.items.length) {
    s.status = "completed";
    s.endedAt = Date.now();
  }
  return s;
}
