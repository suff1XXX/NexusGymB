import { validProgram, copy } from "./model.js";
import { exerciseData } from "./import.js";
import { performanceData } from "./performance.js";
import { validSession } from "./history.js";

export function parseBackup(text) {
  if (text.length > 15000000) throw Error("Резервна копія завелика. Максимум 15 МБ.");
  let data;
  try { data = JSON.parse(text); } catch { throw Error("Некоректний JSON резервної копії."); }
  if (data?.version !== 1 || !['programs','sessions','exercises'].every((key) => Array.isArray(data[key]) && data[key].length <= 5000) ||
      !data.exercisePreferences || typeof data.exercisePreferences !== 'object' || Array.isArray(data.exercisePreferences))
    throw Error("Обери JSON, експортований із профілю Nexus GymB.");
  const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  const unique = (list) => list.every((d) => d && typeof d === 'object' && !Array.isArray(d)) && new Set(list.map((d) => d.id)).size === list.length;
  if (!unique(data.programs) || !unique(data.sessions) || !unique(data.exercises) ||
      !data.programs.every((p) => validId(p.id) && validProgram(p)) ||
      !data.sessions.every((s) => validId(s.id) && validSession(s)) || data.sessions.filter((s) => s.status === 'active').length > 1)
    throw Error("Резервна копія містить некоректні програми або тренування.");
  const programs = data.programs.map((p) => ({ id: p.id, name: p.name, type: p.type, days: copy(p.days), archived: !!p.archived }));
  const sessions = data.sessions.map((s) => copy(s));
  const exercises = data.exercises.map((e) => {
    if (!e || !e.personal || typeof e.id !== 'string' || !e.id.startsWith('personal:') || !validId(e.id.slice(9))) throw Error("Некоректна особиста вправа.");
    return { id: e.id.slice(9), ...exerciseData(e), archived: !!e.archived };
  });
  const preferences = Object.entries(data.exercisePreferences).map(([id, p]) => {
    if (!validId(id.startsWith('personal:') ? id.slice(9) : id) || !p ||
        (p.rating != null && (!Number.isInteger(p.rating) || p.rating < 0 || p.rating > 5))) throw Error("Некоректні налаштування вправи.");
    return { id, favorite: !!p.favorite, rating: p.rating ?? null, ...(p.performance ? { performance: performanceData(p.performance) } : {}) };
  });
  return { programs, sessions, exercises, preferences };
}

export function backupEntries(backup, state, uid) {
  const entries = [], skipped = [];
  const current = { programs: state.programs, sessions: state.sessions, exercises: state.exercises.filter((e) => e.personal).map((e) => ({ id: e.id.slice(9) })),
    preferences: Object.keys(state.exercisePreferences).map((id) => ({ id })) };
  for (const [collection, list] of Object.entries(backup)) for (const record of list) {
    if (current[collection].some((r) => r.id === record.id) || collection === 'sessions' && record.status === 'active' && state.sessions.some((s) => s.status === 'active')) {
      skipped.push(record); continue;
    }
    const { id, ...data } = record;
    entries.push([`users/${uid}/${collection === 'preferences' ? 'exercisePreferences' : collection}/${id}`, data]);
  }
  return { entries, skipped };
}
