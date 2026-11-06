import { countsAsWorkout, personalRecords, trainingStreak } from './fitness.js';
import { progressSessions } from './manual-sets.js';
export const visibilityDefaults = { activity: false, workouts: false, lastActive: false, progress: false, records: false, streak: false, gymBros: true };
export function profileVisibility(person) {
  return Object.fromEntries(Object.entries(visibilityDefaults).map(([key, fallback]) => [key, typeof person?.visibility?.[key] === 'boolean' ? person.visibility[key] : fallback]));
}
export function sharedRecords(records, preference = null) {
  const keys=preference===null?null:new Set(Array.isArray(preference?.visibleKeys)?preference.visibleKeys:[]);
  return records.filter(record=>keys===null||keys.has(record.key)).slice(0,200);
}
export function recordSharingKeys(records, preference, legacyVisible) {
  return preference===null?(legacyVisible?records.slice(0,200).map(record=>record.key):[]):[...new Set(preference.visibleKeys||[])];
}
export function profileSnapshots(sessions, recordPreference = null, manualSets = []) {
  const completed = sessions.filter(countsAsWorkout);
  const allProgress = progressSessions(completed, manualSets);
  const logs = allProgress.flatMap((s) => s.logs.filter((l) => !l.warmup));
  return {
    progress: { workouts: completed.length, sets: logs.length, volume: logs.reduce((sum, l) => sum + l.reps * l.weight, 0) },
    records: { items: sharedRecords(personalRecords(allProgress), recordPreference), ...(Number.isInteger(recordPreference?.revision)?{visibilityVersion:recordPreference.revision}:{}) },
    streak: { ...trainingStreak(completed), lastWorkoutDate: completed.map((s) => s.date).sort().at(-1) || '' },
  };
}
export function commentThreads(comments) {
  const roots = comments.filter((c) => !c.parentId), known = new Set(roots.map((c) => c.id));
  for (const comment of comments) if (comment.parentId && !known.has(comment.parentId)) {
    roots.push({ id: comment.parentId, deleted: true }); known.add(comment.parentId);
  }
  return roots.map((root) => ({ ...root, replies: comments.filter((c) => c.parentId === root.id)
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)) }));
}
