import { totalWeight, weightDetails } from './weight-details.js';
import {copy,localDate} from './model.js';
import {exerciseKey} from './training-data.js';
import {countsAsWorkout} from './fitness.js';

export const replacementReasons={busy:'Тренажер зайнятий',equipment:'Немає потрібного обладнання',variation:'Інший варіант вправи',other:'Інша причина'};
const dateValid=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
export function repetitionRecords(sessions,reps=5,today=localDate()) {
  if(!Number.isInteger(reps)||reps<1||reps>1000)throw Error('Кількість повторень: 1–1000.');
  const result=new Map();
  for(const session of sessions) {
    if(session.status!=='completed'||!dateValid(session.date)||session.date>today)continue;
    for(const log of session.logs||[]) {
      const item=session.items?.[log.index];
      if(!item||log.warmup||log.dropOf!==undefined||log.weightUnknown||log.reps!==reps||log.repsMax>log.reps||!Number.isFinite(log.weight)||log.weight<0||log.weight>1000)continue;
      const key=exerciseKey(item),before=result.get(key);
      if(!before||totalWeight(log)>totalWeight(before)||totalWeight(log)===totalWeight(before)&&session.date>before.date)result.set(key,{key,name:item.name,weight:log.weight,...weightDetails(log),reps,date:session.date,sessionId:session.id});
    }
  }
  return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name,'uk'));
}
export function sessionScope(session,programs=[]) {
  if(['main','home'].includes(session.scope))return session.scope;
  const program=programs.find(p=>p.id===session.programId);
  if(program)return program.scope==='home'?'home':'main';
  return 'unknown';
}
export function activityDays(sessions,programs,year,filter='all',today=localDate(),from='',through=today) {
  if(!Number.isInteger(year)||year<1900||year>2200||!['all','main','home'].includes(filter))throw Error('Перевір рік і тип тренувань.');
  const groups=new Map();
  for(const session of sessions) {
    if(!dateValid(session.date)||session.date>today||(from&&session.date<from)||!session.date.startsWith(`${year}-`)||!countsAsWorkout(session))continue;
    const scope=sessionScope(session,programs);if(filter!=='all'&&scope!==filter)continue;
    const value=groups.get(session.date)||{date:session.date,main:0,home:0,unknown:0,ids:[]};value[scope]++;value.ids.push(session.id);groups.set(session.date,value);
  }
  const dates=[];const start=from&&from>`${year}-01-01`?from:`${year}-01-01`,end=from?through:`${year}-12-31`;let date=new Date(start+'T12:00:00Z');
  while(date.getUTCFullYear()===year&&date.toISOString().slice(0,10)<=end){const key=date.toISOString().slice(0,10);dates.push(groups.get(key)||{date:key,main:0,home:0,unknown:0,ids:[]});date.setUTCDate(date.getUTCDate()+1);}
  return {dates,days:groups.size,workouts:[...groups.values()].reduce((sum,d)=>sum+d.ids.length,0),offset:dates.length?(new Date(dates[0].date+'T12:00:00Z').getUTCDay()+6)%7:0};
}
function canReplace(session,index) {
  if(session?.status!=='active'||!Number.isInteger(index)||!session.items?.[index]||(session.logs||[]).some(log=>log.index===index)||session.simpleCompleted?.includes(index))throw Error('Замінити або повернути можна лише вправу без записаних результатів.');
}
export function replaceForToday(session,index,exercise,reason='busy') {
  canReplace(session,index);
  if(!exercise?.id||!exercise.name||!Object.hasOwn(replacementReasons,reason))throw Error('Перевір вправу й причину заміни.');
  const s=copy(session),original=s.replacements?.[index]?.original||copy(s.items[index]),snapshot=copy(exercise);delete snapshot.id;
  s.replacements={...s.replacements,[index]:{original,replacementId:exercise.id,reason}};
  s.items[index]={...s.items[index],exerciseId:exercise.id,name:exercise.name,primary:exercise.primary||'',snapshot,custom:false,...weightDetails(exercise),weight:0};
  delete s.items[index].alternativeExercise;
  if(s.items[index].setPlans)s.items[index].setPlans=s.items[index].setPlans.map(plan=>({...plan,...weightDetails(exercise),weight:0}));
  return s;
}
export function restoreForToday(session,index) {
  canReplace(session,index);if(!session.replacements?.[index])throw Error('Початкову вправу не знайдено.');
  const s=copy(session);s.items[index]=s.replacements[index].original;delete s.replacements[index];return s;
}
export function pollData(value,now=new Date()) {
  const title=String(value.title||'').trim(),options=value.options;
  const current=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(now).replace(' ','T');
  if(!title||title.length>100||!Array.isArray(options)||options.length<2||options.length>6)throw Error('Вкажи назву та 2–6 варіантів часу.');
  const clean=options.map(option=>({date:String(option.date||''),time:String(option.time||'')}));
  const max=new Date(now.getTime()+90*86400000).toISOString().slice(0,10);
  if(clean.some(o=>!dateValid(o.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(o.time)||`${o.date}T${o.time}`<current||o.date>max)||new Set(clean.map(o=>o.date+'T'+o.time)).size!==clean.length)throw Error('Варіанти мають бути різними, майбутніми та в межах 90 днів. Час — за Києвом.');
  return {title,options:clean};
}

export function activityRegistrationDay(value,today=localDate()) {
  const millis=typeof value?.toMillis==='function'?value.toMillis():typeof value?.seconds==='number'?value.seconds*1000:value;
  const date=new Date(millis),day=Number.isFinite(date.getTime())?localDate(date):today;
  return day>today?today:day;
}
