import { isWorkingSet } from './training-methods.js';

export const skipReasons = {busy:'Тренажер зайнятий',equipment:'Немає обладнання',time:'Не вистачило часу',energy:'Втома',discomfort:'Дискомфорт',other:'Інша причина',unspecified:'Без уточнення',unfinished:'Тренування завершено раніше',postponed:'Відкладено й не виконано'};
export function exerciseDone(session,index) {
  return !!(session.simpleCompleted?.includes(index) || (session.setTrackingMode==='free' ? session.freeCompleted?.includes(index) :
    session.logs.filter(log=>log.index===index&&isWorkingSet(log)).length>=session.items[index].sets));
}
export function pendingExercises(session) {
  return session.items.flatMap((item,index)=>exerciseDone(session,index)||session.skipped?.includes(index)?[]:[index]);
}
const group=(session,index)=>session.items[index]?.superset ? session.items.flatMap((item,k)=>item.superset===session.items[index].superset?[k]:[]) : [index];
export function nextExerciseChoices(session,index=session.index,{deferring=false}={}) {
  const excluded=new Set(deferring?group(session,index):[index]),deferred=new Set(session.deferred||[]);
  return pendingExercises(session).filter(k=>!excluded.has(k)).sort((a,b)=>Number(deferred.has(a))-Number(deferred.has(b)) ||
    (a-index-1+session.items.length)%session.items.length-(b-index-1+session.items.length)%session.items.length);
}
export function resumeExercise(session,index) {
  if(session?.status!=='active'||!Number.isInteger(index)||!session.items[index]||exerciseDone(session,index))throw Error('Ця вправа вже завершена або недоступна.');
  const s=structuredClone(session),resumed=new Set(group(s,index));
  s.deferred=(s.deferred||[]).filter(k=>!resumed.has(k));
  s.skipped=(s.skipped||[]).filter(k=>k!==index);
  if(s.skipDetails)delete s.skipDetails[index];
  s.index=index;s.restEnd=0;s.timerEnd=0;
  if(s.executionMode==='mixed')s.detailedIndex=[index];
  return s;
}
export function deferExercise(session,index,nextIndex) {
  if(session?.status!=='active'||!Number.isInteger(index)||!session.items[index]||exerciseDone(session,index)||session.skipped.includes(index))throw Error('Відкласти можна невиконану вправу.');
  if(!nextExerciseChoices(session,index,{deferring:true}).includes(nextIndex))throw Error('Обери наступну невиконану вправу.');
  const s=structuredClone(session),indices=group(s,index).filter(k=>!exerciseDone(s,k)&&!s.skipped.includes(k));
  s.deferred=[...new Set([...(s.deferred||[]),...indices])];
  return resumeExercise(s,nextIndex);
}
export function skipExercise(session,index,reason,note='',now=Date.now()) {
  if(session?.status!=='active'||!Number.isInteger(index)||!session.items[index]||exerciseDone(session,index))throw Error('Обери невиконану вправу.');
  if(!Object.hasOwn(skipReasons,reason)||typeof note!=='string'||note.trim().length>200)throw Error('Обери причину; примітка — до 200 символів.');
  const s=structuredClone(session);
  s.skipped=[...new Set([...(s.skipped||[]),index])];s.deferred=(s.deferred||[]).filter(k=>k!==index);
  s.skipDetails={...s.skipDetails,[index]:{reason,note:note.trim(),at:now}};
  s.restEnd=0;s.timerEnd=0;
  return s;
}
export function finalizeSkipped(session,reason='unfinished') {
  const s=structuredClone(session);s.skipDetails={...s.skipDetails};
  for(const index of s.skipped||[])if(!s.skipDetails[index])s.skipDetails[index]={reason:s.deferred?.includes(index)?'postponed':reason,note:'',at:s.endedAt||Date.now()};
  s.deferred=[];return s;
}
export function validWorkoutQueue(s) {
  const validIndex=index=>Number.isInteger(index)&&index>=0&&index<s.items.length;
  if(s.deferred!==undefined&&(!Array.isArray(s.deferred)||s.deferred.length>s.items.length||new Set(s.deferred).size!==s.deferred.length||!s.deferred.every(validIndex)))return false;
  if(s.skipDetails!==undefined){
    if(!s.skipDetails||typeof s.skipDetails!=='object'||Array.isArray(s.skipDetails)||Object.keys(s.skipDetails).length>s.items.length)return false;
    if(!Object.entries(s.skipDetails).every(([key,value])=>String(Number(key))===key&&validIndex(Number(key))&&s.skipped?.includes(Number(key))&&value&&Object.hasOwn(skipReasons,value.reason)&&typeof value.note==='string'&&value.note.length<=200&&Number.isFinite(value.at)&&value.at>=0))return false;
  }
  return true;
}
