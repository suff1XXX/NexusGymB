// Event instants are stored as UTC timestamps. Date-only training days are
// calendar dates; they must never be converted through a time zone.
export function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
}
export function timestampMillis(value) {
  if(value===undefined||value===null||value==='')return NaN;
  if(value instanceof Date)return value.getTime();
  if(typeof value?.toMillis==='function')return value.toMillis();
  if(typeof value?.toDate==='function')return value.toDate().getTime();
  if(typeof value?.seconds==='number')return value.seconds*1000+Math.floor((value.nanoseconds||0)/1000000);
  if(typeof value==='number')return value;
  // Strings without a UTC marker or offset are not absolute instants.
  return typeof value==='string'&&/(Z|[+-]\d{2}:?\d{2})$/.test(value)?Date.parse(value):NaN;
}
export function formatInstant(value,locale='uk-UA',options={}) {
  const millis=timestampMillis(value);
  if(!Number.isFinite(millis))return '—';
  return new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short',...options,timeZone:deviceTimeZone()}).format(new Date(millis));
}
function wallParts(instant,timeZone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
}
export function scheduledInstant(date,time,timeZone='Europe/Kyiv') {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return null;
  const [year,month,day]=date.split('-').map(Number),[hour,minute]=time.split(':').map(Number);
  const wall=Date.UTC(year,month-1,day,hour,minute),offsets=new Set();
  // Both sides of a daylight-saving transition are considered. An ambiguous
  // local hour resolves to its first occurrence; nonexistent hours stay invalid.
  try { for(const delta of [-36,0,36]) {
    const probe=wall+delta*3600000,p=wallParts(probe,timeZone);
    offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-probe);
  }
  const candidates=[...offsets].map(offset=>wall-offset).filter(value=>{
    const p=wallParts(value,timeZone);
    return p.year===year&&p.month===month&&p.day===day&&p.hour===hour&&p.minute===minute;
  });
  return candidates.length?Math.min(...candidates):null;
  } catch {return null;}
}
export function formatScheduledTime(date,time,locale='uk-UA',sourceTimeZone='Europe/Kyiv') {
  if(!time)return date||'—';
  const instant=scheduledInstant(date,time,sourceTimeZone);
  return instant===null?`${date} · ${time} (${sourceTimeZone})`:formatInstant(instant,locale);
}
