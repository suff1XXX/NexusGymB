export function draftKey(uid, mode, id = "new") {
  return `nexus:editor:${encodeURIComponent(uid)}:${mode}:${encodeURIComponent(id)}`;
}

export function saveDraft(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify({ version: 1, ...value, savedAt: Date.now() }));
    return true;
  } catch { return false; }
}

export function loadDraft(storage, key) {
  try {
    const draft = JSON.parse(storage.getItem(key));
    const p = draft?.editor;
    if (draft?.version !== 1 || !p || typeof p.name !== "string" || !Array.isArray(p.days) ||
        p.days.length > 7 || !p.days.every((d) => d && typeof d.name === "string" && Array.isArray(d.items) &&
          d.items.length <= 30 && d.items.every((i) => i && typeof i.name === "string" &&
            (i.metrics === undefined || Array.isArray(i.metrics)) && (i.setPlans === undefined || Array.isArray(i.setPlans))))) return null;
    return draft;
  } catch { return null; }
}

export function removeDraft(storage, key) {
  try { storage.removeItem(key); return true; } catch { return false; }
}
