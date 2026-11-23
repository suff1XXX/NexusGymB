import { weightDetails, validWeightDetails, sameWeightDetails } from './weight-details.js';
import { validSetPlans } from './model.js';

export const defaultProfileId='profile-1';
export const trainingProfileLimit=access=>access?.extraTrainingProfiles === true ? 5 : 3;
export const validProfileId=id=>/^profile-[1-5]$/.test(String(id));
export const profileContext=id=>{
  if (!validProfileId(id)) throw Error('Профіль тренувань не знайдено.');
  return `profile:${id}`;
};
export const contextProfileId=value=>String(value || '').startsWith('profile:') && validProfileId(String(value).slice(8)) ? String(value).slice(8) : '';
const key=item=>item.exerciseId || `name:${String(item.name || '').trim().toLocaleLowerCase('uk')}`;
const normalized=value=>String(value || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('uk');
export function profileName(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 40) throw Error('Назва профілю — від 1 до 40 символів.');
  return value.trim().replace(/\s+/g,' ');
}
export function defaultTrainingProfile() { return {id:defaultProfileId,name:'Основний',loads:{},createdAt:0,updatedAt:0}; }
export function profileData(value) {
  const name=profileName(value.name),loads=value.loads || {};
  if (typeof loads !== 'object' || Array.isArray(loads) || Object.keys(loads).length > 300) throw Error('У профілі можна зберегти до 300 вправ.');
  for (const [exercise,load] of Object.entries(loads)) {
    if (!exercise || exercise.length > 180 || !load || !validWeightDetails(load) || !Number.isFinite(load.weight) || load.weight < 0 || load.weight > 1000 ||
        typeof load.reps !== 'string' || load.reps.length > 20 || !Number.isFinite(load.weightStep) || load.weightStep < 0.01 || load.weightStep > 100 ||
        !Array.isArray(load.setPlans) || load.setPlans.length < 1 || load.setPlans.length > 20 || !validSetPlans({sets:load.setPlans.length,setPlans:load.setPlans}))
      throw Error('Некоректні ваги підходів у профілі тренувань.');
  }
  const data={name,loads:structuredClone(loads),createdAt:Number(value.createdAt || 0),updatedAt:Number(value.updatedAt || 0)};
  if (![data.createdAt,data.updatedAt].every(Number.isFinite) || data.createdAt < 0 || data.updatedAt < data.createdAt) throw Error('Некоректна дата профілю.');
  if (value.legacyMachine) {
    if (typeof value.legacyMachine !== 'string' || value.legacyMachine.length > 80 || contextProfileId(value.legacyMachine)) throw Error('Некоректне джерело старих записів.');
    data.legacyMachine=value.legacyMachine.trim();
  }
  return data;
}
export function trainingProfiles(records=[]) {
  if (!Array.isArray(records) || records.length > 5) throw Error('Можна мати не більше 5 профілів тренувань.');
  const result=records.map(record=>{
    if (!validProfileId(record.id)) throw Error('Некоректний ID профілю тренувань.');
    return {id:record.id,...profileData(record)};
  });
  if (!result.some(profile=>profile.id === defaultProfileId)) result.push(defaultTrainingProfile());
  for (const getValue of [profile=>profile.id,profile=>normalized(profile.name)]) if (new Set(result.map(getValue)).size !== result.length) throw Error('Назви та ID профілів мають бути різними.');
  const sources=result.filter(profile=>profile.legacyMachine).map(profile=>normalized(profile.legacyMachine));
  if (new Set(sources).size !== sources.length) throw Error('Старі записи вже прив’язані до іншого профілю.');
  return result.sort((a,b)=>a.id.localeCompare(b.id));
}
export const availableProfiles=(profiles,limit=3)=>profiles.filter(profile=>Number(profile.id.slice(-1)) <= limit);
export function profileLabel(value,profiles=[]) {
  const id=contextProfileId(value) || (!value ? defaultProfileId : '');
  if (id) return profiles.find(profile=>profile.id === id)?.name || (id === defaultProfileId ? 'Основний' : `Профіль ${id.slice(-1)}`);
  return `Архів · ${value}`;
}
export function profileForContext(value,profiles=[]) {
  const id=contextProfileId(value) || (!value ? defaultProfileId : '');
  return profiles.find(profile=>profile.id === id) || null;
}
export function assertProfileAvailable(profiles,id,limit) {
  const profile=availableProfiles(profiles,limit).find(profile=>profile.id === id);
  if (!profile) throw Error('Цей профіль недоступний. Ліміт можна збільшити через адміністратора.');
  return profile;
}
export function withProfileLoad(profile,item,now=Date.now()) {
  const data=structuredClone(profile);
  data.loads[key(item)]={...weightDetails(item),weight:item.weight,reps:item.reps,weightStep:item.weightStep ?? 2.5,
    setPlans:Array.from({length:item.sets},(_,k)=>({reps:item.reps,weight:item.weight,seconds:item.seconds,rest:item.rest,...item.setPlans?.[k]}))};
  data.updatedAt=Math.max(now,data.createdAt);
  return {id:profile.id,...profileData(data)};
}
export function initialProfileLoads(session,profiles,limit=3,now=Date.now()) {
  const updated=new Map();
  for (const [index,item] of session.items.entries()) {
    if (session.simpleCompleted?.includes(index)) continue;
    const profile=profileForContext(item.machine,profiles);
    if (!profile || !availableProfiles(profiles,limit).includes(profile)) continue;
    const current=updated.get(profile.id)||profile;
    if (!current.loads[key(item)]) updated.set(profile.id,withProfileLoad(current,item,now));
  }
  return [...updated.values()];
}
export function applyTrainingProfile(session,profile) {
  if (session?.status !== 'active') throw Error('Немає активного тренування.');
  const s=structuredClone(session),context=profileContext(profile.id);
  for (const [index,item] of s.items.entries()) {
    const count=s.logs.filter(log=>log.index === index && !log.warmup && !log.quickResult && log.dropOf === undefined).length;
    if (s.simpleCompleted?.includes(index) || count >= item.sets) continue;
    const load=profile.loads[key(item)];
    // Unlabelled legacy plans belong to the default profile. A new profile starts fresh.
    const keepLegacy=!item.machine && profile.id === defaultProfileId;
    if (load) {
      Object.assign(item,weightDetails(load));item.weight=load.weight;item.reps=load.reps;item.weightStep=load.weightStep;
      item.setPlans=Array.from({length:item.sets},(_,k)=>({...load.setPlans[Math.min(k,load.setPlans.length-1)]}));
    } else if (item.machine !== context && !keepLegacy) {
      item.weight=0;
      if (item.setPlans) item.setPlans=item.setPlans.map(plan=>({...plan,weight:0}));
    }
    item.machine=context;
  }
  return s;
}
export function normalizeProfileContexts(sessions=[],manualSets=[],profiles=[]) {
  const aliases=new Map(profiles.filter(profile=>profile.legacyMachine).map(profile=>[normalized(profile.legacyMachine),profileContext(profile.id)]));
  const replace=value=>aliases.get(normalized(value)) || value;
  return {
    sessions:sessions.map(session=>({...session,items:session.items.map(item=>({...item,...(item.machine ? {machine:replace(item.machine)} : {})})),logs:session.logs.map(log=>({...log,...(log.machine ? {machine:replace(log.machine)} : {})}))})),
    manualSets:manualSets.map(entry=>({...entry,...(entry.machine ? {machine:replace(entry.machine)} : {})})),
  };
}

export function completedProfileLoads(session,profiles,limit=3,now=Date.now()) {
  const updated=new Map();
  for (const [index,item] of session.items.entries()) {
    for (const profile of availableProfiles(profiles,limit)) {
      const logs=session.logs.filter(log=>log.index === index && !log.warmup && !log.quickResult && log.dropOf === undefined &&
        (contextProfileId(log.machine) || (!log.machine?defaultProfileId:'')) === profile.id);
      if (logs.length !== item.sets || logs.some(log=>log.weightUnknown || !sameWeightDetails(log,logs[0]))) continue;
      const plans=logs.map((log,k)=>({reps:item.reps,seconds:item.seconds,rest:item.rest,...item.setPlans?.[k],...weightDetails(log),weight:log.weight}));
      updated.set(profile.id,withProfileLoad(updated.get(profile.id)||profile,{...item,...weightDetails(logs[0]),weight:plans[0].weight,reps:plans[0].reps,setPlans:plans},now));
    }
  }
  return [...updated.values()];
}
