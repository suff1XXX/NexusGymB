import { isWorkingSet } from './training-methods.js';
import { totalWeight } from './weight-details.js';
import { parseReps } from './repetitions.js';
export function captureWorkoutPlan(session) {
  if(session.plannedItems)return session;
  return {...session,plannedItems:structuredClone(session.items.map((item,index)=>session.replacements?.[index]?.original||item))};
}
export function compareWorkoutPlan(session) {
  const baseline=session.plannedItems||session.items.map((item,index)=>session.replacements?.[index]?.original||item);
  const rows=session.items.map((item,index)=>{
    const planned=baseline[index],logs=session.logs.filter(log=>log.index===index&&isWorkingSet(log));
    const checked=session.simpleCompleted?.includes(index),quick=session.logs.some(log=>log.index===index&&log.quickResult);
    const skipped=session.skipped?.includes(index),replacement=!!planned&&(planned.exerciseId!==item.exerciseId||planned.name!==item.name);
    let changed=false,unknown=false;
    for(const [position,log] of logs.entries()) {
      if(!planned){changed=true;continue;}
      const plan={...planned,...planned.setPlans?.[position]};
      if(log.weightUnknown||plan.weightUnknown)unknown=true;
      else if(Math.abs(totalWeight(log)-totalWeight(plan))>.001)changed=true;
      if(plan.seconds){if(log.seconds!==plan.seconds)changed=true;}
      else {try{const reps=parseReps(plan.reps);if(log.reps<reps.reps||(log.repsMax??log.reps)>reps.repsMax)changed=true;}catch{unknown=true;}}
    }
    const setsKnown=logs.length>0||!checked&&!quick;
    const complete=checked||!!planned&&logs.length>=planned.sets;
    const status=skipped?(logs.length||checked?'partial':'skipped'):!planned?'added':replacement?'replaced':!logs.length&&checked?'checked':!logs.length&&quick?'quick':!logs.length?'missing':!complete?'partial':changed||logs.length!==planned.sets?'changed':unknown?'unknown':'matched';
    return {index,planned,item,logs,checked,quick,setsKnown,status,replacement,changed,unknown};
  });
  return {rows,snapshot:!!session.plannedItems,plannedSets:baseline.reduce((sum,item)=>sum+item.sets,0),actualSets:rows.reduce((sum,row)=>sum+row.logs.length,0),checkedOnly:rows.filter(row=>row.checked&&!row.logs.length).length};
}
