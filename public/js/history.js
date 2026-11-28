import {validWorkoutQueue} from './workout-queue.js';
import { validWeightDetails } from './weight-details.js';
import { dropSetValid } from './training-methods.js';
import { validReps } from './repetitions.js';
import { parseWeight } from './workout-modes.js';
import { copy, validProgram, validMetrics, localDate } from "./model.js";

export function undoLastSet(session) {
  if (session?.status !== "active" || !session.logs.length) throw Error("Немає підходу для скасування.");
  const s = copy(session), last = s.logs.pop();
  if (last.dropOf !== undefined) return s;
  s.index = last.index;
  if(s.setTrackingMode==='free') {
    s.freeCompleted=(s.freeCompleted||[]).filter(index=>index!==last.index);
    s.simpleCompleted=(s.simpleCompleted||[]).filter(index=>index!==last.index);
  }
  if (s.executionMode === 'mixed') s.detailedIndex=[s.index];
  s.skipped = s.skipped.filter((index) => index !== s.index);
  if(s.skipDetails)s.skipDetails=Object.fromEntries(Object.entries(s.skipDetails).filter(([index])=>s.skipped.includes(Number(index))));
  s.deferred=(s.deferred||[]).filter(index=>index!==s.index);
  s.restEnd = 0; s.timerEnd = 0;
  return s;
}

export function validSession(s) {
  if (!s || (s.setTrackingMode!==undefined&&!['planned','free'].includes(s.setTrackingMode)) || !['planned', 'active', 'completed'].includes(s.status) || typeof s.programId !== 'string' ||
      (s.executionMode !== undefined && !['simple','advanced','mixed'].includes(s.executionMode)) ||
      ['simpleCompleted','detailedIndex','freeCompleted'].some(key=>s[key] !== undefined && (!Array.isArray(s[key]) || !Array.isArray(s.items) || new Set(s[key]).size !== s[key].length || !s[key].every(i=>Number.isInteger(i) && i>=0 && i<s.items.length))) ||
      (s.warmup !== undefined && (typeof s.warmup !== 'string' || s.warmup.length > 2000)) ||
      ['endedEarly', 'warmupDone', 'warmupSkipped'].some((key) => s[key] !== undefined && typeof s[key] !== 'boolean') ||
      (s.description !== undefined && (typeof s.description !== 'string' || s.description.length > 4000)) ||
      !validProgram({ name: s.name, type: "Власна програма", days: [{ weekday: 0, name: s.name, groups: "", description: s.description || "", items: s.items }] }) ||
      typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || localDate(new Date(`${s.date}T12:00:00`)) !== s.date ||
      !Array.isArray(s.logs) || !Array.isArray(s.skipped) ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > s.items.length ||
      !['startedAt','endedAt','restEnd','timerEnd'].every((key) => Number.isFinite(s[key]) && s[key] >= 0)) return false;
  if (s.status === 'active' && s.items.length && s.index >= s.items.length ||
      s.status === 'completed' && (s.index !== s.items.length || s.endedAt < s.startedAt) ||
      s.status === 'planned' && (s.index !== 0 || s.logs.length || s.skipped.length)) return false;
  if(!validWorkoutQueue(s))return false;
  if(s.plannedItems!==undefined&&(!Array.isArray(s.plannedItems)||!validProgram({name:s.name,type:'Власна програма',days:[{weekday:0,name:s.name,groups:'',description:s.description||'',items:s.plannedItems}]})))return false;
  const counts = new Map();
  return s.skipped.every((i) => Number.isInteger(i) && i >= 0 && i < s.items.length) && s.logs.every((l, position) => {
    const item = s.items[l?.index];
    if (!item || !Number.isInteger(l.index) || !validReps(l) || !validWeightDetails(l) || (l.machine !== undefined && (typeof l.machine !== 'string' || l.machine.length > 80)) ||
        !Number.isFinite(l.weight) || l.weight < 0 || l.weight > 1000 ||
        (l.seconds !== undefined && (!Number.isFinite(l.seconds) || l.seconds < 0 || l.seconds > 7200)) ||
        (l.warmup !== undefined && typeof l.warmup !== 'boolean') ||
        !validMetrics(l.metrics)) return false;
    if (l.quickResult !== undefined && typeof l.quickResult !== 'boolean') return false;
    if (l.weightText || l.weightUnknown) {
      try { const parsed = parseWeight(l.weightText); if (parsed.weight !== l.weight || parsed.weightUnknown !== l.weightUnknown) return false; } catch { return false; }
    }
    if (!dropSetValid(s.logs,position)) return false;
    if (l.dropOf !== undefined) return true;
    const key = `${l.index}:${l.quickResult ? 'quick' : l.warmup ? 'warmup' : 'working'}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    return !l.quickResult || counts.get(key) === 1;
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
