export function activityMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const time = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function createActivityTracker({ send, userId, online, visible, now = Date.now, interval = 60000 }) {
  const records = new Map();
  return {
    async pulse() {
      const uid = userId();
      if (!uid || !online() || !visible()) return false;
      const previous = records.get(uid);
      if (previous && (previous.pending || now() - previous.at < interval)) return false;
      const record = { at: now(), pending: true };
      records.set(uid, record);
      try { return (await send(uid)) !== false; }
      catch { return false; }
      finally { record.pending = false; }
    },
  };
}
