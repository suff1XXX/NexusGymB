import { weightDetails, weightDetailsLabel } from './weight-details.js';
import { isWorkingSet } from './training-methods.js';
import { parseReps, machineName } from './repetitions.js';
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
  const base=log.weightText ? `${log.weightText}${log.weightUnknown ? ' · вага невідома' : ` = ${log.weight} кг`}` : `${log.weight} кг`;
  const details=weightDetailsLabel(log);
  return details?`${base} · ${details}`:base;
}

export function simpleDone(session, index) {
  if (session?.status !== 'active' || !Number.isInteger(index) || !session.items[index]) throw Error('Вправу не знайдено.');
  const s = copy(session), done = new Set(s.simpleCompleted || []);
  if(s.freeCompleted?.includes(index)){s.freeCompleted=s.freeCompleted.filter(value=>value!==index);done.delete(index);}
  else if (done.has(index)) done.delete(index); else done.add(index);
  s.simpleCompleted = [...done];
  return s;
}

export function saveQuickResult(session, index, reps, value, details=null) {
  if (session?.status !== 'active' || !Number.isInteger(index) || !session.items[index]) throw Error('Перевір вправу та повторення (1–1000).');
  const s = copy(session), weight = parseWeight(value), repetitions = parseReps(reps, { min: 1 });
  const loadDetails=weightDetails(details || s.items[index]);Object.assign(s.items[index],loadDetails);
  const existing=s.logs.findIndex(l=>l.index === index && l.quickResult);
  const log={ index, ...repetitions, ...loadDetails, machine: machineName(s.items[index].machine || ''), ...weight, seconds: 0, metrics: [], quickResult: true, at: Date.now() };
  if (existing < 0) s.logs.push(log); else s.logs[existing]=log;
  return s;
}

export function finishChecklist(session) {
  if (session?.status !== 'active') throw Error('Немає активного тренування.');
  const done = new Set(session.simpleCompleted || []);
  const skipped = session.items.flatMap((item, index) => done.has(index) || session.logs.filter(l => l.index === index && isWorkingSet(l)).length >= (session.setTrackingMode==='free'?1:item.sets) ? [] : [index]);
  return { ...copy(session), skipped, status: 'completed', index: session.items.length, endedAt: Date.now(), restEnd: 0, timerEnd: 0 };
}

export function alternatives(exercises, source) {
  return exercises.filter(e => e.id !== (source.exerciseId || source.id) && !e.archived && e.primary === source.primary)
    .sort((a,b) => Number(b.equipment === source.equipment) - Number(a.equipment === source.equipment) || a.name.localeCompare(b.name, 'uk'));
}
