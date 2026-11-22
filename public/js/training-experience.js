import {achievementFacts} from './achievement-catalog.js';
import {exerciseKey} from './training-data.js';
import {workoutSummary} from './workout-summary.js';

export const profileBlocks={medals:'Медалі',goals:'Ціль на тиждень',stats:'Статистика',challenges:'Виклики GymBro',records:'Особисті рекорди',progress:'Графік прогресу',measurements:'Заміри тіла',reflections:'Самопочуття',history:'Історія тренувань',comments:'Коментарі'};
export const defaultBlockOrder=Object.keys(profileBlocks);
export const privateProfileBlocks=['goals','challenges','progress','measurements','reflections','history'];
export function profileLayout(value) {
  const order=value?.order||defaultBlockOrder,visible=value?.visible||defaultBlockOrder;
  if(!Array.isArray(order)||order.length!==defaultBlockOrder.length||new Set(order).size!==order.length||order.some(key=>!Object.hasOwn(profileBlocks,key))||!Array.isArray(visible)||new Set(visible).size!==visible.length||visible.some(key=>!Object.hasOwn(profileBlocks,key)))throw Error('Перевір блоки профілю.');
  return {order:[...order],visible:[...visible]};
}
export function dateOnly(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw Error('Перевір дату.');
  return value;
}
export function shiftDate(value,days) {const date=new Date(dateOnly(value)+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}
export function weekStart(date) {const day=new Date(dateOnly(date)+'T12:00:00Z').getUTCDay();return shiftDate(date,-((day+6)%7));}
export function validCompleted(session,today) {return achievementFacts({sessions:[session],today}).workouts===1;}
export function weeklyProgress(sessions,goals,today) {
  const week=weekStart(today),previous=shiftDate(week,-7),saved=goals.find(goal=>goal.week===week),target=saved?.target||3;
  const workouts=sessions.filter(s=>s.date>=week&&s.date<=today&&validCompleted(s,today));
  const last=sessions.filter(s=>s.date>=previous&&s.date<week&&validCompleted(s,today));
  return {week,end:shiftDate(week,6),target,saved:!!saved,count:workouts.length,percent:Math.min(100,Math.round(workouts.length/target*100)),previous:{week:previous,count:last.length,target:goals.find(g=>g.week===previous)?.target||null,sets:last.reduce((sum,s)=>sum+workoutSummary(s).sets,0),volume:last.reduce((sum,s)=>sum+workoutSummary(s).volume,0)}};
}
const ended=session=>Number(session.endedAt)||Date.parse(session.date+'T23:59:59Z');
function exerciseTotals(session) {
  const rows=new Map();
  (session.items||[]).forEach((item,index)=>{
    const logs=(session.logs||[]).filter(log=>log.index===index&&!log.warmup&&!log.quickResult);
    if(!logs.length)return;
    const known=logs.filter(log=>!log.weightUnknown),key=exerciseKey(item),previous=rows.get(key)||{key,name:item.name,sets:0,reps:0,volume:0,bestWeight:null};
    previous.sets+=logs.length;previous.reps+=logs.reduce((sum,log)=>sum+Number(log.reps||0),0);previous.volume+=known.reduce((sum,log)=>sum+log.weight*log.reps,0);
    previous.unknownWeights=!!previous.unknownWeights||logs.some(log=>log.weightUnknown);
    if(known.length)previous.bestWeight=Math.max(previous.bestWeight??0,...known.map(log=>log.weight));
    rows.set(key,previous);
  });
  return rows;
}
export function compareWorkouts(session,sessions,baselineId='') {
  if(session?.status!=='completed')throw Error('Порівняння доступне після завершення тренування.');
  const earlier=sessions.filter(s=>s.id!==session.id&&s.status==='completed'&&(s.date<session.date||s.date===session.date&&ended(s)<ended(session))).sort((a,b)=>b.date.localeCompare(a.date)||ended(b)-ended(a));
  const keys=new Set((session.items||[]).map(exerciseKey));
  const candidates=earlier.filter(s=>s.items?.some(item=>keys.has(exerciseKey(item)))||s.programId&&s.programId===session.programId&&s.dayId===session.dayId||s.name===session.name);
  const before=baselineId?earlier.find(s=>s.id===baselineId):candidates.find(s=>s.programId&&s.programId===session.programId&&s.dayId===session.dayId)||candidates[0];
  if(!before)return {before:null,candidates};
  const now=workoutSummary(session),old=workoutSummary(before),currentExercises=exerciseTotals(session),oldExercises=exerciseTotals(before);
  return {before,candidates:earlier,now,old,deltas:Object.fromEntries(['minutes','sets','reps','volume'].map(key=>[key,Math.round((now[key]-old[key])*100)/100])),exercises:[...currentExercises.values()].filter(row=>oldExercises.has(row.key)).map(row=>({...row,before:oldExercises.get(row.key)}))};
}
export function reflectionData(value) {
  const difficulty=Number(value.difficulty),energy=Number(value.energy),note=String(value.note||'').trim();
  if(!Number.isInteger(difficulty)||difficulty<1||difficulty>10||!Number.isInteger(energy)||energy<1||energy>5||note.length>1000)throw Error('Складність: 1–10, енергія: 1–5, нотатка: до 1000 символів.');
  return {difficulty,energy,note};
}
export function challengeData(value,today) {
  const title=String(value.title||'').trim(),target=Number(value.target),startDate=dateOnly(value.startDate),endDate=dateOnly(value.endDate);
  if(!title||title.length>80||!Number.isInteger(target)||target<1||target>30||startDate<today||endDate<startDate||endDate>shiftDate(startDate,90)||startDate>shiftDate(today,90))throw Error('Вкажи назву, 1–30 тренувань на учасника та період до 90 днів.');
  return {title,target,startDate,endDate};
}
export function challengeCount(sessions,challenge,today) {return Math.min(challenge.target,sessions.filter(s=>s.date>=challenge.startDate&&s.date<=challenge.endDate&&validCompleted(s,today)).length);}
