const key = (uid, id) => `nexus:set-draft:${encodeURIComponent(uid)}:${encodeURIComponent(id)}`;
const modeKey = uid => `nexus:execution-mode:${encodeURIComponent(uid)}`;
const validMode = mode => ['simple', 'advanced', 'mixed'].includes(mode);
export function rememberExecutionMode(storage, uid, mode) {
  if (!uid || !validMode(mode)) return;
  try { storage.setItem(modeKey(uid), mode); } catch {}
}
export function preferredExecutionMode(storage, uid, sessions = []) {
  if (!uid) return null;
  try {
    const mode = storage.getItem(modeKey(uid));
    if (validMode(mode)) return mode;
  } catch {}
  // Existing session data also restores the last mode on a new device.
  const latest = sessions.filter(session => ['active', 'completed'].includes(session.status) && validMode(session.executionMode))
    .reduce((last, session) => !last || (session.startedAt || session.endedAt || 0) > (last.startedAt || last.endedAt || 0) ? session : last, null);
  return latest?.executionMode || null;
}
export function saveSetDraft(storage, uid, session, fields) {
  if (!uid || session?.status !== 'active') return;
  const item=session.items?.[session.index];
  storage.setItem(key(uid, session.id), JSON.stringify({ index: session.index, logs: session.logs.length,exercise:item?.exerciseId||item?.name||'', fields }));
}
export function loadSetDraft(storage, uid, session) {
  try {
    const data = JSON.parse(storage.getItem(key(uid, session.id)) || 'null');
    if (!data || data.index !== session.index || data.logs !== session.logs.length || !data.fields || typeof data.fields !== 'object') return null;
    const item=session.items?.[session.index];
    if(data.exercise!==undefined&&data.exercise!==(item?.exerciseId||item?.name||''))return null;
    return Object.fromEntries(Object.entries(data.fields).filter(([name, value]) =>
      /^(reps|weight|weightBasis|weightSides|actual-metric-\d+)$/.test(name) && typeof value === 'string' && value.length <= 80));
  } catch { return null; }
}
export function clearSetDraft(storage, uid, id) { storage.removeItem(key(uid, id)); }
