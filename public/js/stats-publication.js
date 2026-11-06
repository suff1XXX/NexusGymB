export async function statsSignature(sessions, manualSets, day) {
  const bytes = new TextEncoder().encode(JSON.stringify([day, sessions, manualSets]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

// Record only successful publications. Failed writes must remain retryable.
export async function publishOnce(storage, key, signature, publish) {
  try { if (storage.getItem(key) === signature) return false; } catch {}
  await publish();
  try { storage.setItem(key, signature); } catch {}
  return true;
}
