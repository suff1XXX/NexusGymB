// Cache timestamps live alongside the account's offline data, across page loads.
export function createReadCache({ store, online, fetch, retryable, lock = (fn) => fn() }) {
  const pending = new Map();
  return async function read(path, age = 60000) {
    if (!online() || store.fresh(path, age)) return store.cached(path);
    if (pending.has(path)) return pending.get(path);
    const request = (async () => {
      try {
        const data = await fetch(path);
        await lock(() => store.cache(path, data));
      } catch (error) { if (!retryable(error)) throw error; }
      return store.cached(path);
    })();
    pending.set(path, request);
    try { return await request; }
    finally { pending.delete(path); }
  };
}
