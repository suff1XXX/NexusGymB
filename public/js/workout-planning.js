import {copy,setPlan,validProgram} from './model.js';
import {parseReps} from './repetitions.js';

function units(items) {
  const groups=new Map(),result=[];
  items.forEach((item,index)=>{
    if(item.superset) {
      if(!groups.has(item.superset)){const unit=[];groups.set(item.superset,unit);result.push(unit);}
      groups.get(item.superset).push(index);
    }else result.push([index]);
  });
  return result;
}
function secondsForSet(item,index) {
  const plan=setPlan(item,index);
  if(plan.seconds>0)return plan.seconds;
  let reps=10;
  try {const parsed=parseReps(plan.reps);reps=parsed.repsMax||parsed.reps||10;}catch{}
  return Math.max(20,reps*3);
}
export function estimateWorkoutSeconds(day) {
  let total=day.warmup?.trim()?300:120;
  for(const unit of units(day.items)) {
    const rounds=Math.max(...unit.map(index=>day.items[index].sets));
    for(let round=0;round<rounds;round++) {
      const participating=unit.map(index=>day.items[index]).filter(item=>round<item.sets);
      total+=participating.reduce((sum,item)=>sum+secondsForSet(item,round),0);
      if(round<rounds-1)total+=Math.max(...participating.map(item=>setPlan(item,round).rest||60));
    }
    total+=unit.length*45;
  }
  return total;
}
export function fitWorkoutToTime(source,minutes) {
  if(![30,60].includes(minutes)||!source?.items?.length)throw Error('Обери день із вправами та режим 30 або 60 хвилин.');
  const day=copy(source),originalSeconds=estimateWorkoutSeconds(day),originalSets=day.items.reduce((sum,item)=>sum+item.sets,0);
  const budget=minutes*60;
  const resize=(item,count)=>{item.sets=count;if(item.setPlans)item.setPlans=item.setPlans.slice(0,count);};
  if(originalSeconds>budget) {
    day.items.forEach(item=>resize(item,Math.min(item.sets,minutes===30?2:3)));
    while(estimateWorkoutSeconds(day)>budget) {
      const grouped=units(day.items);
      if(grouped.length>1) {
        const removed=new Set(grouped.at(-1));day.items=day.items.filter((item,index)=>!removed.has(index));
      }else if(day.items.some(item=>item.sets>1))day.items.forEach(item=>resize(item,1));
      else throw Error('Навіть один підхід цього блоку довший за обраний час. Обери інший день або повний план.');
    }
  }
  if(!validProgram({name:'Time budget',type:'Власна програма',days:[{...day,weekday:0,groups:day.groups||''}]}))throw Error('Не вдалося сформувати скорочений план. Перевір вправи у програмі.');
  return {day,minutes,estimatedMinutes:Math.ceil(estimateWorkoutSeconds(day)/60),originalMinutes:Math.ceil(originalSeconds/60),originalExercises:source.items.length,originalSets,
    sets:day.items.reduce((sum,item)=>sum+item.sets,0),reduced:originalSeconds>budget};
}
