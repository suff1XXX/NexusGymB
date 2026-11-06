import { localDate } from './model.js';

const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ');

export function manualSetData(value, now = new Date()) {
  const exercise = cleanName(value.exercise);
  const weight = Number(value.weight);
  const reps = Number(value.reps);
  const date = String(value.date || localDate(now));
  const key = String(value.exerciseKey || `name:${exercise.toLocaleLowerCase('uk')}`);
  if (!exercise || exercise.length > 100) throw Error('Вкажи назву вправи до 100 символів.');
  if (!Number.isFinite(weight) || weight < 0 || weight > 1000) throw Error('Вага має бути від 0 до 1000 кг.');
  if (!Number.isInteger(reps) || reps < 1 || reps > 1000) throw Error('Повторення мають бути цілим числом від 1 до 1000.');
  const parsed = new Date(`${date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || localDate(parsed) !== date || date > localDate(now))
    throw Error('Обери коректну дату не пізніше сьогодні.');
  if (!key || key.length > 180) throw Error('Не вдалося визначити вправу.');
  return { exercise, exerciseKey: key, weight: Math.round(weight * 100) / 100, reps, date };
}

export function manualSetSessions(entries = []) {
  return entries.map(entry => ({
    id: `manual-set:${entry.id}`,
    manualSet: true,
    status: 'completed',
    name: 'Ручний підхід',
    date: entry.date,
    endedAt: Number(entry.createdAt || entry.updatedAt || 0),
    items: [{ exerciseId: entry.exerciseKey, name: entry.exercise, sets: 1 }],
    logs: [{ index: 0, weight: Number(entry.weight), reps: Number(entry.reps), warmup: false }],
  }));
}

export function progressSessions(sessions = [], entries = []) {
  return [...sessions, ...manualSetSessions(entries)];
}
