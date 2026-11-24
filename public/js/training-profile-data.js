import {defaultProfileId,contextProfileId,profileContext,validProfileId} from './training-profiles.js';

// Keep the source history intact. Views receive copies containing only the
// selected profile's results, including workouts that used several profiles.
export function dataProfileId(value,profiles=[]) {
  if(!value)return defaultProfileId;
  const id=contextProfileId(value);
  if(id)return id;
  const alias=profiles.find(profile=>profile.legacyMachine?.toLocaleLowerCase('uk')===String(value).toLocaleLowerCase('uk'));
  return alias?.id||defaultProfileId;
}
export function manualSetsForProfile(entries,id,profiles=[]) {
  return entries.filter(entry=>dataProfileId(entry.machine,profiles)===id).map(entry=>({...entry,machine:profileContext(id)}));
}
export function sessionsForProfile(sessions,id,profiles=[]) {
  return sessions.flatMap(session=>{
    const taggedId=validProfileId(session.trainingProfileId)?session.trainingProfileId:'';
    const fallback=taggedId?profileContext(taggedId):'';
    const itemOwner=index=>dataProfileId(session.items[index]?.machine??fallback,profiles);
    const candidates=session.logs.filter(log=>Number.isInteger(log.index)&&session.items[log.index]&&dataProfileId(log.machine??session.items[log.index]?.machine??fallback,profiles)===id);
    const included=new Set(candidates);
    const logs=candidates.filter(log=>log.dropOf===undefined||included.has(session.logs[log.dropOf]));
    const kept=new Set(logs),logIndexes=new Map();session.logs.forEach((log,index)=>{if(kept.has(log))logIndexes.set(index,logIndexes.size);});
    const done=(session.simpleCompleted||[]).filter(index=>session.items[index]&&itemOwner(index)===id);
    const hasResults=session.logs.length>0||(session.simpleCompleted||[]).length>0;
    const owner=taggedId||dataProfileId(session.items[0]?.machine,profiles);
    if(session.status==='completed'&&hasResults&&!logs.length&&!done.length)return [];
    if(!hasResults&&owner!==id)return [];
    if(!session.items.length)return owner===id?[{...session,logs:[]}]:[];
    const used=new Set([...logs.map(log=>log.index),...done]);
    session.items.forEach((item,index)=>{if(itemOwner(index)===id)used.add(index);});
    const indexes=[...used].sort((a,b)=>a-b),mapping=new Map(indexes.map((old,index)=>[old,index]));
    if(!indexes.length)return [];
    return [{...session,items:indexes.map(index=>({...session.items[index],machine:profileContext(id)})),
      logs:logs.map(log=>({...log,index:mapping.get(log.index),machine:profileContext(id),...(log.dropOf!==undefined?{dropOf:logIndexes.get(log.dropOf)}:{})})),
      simpleCompleted:done.map(index=>mapping.get(index)),
      freeCompleted:(session.freeCompleted||[]).filter(index=>mapping.has(index)).map(index=>mapping.get(index)),
      skipped:(session.skipped||[]).filter(index=>mapping.has(index)).map(index=>mapping.get(index)),
      index:session.status==='completed'?indexes.length:Math.max(0,mapping.get(session.index)??0)}];
  });
}
export const profileRecordId=(profileId,date)=>profileId===defaultProfileId?date:`${profileId}_${date}`;
export const privateRecordsForProfile=(records,id)=>records.filter(record=>(record.profileId||defaultProfileId)===id);
