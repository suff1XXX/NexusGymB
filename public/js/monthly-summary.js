import {localDate} from './model.js';
import {countsAsWorkout,personalRecords} from './fitness.js';
import {progressSessions} from './manual-sets.js';
import {isWorkingSet} from './training-methods.js';
import {totalWeight} from './weight-details.js';

export function monthlySummary(sessions,manualSets,month,profile,today=localDate()) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month>today.slice(0,7))throw Error('Обери поточний або минулий місяць.');
  const selected=sessions.filter(session=>session.date?.startsWith(month)&&session.date<=today&&countsAsWorkout(session));
  const analytics=progressSessions(sessions,manualSets).filter(session=>session.status==='completed'&&session.date<=today);
  const current=analytics.filter(session=>session.date?.startsWith(month));
  const logs=current.flatMap(session=>session.logs.filter(log=>!log.warmup&&!log.quickResult));
  const baseline=new Map(personalRecords(analytics.filter(session=>session.date.slice(0,7)<month)).map(record=>[record.key,record]));
  const records=personalRecords(analytics.filter(session=>session.date.slice(0,7)<=month)).filter(record=>{
    const before=baseline.get(record.key);
    return record.date.startsWith(month)&&(!before||totalWeight(record)>totalWeight(before)||totalWeight(record)===totalWeight(before)&&record.reps>before.reps);
  });
  const durations=selected.filter(session=>session.startedAt>0&&session.endedAt>session.startedAt);
  const lastDay=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
  const throughDate=month===today.slice(0,7)?today:`${month}-${lastDay}`;
  const activeDates=new Set([...selected.map(session=>session.date),...current.filter(session=>session.logs.some(log=>!log.warmup)).map(session=>session.date)]);
  return {version:1,month,profileId:profile.id,profileName:profile.name,throughDate,workouts:selected.length,activeDays:activeDates.size,
    sets:logs.filter(isWorkingSet).length,reps:logs.reduce((sum,log)=>sum+log.reps,0),
    volume:Math.round(logs.reduce((sum,log)=>sum+(log.weightUnknown?0:totalWeight(log)*log.reps),0)*100)/100,
    minutes:Math.round(durations.reduce((sum,session)=>sum+(session.endedAt-session.startedAt)/60000,0)),minutesKnown:durations.length>0,
    recordCount:records.length,records,hasActivity:activeDates.size>0};
}
export function monthlySnapshot(summary,now=Date.now()) {
  const fields=['version','month','profileId','profileName','throughDate','workouts','activeDays','sets','reps','volume','minutes','minutesKnown','recordCount'];
  return {...Object.fromEntries(fields.map(field=>[field,summary[field]])),updatedAt:now};
}
