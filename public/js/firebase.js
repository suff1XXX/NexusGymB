import { firebaseConfig, OWNER_UID } from "./config.js";
import { loginTime, newerLogin, loginMetadata } from "./login-metadata.js";
import { createOfflineStore, retryable, timeout } from "./offline.js";
let api,
  registering = false;
const authListeners = new Set();
export async function connect() {
  if (api) return api;
  const base = "https://www.gstatic.com/firebasejs/11.10.0/";
  const [A, B, C] = await Promise.all([
    import(base + "firebase-app.js"),
    import(base + "firebase-auth.js"),
    import(base + "firebase-firestore.js"),
  ]);
  const app = A.initializeApp(firebaseConfig),
    auth = B.getAuth(app),
    db = C.getFirestore(app);
  await B.setPersistence(auth, B.browserLocalPersistence);
  const requireOnline = () => {
    if (!navigator.onLine)
      throw Error(
        "Немає з’єднання. Введені дані залишилися на екрані. Спробуйте знову після відновлення мережі.",
      );
  };
  const stores = new Map();
  const store = (uid = auth.currentUser?.uid) => {
    if (!uid) throw Error("Спочатку увійди в акаунт.");
    if (!stores.has(uid)) stores.set(uid, createOfflineStore(localStorage, uid));
    return stores.get(uid);
  };
  const locked = (name, fn) => navigator.locks ? navigator.locks.request(name, fn) : fn();
  const notifySync = (error = "") => window.dispatchEvent(new CustomEvent("nexus-sync", { detail: { pending: auth.currentUser ? store().pending() : 0, error } }));
  const commit = async (operations) => {
    const batch = C.writeBatch(db);
    for (const op of operations) {
      const ref = C.doc(db, op.path);
      if (op.kind === "remove") batch.delete(ref);
      else if (op.kind === "patch") batch.update(ref, op.data);
      else batch.set(ref, op.data);
    }
    await timeout(batch.commit());
  };
  const mutate = async (operations) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !auth.currentUser.emailVerified) throw Error("Увійди та підтвердь пошту.");
    const personal = operations.every((op) => op.path === `users/${uid}` || op.path.startsWith(`users/${uid}/`));
    if (!personal) { requireOnline(); await commit(operations); return; }
    const queue = store(uid);
    const id = await locked(`nexus-data-${uid}`, () => queue.enqueue(operations));
    notifySync();
    if (navigator.onLine) {
      try { await api.sync(); }
      catch (error) {
        if (!retryable(error)) {
          await locked(`nexus-data-${uid}`, () => queue.acknowledge(id, false));
          notifySync(error.message); throw error;
        }
      }
    }
  };
  auth.languageCode = "uk";
  const actionSettings = () => ({ url: new URL("index.html", window.location.href).href });
  api = {
    timestamp: () => C.serverTimestamp(),
    auth,
    pending: () => auth.currentUser ? store().pending() : 0,
    async sync() {
      const uid = auth.currentUser?.uid;
      if (!uid || !navigator.onLine) return;
      const queue = store(uid);
      return locked(`nexus-sync-${uid}`, async () => {
        while (queue.pending() && auth.currentUser?.uid === uid && navigator.onLine) {
          const job = queue.jobs()[0];
          try { await commit(job.operations); }
          catch (error) { notifySync(error.message); throw error; }
          await locked(`nexus-data-${uid}`, () => queue.acknowledge(job.id));
          notifySync();
        }
      });
    },
    async isOwner() {
      return auth.currentUser?.uid === OWNER_UID;
    },
    watch: (fn) => {
      authListeners.add(fn);
      const stop = B.onAuthStateChanged(auth, (user) => {
        if (!registering) fn(user);
      });
      return () => {
        authListeners.delete(fn);
        stop();
      };
    },
    login: (email, password) => B.signInWithEmailAndPassword(auth, email, password),
    async register(name, email, password) {
      registering = true;
      try {
        const result = await B.createUserWithEmailAndPassword(auth, email, password);
        await B.updateProfile(result.user, { displayName: name });
        await B.sendEmailVerification(result.user, actionSettings());
        return result.user;
      } finally {
        registering = false;
        for (const fn of authListeners) fn(auth.currentUser);
      }
    },
    async sendVerification() {
      if (!auth.currentUser) throw Error("Спочатку увійдіть.");
      await B.sendEmailVerification(auth.currentUser, actionSettings());
    },
    async checkVerification() {
      if (!auth.currentUser) return null;
      await B.reload(auth.currentUser);
      await B.getIdToken(auth.currentUser, true);
      return auth.currentUser;
    },
    async resetPassword(email) {
      try {
        await B.sendPasswordResetEmail(auth, email, actionSettings());
      } catch (e) {
        if (e.code !== "auth/user-not-found") throw e;
      }
    },
    logout: () => B.signOut(auth),
    async profile(user) {
      requireOnline();
      const ref = C.doc(db, "users", user.uid),
        counter = C.doc(db, "counters", "users");
      await C.runTransaction(db, async (t) => {
        const snap = await t.get(ref);
        if (snap.exists() && Number.isInteger(snap.data().customId)) return;
        const count = await t.get(counter),
          next = (count.exists() ? count.data().lastId : 0) + 1;
        const profile = snap.exists()
          ? snap.data()
          : {
              name: user.displayName || "",
              email: user.email || "",
              photo: user.photoURL || "",
              createdAt: Date.parse(user.metadata?.creationTime || "") || Date.now(),
              activeProgramId: "",
            };
        t.set(counter, { lastId: next });
        t.set(C.doc(db, "userNumbers", String(next)), { uid: user.uid });
        t.set(ref, { ...profile, customId: next });
      });
      let profile = (await C.getDocFromServer(ref)).data();
      const time = loginTime(user);
      if (newerLogin(profile, time)) {
        try {
          const registeredAt = Date.parse(user.metadata?.creationTime || "");
          const metadata = { ...await loginMetadata(time), ...(Number.isFinite(registeredAt) ? { registeredAt } : {}) };
          profile = await C.runTransaction(db, async (t) => {
            const current = (await t.get(ref)).data();
            // Another tab/device may have recorded a newer login while IP was loading.
            if (!newerLogin(current, time)) return current;
            t.update(ref, metadata);
            return { ...current, ...metadata };
          });
        } catch (error) {
          console.warn("Не вдалося зберегти дані останнього входу:", error.code || "unavailable");
        }
      }
      return profile;
    },
    async list(path) {
      const queue = store();
      if (navigator.onLine) try {
        const docs = (await timeout(C.getDocsFromServer(C.collection(db, path)))).docs.map((x) => ({ ...x.data(), id: x.id }));
        await locked(`nexus-data-${auth.currentUser.uid}`, () => queue.cache(path, docs));
      } catch (error) { if (!retryable(error)) throw error; }
      return queue.cached(path);
    },
    async get(path) {
      const queue = store();
      if (navigator.onLine) try {
        const s = await timeout(C.getDocFromServer(C.doc(db, path)));
        await locked(`nexus-data-${auth.currentUser.uid}`, () => queue.cache(path, s.exists() ? s.data() : null));
      } catch (error) { if (!retryable(error)) throw error; }
      return queue.cached(path);
    },
    async save(path, data) {
      await mutate([{ kind: "save", path, data }]);
    },
    async saveMany(entries) {
      if (!entries.length || entries.length > 100) throw Error("Імпортуй від 1 до 100 записів.");
      await mutate(entries.map(([path, data]) => ({ kind: "save", path, data })));
    },
    async patch(path, data) {
      await mutate([{ kind: "patch", path, data }]);
    },
    async remove(path) {
      await mutate([{ kind: "remove", path }]);
    },
    async removeMany(paths) {
      await mutate(paths.map((path) => ({ kind: "remove", path })));
    },
  };
  const onlineProfile = api.profile;
  api.profile = async (user) => {
    const queue = store(user.uid), path = `users/${user.uid}`;
    if (navigator.onLine) try {
      const data = await timeout(onlineProfile(user), 12000);
      await locked(`nexus-data-${user.uid}`, () => queue.cache(path, data));
    } catch (error) { if (!retryable(error)) throw error; }
    return queue.cached(path);
  };
  return api;
}
