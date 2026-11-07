import { copy } from './model.js';

export function parseWeight(value) {
  const text = String(value ?? '').trim().toLowerCase().replace(/[,]/g, '.').replace(/[×х]/g, 'x').replace(/\s/g, '');
  const match = /^(\d+)x(\d+(?:\.\d+)?|\?)$/.exec(text);
  const weight = match ? (match[2] === '?' ? 0 : Number(match[1]) * Number(match[2])) : Number(text);
  if (!text || (!match && !/^\d+(?:\.\d+)?$/.test(text)) || !Number.isFinite(weight) || weight < 0 || weight > 1000 || (match && (Number(match[1]) < 1 || Number(match[1]) > 1000)))
    throw Error('Вкажи вагу до 1000 кг: 60, 6x10 або 6x?.');
  return { weight, weightText: match ? text : '', weightUnknown: !!match && match[2] === '?' };
}

export function weightLabel(log) {
  return log.weightText ? `${log.weightText}${log.weightUnknown ? ' · вага невідома' : ` = ${log.weight} кг`}` : `${log.weight} кг`;
}

export function simpleDone(session, index) {
  if (session?.status !== 'active' || !Number.isInteger(index) || !session.items[index]) throw Error('Вправу не знайдено.');
  const s = copy(session), done = new Set(s.simpleCompleted || []);
  if (done.has(index)) done.delete(index); else done.add(index);
  s.simpleCompleted = [...done];
  return s;
}

export function saveQuickResult(session, index, reps, value) {
  if (session?.status !== 'active' || !Number.isInteger(index) || !session.items[index] || !Number.isInteger(reps) || reps < 1 || reps > 1000) throw Error('Перевір вправу та повторення (1–1000).');
  const s = copy(session), weight = parseWeight(value);
  s.logs = s.logs.filter(l => !(l.index === index && l.quickResult));
  s.logs.push({ index, reps, ...weight, seconds: 0, metrics: [], quickResult: true, at: Date.now() });
  return s;
}

export function finishChecklist(session) {
  if (session?.status !== 'active') throw Error('Немає активного тренування.');
  const done = new Set(session.simpleCompleted || []);
  const skipped = session.items.flatMap((item, index) => done.has(index) || session.logs.filter(l => l.index === index && !l.warmup && !l.quickResult).length >= item.sets ? [] : [index]);
  return { ...copy(session), skipped, status: 'completed', index: session.items.length, endedAt: Date.now(), restEnd: 0, timerEnd: 0 };
}

export function alternatives(exercises, source) {
  return exercises.filter(e => e.id !== (source.exerciseId || source.id) && !e.archived && e.primary === source.primary)
    .sort((a,b) => Number(b.equipment === source.equipment) - Number(a.equipment === source.equipment) || a.name.localeCompare(b.name, 'uk'));
}
