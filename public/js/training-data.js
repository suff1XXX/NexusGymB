import { copy, localDate, weekday, setPlan, plannedSession, hasWorkoutContent } from "./model.js";

export function exerciseKey(item) {
  return item.exerciseId || `name:${String(item.name || "").trim().toLocaleLowerCase("uk")}`;
}

export function previousResults(sessions, item, currentId) {
  return sessions.filter((s) => s.status === "completed" && s.id !== currentId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.endedAt - a.endedAt)
    .map((s) => ({ session: s, logs: (s.logs || []).filter((l) =>
      s.items[l.index] && exerciseKey(s.items[l.index]) === exerciseKey(item)) }))
    .find((result) => result.logs.length) || null;
}

export function repeatProgram(session) {
  if (session?.status !== "completed" || !hasWorkoutContent(session))
    throw Error("Завершене тренування не знайдено.");
  const items = copy(session.items).map((item, index) => {
    const logs = session.logs.filter((l) => l.index === index && !l.warmup && !l.quickResult && !l.weightUnknown);
    if (logs.length) item.setPlans = Array.from({ length: item.sets }, (_, k) => {
      const plan = setPlan(item, k), log = logs[k];
      return log ? { ...plan, reps: String(log.reps), weight: log.weight, seconds: log.seconds ?? plan.seconds } : plan;
    });
    return item;
  });
  return { name: session.name, type: "Власна програма",
    builderMode: session.executionMode === "simple" ? "simple" : session.executionMode === "mixed" ? "cross" : "advanced",
    days: [{ weekday: 0, name: "Тренування", groups: "", description: session.description || "", warmup: session.warmup || "", items }] };
}

export function rescheduleSession(session, date, now = new Date()) {
  if (session?.status !== "planned") throw Error("Можна перенести лише заплановане тренування.");
  plannedSession({ name: session.name, type: "Власна програма",
    days: [{ weekday: 0, name: "Тренування", groups: "", description: session.description || "", items: session.items }] }, date, now);
  return { ...copy(session), date };
}

export function monthDays(month) {
  const start = new Date(`${month}-01T12:00:00`);
  if (!/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(start.getTime()) || localDate(start).slice(0, 7) !== month)
    throw Error("Некоректний місяць.");
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
  return { offset: weekday(start), dates: Array.from({ length: end.getDate() }, (_, k) =>
    `${month}-${String(k + 1).padStart(2, "0")}`) };
}

export function calendarEvents(program, sessions, date) {
  const day = program?.scheduleMode !== "sequence" && program?.scope !== "home"
    ? program?.days.find((d) => d.weekday === weekday(new Date(`${date}T12:00:00`))) : undefined;
  return [
    ...(day ? [{ kind: "program", name: day.name, programId: program.id, weekday: day.weekday }] : []),
    ...sessions.filter((s) => s.date === date).map((s) => ({ kind: s.status, name: s.name, id: s.id })),
  ];
}

export function progressSeries(sessions, { metric = "weight", key = "", since = "" } = {}) {
  const byDate = new Map();
  for (const s of sessions) {
    if (s.status !== "completed" || s.date < since) continue;
    if (metric === "frequency") {
      const month = s.date.slice(0, 7);
      byDate.set(month, (byDate.get(month) || 0) + 1);
      continue;
    }
    if (metric === "performed") {
      const indexes = new Set([...(s.simpleCompleted || []), ...s.logs.filter(l => !l.warmup).map(l => l.index)]);
      const value = Number([...indexes].some(index => s.items[index] && (!key || exerciseKey(s.items[index]) === key)));
      if (value) byDate.set(s.date, (byDate.get(s.date) || 0) + value);
      continue;
    }
    const logs = s.logs.filter((l) => !l.warmup && !l.weightUnknown && (metric !== 'volume' || !l.quickResult) && s.items[l.index] && (!key || exerciseKey(s.items[l.index]) === key));
    if (!logs.length) continue;
    const value = metric === "volume" ? logs.reduce((sum, l) => sum + l.weight * l.reps, 0) : Math.max(...logs.map((l) => l.weight));
    byDate.set(s.date, metric === "weight" ? Math.max(byDate.get(s.date) || 0, value) : (byDate.get(s.date) || 0) + value);
  }
  const sorted = [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  if (metric === "frequency" && sorted.length) {
    const cursor = new Date(`${sorted[0].date}-01T12:00:00`), last = sorted.at(-1).date, result = [];
    while (localDate(cursor).slice(0, 7) <= last) {
      const date = localDate(cursor).slice(0, 7);
      result.push({ date, value: byDate.get(date) || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }
  return sorted;
}

export function exportData(state, now = new Date()) {
  return { version: 1, exportedAt: now.toISOString(), programs: copy(state.programs),
    sessions: copy(state.sessions), exercises: copy(state.exercises.filter((e) => e.personal)),
    exercisePreferences: copy(state.exercisePreferences), measurements: copy(state.measurements || []), manualSets: copy(state.manualSets || []) };
}

export function exportCsv(state) {
  const rows = [["Тип", "Програма / тренування", "Дата / день", "Статус", "Вправа", "Підхід", "Повторення", "Вага, кг", "Час, сек", "Відпочинок, сек", "Нотатка", "Додаткові параметри"]];
  for (const measurement of state.measurements || []) rows.push(['Заміри тіла','',measurement.date,'Приватно','','','',measurement.weight ?? '','','',measurement.note || '',JSON.stringify(Object.fromEntries(['waist','chest','hips','biceps','thigh'].filter((key)=>measurement[key] !== undefined).map((key)=>[key,measurement[key]])))]);
  for (const entry of state.manualSets || []) rows.push(['Ручний підхід','',entry.date,'Виконано',entry.exercise,1,entry.reps,entry.weight,'','','','']);
  for (const p of state.programs) for (const d of p.days) {
    if (d.warmup) rows.push(["Розминка", p.name, d.weekday + 1, "", "", "", "", "", "", "", d.warmup]);
    if (d.description || !d.items.length) rows.push(["Програма", p.name, d.weekday + 1, "", d.name, "", "", "", "", "", d.description]);
    for (const item of d.items) for (let k = 0; k < item.sets; k++) {
      const plan = setPlan(item, k);
      rows.push(["Програма", p.name, d.weekday + 1, "", item.name, k + 1, plan.reps, plan.weight, plan.seconds, plan.rest, item.note, JSON.stringify(item.metrics || [])]);
    }
  }
  for (const s of state.sessions) {
    if (s.warmup) rows.push(["Розминка", s.name, s.date, s.warmupSkipped ? "Пропущено" : s.warmupDone ? "Виконано" : "Заплановано", "", "", "", "", "", "", s.warmup]);
    if (s.endedEarly) rows.push(["Тренування", s.name, s.date, "Завершено достроково"]);
    if (s.description) rows.push(["Тренування", s.name, s.date, s.status, "", "", "", "", "", "", s.description]);
    if (s.status === "planned") for (const item of s.items) for (let k = 0; k < item.sets; k++) {
      const plan = setPlan(item, k);
      rows.push(["Тренування", s.name, s.date, s.status, item.name, k + 1, plan.reps, plan.weight, plan.seconds, plan.rest, item.note, JSON.stringify(item.metrics || [])]);
    }
    else {
      for (const index of s.simpleCompleted || []) rows.push(['Вправа', s.name, s.date, 'Виконано за списком', s.items[index]?.name]);
      const counts = new Map();
      if (!s.logs.length && !s.description) rows.push(["Тренування", s.name, s.date, s.status]);
      for (const log of s.logs) {
        const key = `${log.index}:${log.quickResult ? 'quick' : log.warmup ? 'warmup' : 'working'}`;
        const k = counts.get(key) || 0;
        counts.set(key, k + 1);
        rows.push(["Тренування", s.name, s.date, s.status, s.items[log.index]?.name, log.quickResult ? "Найкращий результат" : log.warmup ? `Розминочний ${k + 1}` : k + 1, log.reps, log.weightText || log.weight, log.seconds, "", s.items[log.index]?.note, JSON.stringify(log.metrics || [])]);
      }
    }
  }
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + rows.map((row) => Array.from({ length: rows[0].length }, (_, k) => cell(row[k])).join(",")).join("\r\n");
}
