import { totalWeight } from './weight-details.js';
import { sameMachine } from './repetitions.js';
import {exerciseKey} from './training-data.js';
export function exerciseResults(sessions,item,machine=null) {
  const key=exerciseKey(item),entries=[];
  for(const session of sessions) {
    if(session.status!=='completed')continue;
    (session.logs||[]).forEach((log,logIndex)=>{
      if(machine !== null && !sameMachine(log,machine)||log.warmup||!session.items[log.index]||exerciseKey(session.items[log.index])!==key)return;
      entries.push({sessionId:session.id,sessionName:session.name,date:session.date,endedAt:session.endedAt||0,logIndex,log});
    });
  }
  entries.sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.endedAt-a.endedAt||b.logIndex-a.logIndex);
  const known=entries.filter(entry=>!entry.log.weightUnknown&&Number.isFinite(entry.log.weight)&&entry.log.reps>0);
  const best=[...known].sort((a,b)=>totalWeight(b.log)-totalWeight(a.log)||b.log.reps-a.log.reps)[0]||null;
  return {entries,latest:entries[0]||null,best,workouts:new Set(entries.map(entry=>entry.sessionId)).size};
}
