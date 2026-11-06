import { localDate } from './model.js';
export const measurementFields = {
  weight: { label:'Вага тіла', unit:'кг', min:20, max:500 },
  waist: { label:'Талія', unit:'см', min:20, max:300 },
  chest: { label:'Груди', unit:'см', min:20, max:300 },
  hips: { label:'Стегна', unit:'см', min:20, max:300 },
  biceps: { label:'Біцепс', unit:'см', min:5, max:100 },
  thigh: { label:'Обхват ноги', unit:'см', min:10, max:200 },
};
export function measurementData(input, now = new Date()) {
  if (!input || typeof input !== 'object') throw Error('Перевір заміри.');
  const date = String(input.date || ''), parsed = new Date(`${date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || localDate(parsed) !== date || date < '1900-01-01' || date > localDate(now))
    throw Error('Обери коректну дату не пізніше сьогодні.');
  const result = { date };
  for (const [key, config] of Object.entries(measurementFields)) {
    const raw = input[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    if (!['number','string'].includes(typeof raw)) throw Error(`Перевір поле «${config.label}».`);
    const value = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(value) || value < config.min || value > config.max) throw Error(`«${config.label}»: від ${config.min} до ${config.max} ${config.unit}.`);
    result[key] = Math.round(value * 100) / 100;
  }
  if (!Object.keys(measurementFields).some((key)=>key in result)) throw Error('Заповни хоча б один замір.');
  const note = input.note ?? '';
  if (typeof note !== 'string' || note.length > 500) throw Error('Примітка має містити до 500 символів.');
  return { ...result, note: note.trim() };
}
export function measurementSeries(records, metric, since = '') {
  if (!Object.hasOwn(measurementFields, metric)) return [];
  return records.filter((r)=>r.date >= since && Number.isFinite(r[metric]))
    .sort((a,b)=>a.date.localeCompare(b.date)).map((r)=>({date:r.date,value:r[metric]}));
}
