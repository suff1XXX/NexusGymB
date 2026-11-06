import { localDate } from './model.js';
import { exerciseKey, previousResults } from './training-data.js';

const dayNumber = (date) => Date.parse(`${date}T00:00:00Z`) / 86400000;
export function memberDays(createdAt, now = new Date()) {
  const date = new Date(createdAt);
  return Number.isFinite(date.getTime()) ? Math.max(1, dayNumber(localDate(now)) - dayNumber(localDate(date)) + 1) : 1;
}
export function countsAsWorkout(session) {
  return session.status === 'completed' && (session.logs.some((l) => !l.warmup) ||
    !session.items.length && !!session.description?.trim() && !session.endedEarly);
}
// A weekly streak leaves room for rest days. The current week may still be in progress.
export function trainingStreak(sessions, today = localDate()) {
  const week = (date) => {
    const day = dayNumber(date);
    return day - ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7);
  };
  const weeks = [...new Set(sessions.filter((s) => countsAsWorkout(s) && s.date <= today)
    .map((s) => week(s.date)).filter(Number.isFinite))].sort((a, b) => a - b);
  let best = 0, run = 0, previous;
  for (const value of weeks) {
    run = value === previous + 7 ? run + 1 : 1;
    best = Math.max(best, run); previous = value;
  }
  return { current: previous >= week(today) - 7 ? run : 0, best,
    trainedThisWeek: weeks.includes(week(today)) };
}
export function personalRecords(sessions) {
  const records = new Map();
  for (const session of sessions.filter((s) => s.status === 'completed')) {
    for (const log of session.logs) {
      const item = session.items[log.index];
      if (!item || log.warmup || log.reps <= 0) continue;
      const key = exerciseKey(item), previous = records.get(key);
      if (!previous || log.weight > previous.weight || log.weight === previous.weight && log.reps > previous.reps)
        records.set(key, { key, name: item.name, weight: log.weight, reps: log.reps, date: session.date });
    }
  }
  return [...records.values()].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}
export function previousWorkingSet(sessions, item, currentId, position) {
  // Skip warmup-only sessions when looking for the most recent working results.
  const previous = previousResults(sessions.map((s) => ({ ...s, logs: s.logs.filter((l) => !l.warmup) })), item, currentId);
  if (!previous) return null;
  return previous.logs[Math.min(position, previous.logs.length - 1)] || null;
}
