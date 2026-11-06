const key = (uid, id) => `nexus:set-draft:${encodeURIComponent(uid)}:${encodeURIComponent(id)}`;
export function saveSetDraft(storage, uid, session, fields) {
  if (!uid || session?.status !== 'active') return;
  storage.setItem(key(uid, session.id), JSON.stringify({ index: session.index, logs: session.logs.length, fields }));
}
export function loadSetDraft(storage, uid, session) {
  try {
    const data = JSON.parse(storage.getItem(key(uid, session.id)) || 'null');
    if (!data || data.index !== session.index || data.logs !== session.logs.length || !data.fields || typeof data.fields !== 'object') return null;
    return Object.fromEntries(Object.entries(data.fields).filter(([name, value]) =>
      /^(reps|weight|actual-metric-\d+)$/.test(name) && typeof value === 'string' && value.length <= 80));
  } catch { return null; }
}
export function clearSetDraft(storage, uid, id) { storage.removeItem(key(uid, id)); }
