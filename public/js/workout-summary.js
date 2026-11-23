import { totalWeight } from './weight-details.js';
import { isWorkingSet } from './training-methods.js';
import { personalRecords } from './fitness.js';
import {repetitionRecords} from './workout-additions.js';
export function workoutSummary(session, sessions = []) {
  if (session?.status !== 'completed') throw Error('Підсумок доступний після завершення тренування.');
  const logs = session.logs || [], working = logs.filter((l)=>!l.warmup);
  const earlier = sessions.filter((s)=>s.id !== session.id && s.status === 'completed' &&
    (s.date < session.date || s.date === session.date && s.endedAt < session.endedAt));
  const baseline = new Map(personalRecords(earlier).map((r)=>[r.key,r]));
  const records = personalRecords([session]).filter((r)=>{
    const before=baseline.get(r.key);
    return !before || totalWeight(r) > totalWeight(before) || totalWeight(r) === totalWeight(before) && r.reps > before.reps;
  }).map((r)=>({...r,first:!baseline.has(r.key)}));
  return {
    minutes: Number.isFinite(session.endedAt-session.startedAt)?Math.max(0,Math.round((session.endedAt-session.startedAt)/60000)):0,
    minutesKnown:Number.isFinite(session.endedAt-session.startedAt),
    volumeKnown:working.some(l=>!l.quickResult&&!l.weightUnknown),unknownWeightSets:working.filter(l=>!l.quickResult&&l.weightUnknown).length,
    sets:working.filter(isWorkingSet).length,dropSets:working.filter(l=>l.dropOf !== undefined).length,superSets:new Set(session.items.filter(item=>item.superset).map(item=>item.superset)).size,quickResults:working.filter(l=>l.quickResult).length,warmupSets:logs.filter(l=>l.warmup).length,
    reps:working.filter(l=>!l.quickResult).reduce((sum,l)=>sum+l.reps,0),
    volume:working.reduce((sum,l)=>sum+(l.weightUnknown || l.quickResult ? 0 : totalWeight(l)*l.reps),0),
    exercises:new Set([...working.map((l)=>l.index), ...(session.simpleCompleted || [])]).size,
    plannedExercises:session.items.length,
    plannedSets:session.executionMode === 'simple' ? 0 : session.items.reduce((sum,item)=>sum+item.sets,0),
    records,
    repetitionRecords:[5,8,10,12].flatMap(reps=>{
      const previous=new Map(repetitionRecords(earlier,reps,session.date).map(record=>[record.key,record]));
      return repetitionRecords([session],reps,session.date).filter(record=>!previous.has(record.key)||totalWeight(record)>totalWeight(previous.get(record.key))).map(record=>({...record,first:!previous.has(record.key)}));
    }),
  };
}
