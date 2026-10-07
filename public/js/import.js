import { groups, validProgram } from "./model.js";

export const importExample = {
  exercises: [{ name: "Жим гантелей", primary: "Груди", equipment: "Гантелі",
    secondary: "Трицепс", purpose: "", setup: "", position: "", technique: "Опиши техніку виконання.",
    breathing: "", mistakes: "", caution: "", image: "", video: "" }],
  programTemplates: [{ name: "Моя програма", type: "Власна програма", days: [
    { weekday: 0, name: "Груди", groups: "Груди", items: [
      { name: "Жим гантелей", primary: "Груди", sets: 3, reps: "10", weight: 10,
        seconds: 0, rest: 60, note: "", metrics: [], setPlans: [
          { reps: "12", weight: 8, seconds: 0, rest: 60 },
          { reps: "10", weight: 10, seconds: 0, rest: 90 },
          { reps: "10", weight: 10, seconds: 0, rest: 90 } ] }
    ] } ] }]
};
export function exerciseData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Очікується об’єкт вправи.");
  const result = {};
  for (const [key, max] of Object.entries({ name: 100, equipment: 100, primary: 100,
    secondary: 200, purpose: 4000, setup: 4000, position: 4000, technique: 4000,
    breathing: 4000, mistakes: 4000, caution: 4000, image: 2000, video: 2000 })) {
    const value = input[key] ?? "";
    if (typeof value !== "string" || value.length > max) throw Error(`Перевір поле вправи «${key}».`);
    result[key] = value.trim();
  }
  if (!result.name || !groups.includes(result.primary))
    throw Error("Вкажи назву та категорію вправи.");
  for (const key of ["image", "video"]) {
    if (!result[key]) continue;
    try { if (new URL(result[key]).protocol !== "https:") throw Error(); }
    catch { throw Error("Посилання повинне починатися з https://"); }
  }
  return result;
}
export function parseImport(text) {
  if (text.length > 700000) throw Error("JSON завеликий (максимум 700 КБ).");
  let value;
  try { value = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }
  catch { throw Error("Некоректний JSON. Перевір коми, лапки та дужки."); }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((k) => !["exercises", "programTemplates"].includes(k)))
    throw Error("Використай об’єкт із полями exercises та programTemplates, як у прикладі.");
  const exercises = value.exercises ?? [], templates = value.programTemplates ?? [];
  if (!Array.isArray(exercises) || !Array.isArray(templates) ||
      !exercises.length && !templates.length || exercises.length + templates.length > 100)
    throw Error("Додай від 1 до 100 вправ або шаблонів.");
  const programs = templates.map((p, index) => {
    if (!validProgram(p)) throw Error(`Шаблон №${index + 1}: перевір назву, тип, дні та підходи.`);
    return { name: p.name, type: p.type, days: p.days, archived: false };
  });
  return { exercises: exercises.map(exerciseData), programTemplates: programs };
}
