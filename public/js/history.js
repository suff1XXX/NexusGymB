import { copy, validProgram, validMetrics, localDate } from "./model.js";

export function undoLastSet(session) {
  if (session?.status !== "active" || !session.logs.length) throw Error("Немає підходу для скасування.");
  const s = copy(session), last = s.logs.pop();
  s.index = last.index;
  s.skipped = s.skipped.filter((index) => index < s.index);
  s.restEnd = 0; s.timerEnd = 0;
  return s;
}

export function validSession(s) {
  if (!s || !['planned', 'active', 'completed'].includes(s.status) || typeof s.programId !== 'string' ||
      (s.description !== undefined && (typeof s.description !== 'string' || s.description.length > 4000)) ||
      !validProgram({ name: s.name, type: "Власна програма", days: [{ weekday: 0, name: s.name, groups: "", description: s.description || "", items: s.items }] }) ||
      typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || localDate(new Date(`${s.date}T12:00:00`)) !== s.date ||
      !Array.isArray(s.logs) || !Array.isArray(s.skipped) || s.logs.length > 600 ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > s.items.length ||
      !['startedAt','endedAt','restEnd','timerEnd'].every((key) => Number.isFinite(s[key]) && s[key] >= 0)) return false;
  if (s.status === 'active' && s.items.length && s.index >= s.items.length ||
      s.status === 'completed' && (s.index !== s.items.length || s.endedAt < s.startedAt) ||
      s.status === 'planned' && (s.index !== 0 || s.logs.length || s.skipped.length)) return false;
  const counts = new Map();
  return s.skipped.every((i) => Number.isInteger(i) && i >= 0 && i < s.items.length) && s.logs.every((l) => {
    const item = s.items[l?.index];
    if (!item || !Number.isInteger(l.index) || !Number.isInteger(l.reps) || l.reps < 0 || l.reps > 1000 ||
        !Number.isFinite(l.weight) || l.weight < 0 || l.weight > 1000 ||
        (l.seconds !== undefined && (!Number.isFinite(l.seconds) || l.seconds < 0 || l.seconds > 7200)) ||
        !validMetrics(l.metrics)) return false;
    counts.set(l.index, (counts.get(l.index) || 0) + 1);
    return counts.get(l.index) <= item.sets;
  });
}

export function editCompletedSession(session, changes, now = new Date()) {
  if (session?.status !== 'completed') throw Error("Можна редагувати лише завершене тренування.");
  const { date, name, description, minutes, logs } = changes;
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440 || date > localDate(now))
    throw Error("Перевір дату та тривалість тренування.");
  const end = date === session.date ? session.endedAt : new Date(`${date}T12:00:00`).getTime();
  const s = { ...copy(session), name: name.trim(), description, date, logs: copy(logs), endedAt: end, startedAt: end - minutes * 60000 };
  if (s.logs.length !== session.logs.length || s.logs.some((l, k) => l.index !== session.logs[k].index) || !validSession(s))
    throw Error("Перевір назву, опис і значення виконаних підходів.");
  return s;
}

export function filterHistory(sessions, { query = '', from = '', to = '', exercise = '' } = {}) {
  const normalize = (s) => String(s || '').toLocaleLowerCase('uk').replace(/[’'ʼ]/g, '').trim();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return sessions.filter((s) => s.status === 'completed' && (!from || s.date >= from) && (!to || s.date <= to) &&
    (!exercise || s.items.some((i) => (i.exerciseId || `name:${normalize(i.name)}`) === exercise)) &&
    words.every((word) => normalize(`${s.name} ${s.description || ''} ${s.items.map((i) => i.name).join(' ')}`).includes(word)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt);
}
