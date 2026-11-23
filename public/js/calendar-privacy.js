import { countsAsWorkout } from './fitness.js';
import { sessionScope } from './workout-additions.js';
import { localDate } from './model.js';

export const calendarScopeLabels={all:'Домашні та за програмою',home:'Лише домашні тренування',main:'Лише тренування за програмою'};
export function calendarSharing(person={}) {
  const value=person.visibility || {};
  return {visible:value.calendar === true,scope:Object.hasOwn(calendarScopeLabels,value.calendarScope)?value.calendarScope:'all'};
}
export function calendarSnapshot(sessions,person={},programs=[],today=localDate()) {
  const {visible,scope}=calendarSharing(person),days=new Map();
  if (visible) for (const session of sessions) {
    const date=String(session.date || '');
    if (!countsAsWorkout(session) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today ||
        !Number.isFinite(Date.parse(date+'T12:00:00Z')) || new Date(date+'T12:00:00Z').toISOString().slice(0,10) !== date) continue;
    const type=sessionScope(session,programs);
    if (!['main','home'].includes(type) || scope !== 'all' && type !== scope) continue;
    const day=days.get(date)||{date,main:0,home:0};day[type]++;days.set(date,day);
  }
  // Only daily totals are shared. Unknown legacy types, IDs, and workout details stay private.
  return {scope,days:[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-6000)};
}
export function publicCalendarDays(snapshot,year,today=localDate()) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw Error('Перевір рік календаря.');
  const scope=Object.hasOwn(calendarScopeLabels,snapshot?.scope)?snapshot.scope:'all';
  const totals=new Map();
  for (const entry of snapshot?.days || []) {
    if (typeof entry.date !== 'string' || !entry.date.startsWith(`${year}-`) || entry.date > today) continue;
    const safe=value=>Number.isInteger(value) && value > 0 ? value : 0;
    const main=scope === 'home'?0:safe(entry.main),home=scope === 'main'?0:safe(entry.home);
    if (main || home) totals.set(entry.date,{date:entry.date,main,home,unknown:0,ids:[]});
  }
  const dates=[],cursor=new Date(`${year}-01-01T12:00:00Z`);
  while (cursor.getUTCFullYear() === year) {
    const date=cursor.toISOString().slice(0,10);dates.push(totals.get(date)||{date,main:0,home:0,unknown:0,ids:[]});
    cursor.setUTCDate(cursor.getUTCDate()+1);
  }
  return {dates,days:dates.filter(day=>day.main+day.home>0).length,workouts:dates.reduce((sum,day)=>sum+day.main+day.home,0),offset:(new Date(`${year}-01-01T12:00:00Z`).getUTCDay()+6)%7};
}
