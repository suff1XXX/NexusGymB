export const blankPerformance = () => ({
  notes: "",
  entries: ["Робоче навантаження", "Результат на 5 повторень", "Максимум на 1 повторення"].map((label, k) => ({
    label, value: "", unit: "кг", reps: k === 1 ? "5" : k === 2 ? "1" : "", date: "", note: "",
  })),
});
export function performanceData(input) {
  if (!input || !Array.isArray(input.entries) || input.entries.length > 30)
    throw Error("Додай не більше 30 показників на вправу.");
  if (typeof input.notes !== "string" || input.notes.length > 4000)
    throw Error("Нотатки — до 4000 символів.");
  const entries = input.entries.filter((entry) => String(entry.value || "").trim() || String(entry.note || "").trim() || entry.date).map((entry) => {
    const result = {};
    for (const [key, max] of Object.entries({ label: 80, value: 80, unit: 20, reps: 30, date: 10, note: 500 })) {
      const value = entry[key] ?? "";
      if (typeof value !== "string" || value.length > max) throw Error("Перевір довжину полів показника.");
      result[key] = value.trim();
    }
    if (!result.label || !result.value) throw Error("Для показника вкажи назву та значення.");
    if (result.date) {
      const date = new Date(`${result.date}T12:00:00`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || Number.isNaN(date.getTime()) ||
          date.getFullYear() !== +result.date.slice(0, 4) || date.getMonth() + 1 !== +result.date.slice(5, 7) || date.getDate() !== +result.date.slice(8, 10))
        throw Error("Перевір дату показника.");
    }
    return result;
  });
  return { entries, notes: input.notes.trim() };
}
