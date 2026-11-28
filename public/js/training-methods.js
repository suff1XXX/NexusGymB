import { weightDetails, sameWeightDetails } from './weight-details.js';
import { parseReps, sameMachine, validReps } from './repetitions.js';

export const isWorkingSet = log => !log.warmup && !log.quickResult && log.dropOf === undefined;
const count = (session, index) => session.logs.filter(log=>log.index === index && isWorkingSet(log)).length;
const key = item => item.exerciseId || `name:${String(item.name || '').trim().toLocaleLowerCase('uk')}`;

export function supersetPartner(items, index) {
  const group = items[index]?.superset;
  if (!group) return -1;
  return items.findIndex((item,k)=>k !== index && item.superset === group);
}

export function validSupersets(items) {
  const groups = new Map();
  for (const item of items) {
    if (item.weightStep !== undefined && (!Number.isFinite(item.weightStep) || item.weightStep < 0.01 || item.weightStep > 100)) return false;
    if (item.superset === undefined || item.superset === '') continue;
    if (typeof item.superset !== 'string' || !item.superset.trim() || item.superset.length > 40) return false;
    const group=groups.get(item.superset)||[];group.push(item);groups.set(item.superset,group);
  }
  return [...groups.values()].every(group=>group.length === 2 && group[0].sets === group[1].sets);
}

export function configureSuperset(session, index, partner = -1) {
  if (session?.status !== 'active' || !Number.isInteger(index) || !session.items[index] || !Number.isInteger(partner) || partner < -1 || partner === index || partner >= session.items.length)
    throw Error('Обери іншу вправу для суперсету.');
  const current = supersetPartner(session.items,index);
  if (current === partner) return structuredClone(session);
  const affected = new Set([index, partner, current, supersetPartner(session.items,partner)]);
  if (session.logs.some(log=>affected.has(log.index)) || [...affected].some(k=>session.simpleCompleted?.includes(k)))
    throw Error('Об’єднуй або роз’єднуй вправи до першого записаного підходу.');
  if (partner >= 0 && session.items[index].sets !== session.items[partner].sets)
    throw Error('Для суперсету задай однакову кількість підходів в обох вправах.');
  const s=structuredClone(session);
  for (const k of affected) if (s.items[k]) delete s.items[k].superset;
  if (partner >= 0) {
    const group=`pair-${Math.min(index,partner)}-${Math.max(index,partner)}`;
    s.items[index].superset=group;s.items[partner].superset=group;
    if (s.executionMode === 'simple') { s.executionMode='mixed';s.detailedIndex=[index]; }
  }
  return s;
}

// Alternate A1 → B1 → A2 → B2. Rest starts after both exercises in a round.
export function continueSuperset(session, performedIndex) {
  const partner=supersetPartner(session.items,performedIndex);
  if (partner < 0 || session.deferred?.includes(partner) || session.skipped?.includes(partner) || session.simpleCompleted?.includes(partner)) return session;
  const own=count(session,performedIndex), other=count(session,partner);
  const extraRound=own>session.items[performedIndex].sets||other>session.items[partner].sets;
  if(extraRound&&own>=session.items[performedIndex].sets&&other>=session.items[partner].sets) {
    session.index=partner;
    if(other<own)session.restEnd=0;
    if(session.executionMode==='mixed')session.detailedIndex=[partner];
    return session;
  }
  if (other < own && other < session.items[partner].sets) {
    session.index=partner;session.restEnd=0;
  } else if (own < session.items[performedIndex].sets) {
    session.index=other < session.items[partner].sets ? partner : performedIndex;
  }
  if (session.executionMode === 'mixed') session.detailedIndex=[session.index];
  return session;
}

export function dropSetValid(logs, position) {
  const log=logs[position];
  if (log.dropOf === undefined) return true;
  const parent=logs[log.dropOf];
  if (!Number.isInteger(log.dropOf) || log.dropOf < 0 || log.dropOf >= position || !parent || !isWorkingSet(parent) ||
      !isWorkingSet({...log,dropOf:undefined}) || log.index !== parent.index || !sameMachine(log,parent.machine || '') || !sameWeightDetails(log,parent) ||
      !validReps(log) || log.reps < 1 || log.weightUnknown || parent.weightUnknown || !Number.isFinite(log.weight) || log.weight < 0) return false;
  const drops=logs.slice(0,position).filter(entry=>entry.dropOf === log.dropOf);
  const previous=drops.at(-1)||parent;
  return drops.length < 5 && log.weight < previous.weight;
}

export function appendDropSet(session, parentIndex, repetitions, weight) {
  const parent=session?.logs?.[parentIndex];
  if (session?.status !== 'active' || !Number.isInteger(parentIndex) || !parent || !isWorkingSet(parent)) throw Error('Спочатку запиши основний підхід.');
  const s=structuredClone(session);
  const log={ index:parent.index, ...parseReps(repetitions,{min:1}), ...weight, ...weightDetails(parent), machine:parent.machine || '',
    seconds:0, metrics:structuredClone(parent.metrics || []), dropOf:parentIndex, at:Date.now() };
  s.logs.push(log);
  if (!dropSetValid(s.logs,s.logs.length-1)) throw Error('У кожному дропі зменшуй відому вагу. До 5 знижень на основний підхід.');
  return s;
}

export function nextWeightSuggestion(sessions, item, {currentId='', beforeDate='9999-12-31', beforeEnd=Infinity}={}) {
  const unavailable=reason=>({status:'unavailable',weights:[],reason});
  if (item.seconds) return unavailable('Підказка доступна для вправ із вагою та повтореннями.');
  const latest=sessions.filter(s=>s.status === 'completed' && s.id !== currentId && s.date <= beforeDate && (s.date < beforeDate || (s.endedAt || 0) <= beforeEnd))
    .map(session=>({session,logs:session.logs.filter(log=>isWorkingSet(log) && session.items[log.index] && key(session.items[log.index]) === key(item) && sameMachine(log,item.machine || '') && sameWeightDetails(log,item)).slice(0,item.sets)}))
    .filter(entry=>entry.logs.length).sort((a,b)=>b.session.date.localeCompare(a.session.date) || (b.session.endedAt||0)-(a.session.endedAt||0))[0];
  if (!latest) return unavailable('Спершу заверши тренування у цьому профілі з записаними підходами.');
  if (latest.logs.length !== item.sets) return unavailable('В останньому тренуванні інша кількість підходів. Потрібен повний запис за поточним планом.');
  if (latest.logs.some(log=>log.weightUnknown || !Number.isFinite(log.weight) || log.weight <= 0)) return unavailable('Для підказки запиши відому робочу вагу в кг у всіх підходах. Позначення на руку / сторону має збігатися з поточним.');
  let targets;
  try { targets=Array.from({length:item.sets},(_,k)=>parseReps(item.setPlans?.[k]?.reps ?? item.reps,{min:1})); }
  catch { return unavailable('Задай ціль повторень числом або діапазоном, наприклад 10-12.'); }
  const step=item.weightStep ?? 2.5;
  if (!Number.isFinite(step) || step < 0.01 || step > 100) return unavailable('Перевір крок зміни ваги.');
  const reached=latest.logs.every((log,k)=>log.reps >= targets[k].repsMax);
  const canIncrease=reached && latest.logs.every(log=>log.weight+step <= 1000);
  return {status:canIncrease?'increase':'keep', date:latest.session.date, step,
    weights:latest.logs.map(log=>Math.round((log.weight+(canIncrease?step:0))*100)/100),
    reason:canIncrease ? 'Верхню межу повторень виконано в усіх підходах. Можна спробувати наступний крок.' :
      reached ? 'Досягнуто межі запису ваги. Залиш поточну вагу.' : 'Залиш попередні ваги: верхню межу повторень ще не підтверджено в усіх підходах. Для діапазону враховується нижня межа фактичного результату.'};
}
