import { countsAsWorkout, personalRecords, trainingStreak } from './fitness.js';
export const visibilityDefaults = { lastActive: false, progress: false, records: false, streak: false, gymBros: true };
export function profileVisibility(person) {
  return Object.fromEntries(Object.entries(visibilityDefaults).map(([key, fallback]) => [key, typeof person?.visibility?.[key] === 'boolean' ? person.visibility[key] : fallback]));
}
export function profileSnapshots(sessions) {
  const completed = sessions.filter(countsAsWorkout);
  const logs = completed.flatMap((s) => s.logs.filter((l) => !l.warmup));
  return {
    progress: { workouts: completed.length, sets: logs.length, volume: logs.reduce((sum, l) => sum + l.reps * l.weight, 0) },
    records: { items: personalRecords(completed).slice(0, 200) },
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
