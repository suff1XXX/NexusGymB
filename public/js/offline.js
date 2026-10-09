// Private, durable writes are retried in order and partitioned by account.
export function createOfflineStore(storage, uid) {
  const key = `nexus:offline:${encodeURIComponent(uid)}`;
  const read = () => {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : { cache: {}, jobs: [] };
  };
  const write = (state) => {
    try { storage.setItem(key, JSON.stringify(state)); }
    catch { throw Error("Не вдалося зберегти дані на пристрої. Звільни місце або увімкни сховище браузера."); }
  };
  const apply = (value, path, op) => {
    if (Array.isArray(value)) {
      if (op.path.slice(0, op.path.lastIndexOf("/")) !== path) return value;
      const id = op.path.slice(op.path.lastIndexOf("/") + 1), index = value.findIndex((d) => d.id === id);
      const next = value.filter((d) => d.id !== id);
      if (op.kind !== "remove") next.push({ ...(op.kind === "patch" ? value[index] || {} : {}), ...op.data, id });
      return next;
    }
    if (path !== op.path) return value;
    return op.kind === "remove" ? null : { ...(op.kind === "patch" ? value || {} : {}), ...op.data };
  };
  return {
    pending: () => read().jobs.length,
    jobs: () => read().jobs,
    cache(path, value) { const state = read(); state.cache[path] = value; write(state); },
    cached(path) {
      const state = read();
      let value = state.cache[path];
      if (value === undefined && path.startsWith(`users/${uid}/`)) value = path.split("/").length % 2 ? [] : null;
      if (value === undefined) throw Error("Ці дані ще не завантажені на пристрій. Відкрий сайт із доступом до інтернету.");
      for (const job of state.jobs) for (const op of job.operations) value = apply(value, path, op);
      return structuredClone(value);
    },
    enqueue(operations) {
      if (!operations.length || operations.some((op) => !op.path.startsWith(`users/${uid}/`) && op.path !== `users/${uid}`))
        throw Error("Без мережі можна зберігати лише власні дані.");
      const state = read(), id = crypto.randomUUID();
      state.jobs.push({ id, operations: structuredClone(operations) }); write(state); return id;
    },
    acknowledge(id, commit = true) {
      const state = read(), job = state.jobs.find((j) => j.id === id);
      if (commit && job) for (const op of job.operations) {
        for (const path of Object.keys(state.cache)) state.cache[path] = apply(state.cache[path], path, op);
      }
      state.jobs = state.jobs.filter((j) => j.id !== id); write(state);
    },
  };
}

export function retryable(error) {
  return ["unavailable", "deadline-exceeded", "network-request-failed", "auth/network-request-failed"].includes(error?.code);
}

export function timeout(promise, ms = 8000) {
  let timer;
  const waiting = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(Error("З’єднання недоступне"), { code: "unavailable" })), ms); });
  return Promise.race([promise, waiting]).finally(() => clearTimeout(timer));
}
