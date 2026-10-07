import { firebaseConfig, OWNER_UID } from "./config.js";
import { loginTime, newerLogin, loginMetadata } from "./login-metadata.js";
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
  auth.languageCode = "uk";
  const actionSettings = () => ({ url: new URL("index.html", window.location.href).href });
  api = {
    timestamp: () => C.serverTimestamp(),
    auth,
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
      requireOnline();
      return (await C.getDocsFromServer(C.collection(db, path))).docs.map((x) => ({
        ...x.data(),
        id: x.id,
      }));
    },
    async get(path) {
      requireOnline();
      const s = await C.getDocFromServer(C.doc(db, path));
      return s.exists() ? s.data() : null;
    },
    async save(path, data) {
      requireOnline();
      await C.setDoc(C.doc(db, path), data);
    },
    async saveMany(entries) {
      requireOnline();
      if (!entries.length || entries.length > 100) throw Error("Імпортуй від 1 до 100 записів.");
      const batch = C.writeBatch(db);
      for (const [path, data] of entries) batch.set(C.doc(db, path), data);
      await batch.commit();
    },
    async patch(path, data) {
      requireOnline();
      await C.updateDoc(C.doc(db, path), data);
    },
    async remove(path) {
      requireOnline();
      await C.deleteDoc(C.doc(db, path));
    },
    async removeMany(paths) {
      requireOnline();
      const batch = C.writeBatch(db);
      for (const path of paths) batch.delete(C.doc(db, path));
      await batch.commit();
    },
  };
  return api;
}
