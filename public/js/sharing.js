import { validProgram, copy } from "./model.js";

const snapshotFields = ["name", "primary", "secondary", "equipment", "purpose", "setup", "position", "technique", "breathing", "mistakes", "caution", "image", "video"];
export function shareableProgram(input) {
  if (!validProgram(input)) throw Error("Програма містить некоректні дані.");
  const program = { name: input.name, type: input.type, days: copy(input.days) };
  for (const key of ["scope", "builderMode", "scheduleMode"]) if (input[key]) program[key] = input[key];
  program.days = program.days.map((day) => ({ weekday: day.weekday, name: day.name, groups: day.groups,
    ...(day.description ? { description: day.description } : {}), items: day.items.map((item) => {
      const result = {};
      for (const key of ["name", "sets", "reps", "seconds", "weight", "rest", "note", "metrics", "setPlans", "builderFeatures"])
        if (item[key] !== undefined) result[key] = copy(item[key]);
      if (typeof item.primary === "string") result.primary = item.primary.slice(0, 100);
      if (typeof item.exerciseId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(item.exerciseId)) result.exerciseId = item.exerciseId;
      if (item.custom || item.exerciseId?.startsWith?.("personal:")) result.custom = true;
      if (item.snapshot && typeof item.snapshot === "object") {
        result.snapshot = Object.fromEntries(snapshotFields.filter((key) => typeof item.snapshot[key] === "string")
          .map((key) => [key, item.snapshot[key].slice(0, 4000)]));
      }
      return result;
    }) }));
  return program;
}

export function shareToken(value) {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ? value : "";
}

export function programShareURL(token, base) {
  if (!shareToken(token)) throw Error("Некоректне посилання на програму.");
  const url = new URL("program.html", base);
  url.searchParams.set("share", token);
  return url.href;
}
