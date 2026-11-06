import { activityMillis } from './activity.js';
const day = value => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function adminStats(users,access={},now=Date.now()) {
  const today=day(now),weekStart=now-7*86400000;
  const active=users.filter(user=>{const at=activityMillis(user.lastActiveAt);return at>0&&at<=now;});
  const registered=user=>activityMillis(user.registeredAt||user.createdAt);
  const registrations=Array.from({length:7},(_,index)=>{const date=day(now-(6-index)*86400000);return {date,count:users.filter(user=>registered(user)>0&&day(registered(user))===date).length};});
  return {total:users.length,online:active.filter(user=>now-activityMillis(user.lastActiveAt)<=300000),today:active.filter(user=>day(activityMillis(user.lastActiveAt))===today).length,week:active.filter(user=>activityMillis(user.lastActiveAt)>=weekStart).length,newToday:users.filter(user=>registered(user)>0&&day(registered(user))===today).length,newWeek:users.filter(user=>registered(user)>=weekStart&&registered(user)<=now).length,home:users.filter(user=>access[user.id]?.homeWorkouts===true).length,nutrition:users.filter(user=>access[user.id]?.nutrition===true).length,registrations};
}
