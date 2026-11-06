import { firebaseConfig, OWNER_UID } from "./config.js";
import { loginTime, newerLogin, loginMetadata, loginIpHistory } from "./login-metadata.js";
import { createOfflineStore, retryable, timeout } from "./offline.js";
import { publicProfileData } from "./people.js";
import { profileSnapshots } from "./profile-data.js";
import { inviteSession } from './training-invites.js';
import { reportData } from './community-safety.js';
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
  const friendDirectories = new Set();
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
  const actionSettings = () => ({ url: new URL("../index.html", import.meta.url).href });
  const notice = (recipient, type, targetId, profileId) => ({ kind: 'save',
    path: `users/${recipient}/notifications/${type}_${targetId}`, data: {
      type, actorId: auth.currentUser.uid, profileId, targetId, createdAt: C.serverTimestamp(), read: false,
    } });
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
    async markActive(uid) {
      if (!navigator.onLine || !auth.currentUser?.emailVerified || auth.currentUser.uid !== uid) return false;
      // Presence writes go directly to the server; old offline writes must never look like new activity.
      await commit([{ kind: "patch", path: `users/${uid}`, data: { lastActiveAt: C.serverTimestamp() } }]);
      await commit([{ kind: 'save', path: `publicProfiles/${uid}/stats/lastActive`, data: { at: C.serverTimestamp() } }]);
      return true;
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
            const changes = { ...metadata, loginIpHistory: loginIpHistory(current, metadata) };
            t.update(ref, changes);
            return { ...current, ...changes };
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
    async getLive(path) {
      requireOnline();
      const snapshot = await timeout(C.getDocFromServer(C.doc(db, path)));
      return snapshot.exists() ? snapshot.data() : null;
    },
    async ensurePublicProfile(profile) {
      requireOnline();
      const uid = auth.currentUser.uid, ref = C.doc(db, 'publicProfiles', uid);
      await C.runTransaction(db, async (t) => {
        const current = await t.get(ref);
        if (!current.exists()) t.set(ref, publicProfileData(profile));
      });
      if (!friendDirectories.has(uid)) { await api.syncFriendDirectory(); friendDirectories.add(uid); }
    },
    async changeAvatar(photo) {
      requireOnline();
      const uid = auth.currentUser.uid;
      await commit([
        { kind: 'patch', path: `users/${uid}`, data: { photo } },
        { kind: 'patch', path: `publicProfiles/${uid}`, data: { photo } },
      ]);
      const queue = store(uid), path = `users/${uid}`;
      await locked(`nexus-data-${uid}`, () => {
        const profile = queue.cached(path);
        if (profile) queue.cache(path, { ...profile, photo });
      });
    },
    async gymBros() {
      requireOnline();
      const q = C.query(C.collection(db, 'gymBros'), C.where('members', 'array-contains', auth.currentUser.uid));
      return (await timeout(C.getDocsFromServer(q))).docs.map((d) => ({ ...d.data(), id: d.id }));
    },
    async publicGymBros(uid) {
      requireOnline();
      return (await timeout(C.getDocsFromServer(C.collection(db, `publicProfiles/${uid}/friends`)))).docs
        .map((d) => ({ id: `${uid}_${d.id}`, from: uid, to: d.id, members: [uid, d.id], status: 'accepted' }));
    },
    async syncFriendDirectory() {
      const uid = auth.currentUser.uid;
      const accepted = (await api.gymBros()).filter((r) => r.status === 'accepted');
      const relations = (await Promise.all(accepted.map(async (r) => {
        const block = await api.blockStatus(r.from === uid ? r.to : r.from);
        return block.iBlocked || block.blockedMe ? null : r;
      }))).filter(Boolean);
      const operations = relations.flatMap((r) => [
        { kind: 'save', path: `publicProfiles/${r.from}/friends/${r.to}`, data: { uid: r.to } },
        { kind: 'save', path: `publicProfiles/${r.to}/friends/${r.from}`, data: { uid: r.from } },
      ]);
      for (let index = 0; index < operations.length && auth.currentUser?.uid === uid; index += 6)
        await commit(operations.slice(index, index + 6));
    },
    async profileComments(uid) {
      requireOnline();
      const q = C.query(C.collection(db, `publicProfiles/${uid}/comments`), C.orderBy('createdAt', 'desc'), C.limit(50));
      const comments = (await timeout(C.getDocsFromServer(q))).docs.map((d) => ({ ...d.data(), id: d.id }));
      const parents = [...new Set(comments.map((c) => c.parentId).filter((id) => id && !comments.some((c) => c.id === id)))];
      for (const id of parents) {
        const parent = await C.getDocFromServer(C.doc(db, `publicProfiles/${uid}/comments/${id}`));
        if (parent.exists()) comments.push({ ...parent.data(), id: parent.id });
      }
      return Promise.all(comments.map(async (comment) => {
        const path = `publicProfiles/${uid}/comments/${comment.id}/likes`;
        const [count, mine] = await Promise.all([
          C.getCountFromServer(C.collection(db, path)), C.getDocFromServer(C.doc(db, path, auth.currentUser.uid)),
        ]);
        return { ...comment, likeCount: count.data().count, liked: mine.exists() };
      }));
    },
    async publishProfileStats(sessions) {
      requireOnline();
      const uid = auth.currentUser.uid;
      await commit(Object.entries(profileSnapshots(sessions)).map(([kind, data]) => ({ kind: 'save', path: `publicProfiles/${uid}/stats/${kind}`, data })));
    },
    async addProfileComment(uid, text, parentId = '') {
      requireOnline();
      const author = await api.getLive(`publicProfiles/${auth.currentUser.uid}`);
      const id = crypto.randomUUID();
      const operations = [{ kind: 'save', path: `publicProfiles/${uid}/comments/${id}`,
        data: { authorId: auth.currentUser.uid, authorName: author.name, text, parentId, createdAt: C.serverTimestamp() } }];
      if (uid !== auth.currentUser.uid) operations.push(notice(uid, 'comment', id, uid));
      if (parentId) {
        const parent = await api.getLive(`publicProfiles/${uid}/comments/${parentId}`);
        if (!parent || parent.parentId) throw Error('Коментар для відповіді вже недоступний.');
        if (parent.authorId !== uid && parent.authorId !== auth.currentUser.uid) operations.push(notice(parent.authorId, 'reply', id, uid));
      }
      await commit(operations);
      return id;
    },
    async toggleCommentLike(uid, id, liked) {
      requireOnline();
      const path = `publicProfiles/${uid}/comments/${id}/likes/${auth.currentUser.uid}`;
      await commit([{ kind: liked ? 'remove' : 'save', path, data: { createdAt: C.serverTimestamp() } }]);
    },
    async requestGymBro(uid) {
      requireOnline();
      const from = auth.currentUser.uid, id = `${from}_${uid}`;
      await commit([{ kind: 'save', path: `gymBros/${id}`, data: { from, to: uid, members: [from, uid], status: 'pending', createdAt: C.serverTimestamp() } }, notice(uid, 'friend_request', id, from)]);
    },
    async acceptGymBro(id) {
      requireOnline();
      const relation = await api.getLive(`gymBros/${id}`);
      if (!relation) throw Error('Заявка вже недоступна.');
      await commit([{ kind: 'patch', path: `gymBros/${id}`, data: { status: 'accepted' } },
        { kind: 'save', path: `publicProfiles/${relation.from}/friends/${relation.to}`, data: { uid: relation.to } },
        { kind: 'save', path: `publicProfiles/${relation.to}/friends/${relation.from}`, data: { uid: relation.from } },
        notice(relation.from, 'friend_accepted', id, auth.currentUser.uid)]);
    },
    async removeGymBro(id) {
      requireOnline();
      const relation = await api.getLive(`gymBros/${id}`);
      if (!relation) throw Error('Дружбу або заявку вже прибрано.');
      await commit([{ kind: 'remove', path: `gymBros/${id}` },
        { kind: 'remove', path: `publicProfiles/${relation.from}/friends/${relation.to}` },
        { kind: 'remove', path: `publicProfiles/${relation.to}/friends/${relation.from}` }]);
    },
    async blockedUsers() {
      requireOnline();
      return (await C.getDocsFromServer(C.collection(db, `users/${auth.currentUser.uid}/blocked`))).docs.map((d) => ({ ...d.data(), id: d.id }));
    },
    async blockStatus(uid) {
      const me = auth.currentUser.uid;
      if (uid === me) return { iBlocked: false, blockedMe: false };
      const [mine, theirs] = await Promise.all([
        api.getLive(`users/${me}/blocked/${uid}`), api.getLive(`users/${uid}/blocked/${me}`),
      ]);
      return { iBlocked: !!mine, blockedMe: !!theirs };
    },
    async blockUser(uid) {
      requireOnline();
      const me = auth.currentUser.uid;
      if (uid === me) throw Error('Не можна заблокувати себе.');
      const operations = [{ kind: 'save', path: `users/${me}/blocked/${uid}`, data: { createdAt: C.serverTimestamp() } }];
      for (const relation of (await api.gymBros()).filter((r) => r.members.includes(uid))) operations.push(
        { kind: 'remove', path: `gymBros/${relation.id}` },
        { kind: 'remove', path: `publicProfiles/${me}/friends/${uid}` },
        { kind: 'remove', path: `publicProfiles/${uid}/friends/${me}` });
      await commit(operations);
    },
    async unblockUser(uid) {
      requireOnline();
      await commit([{ kind: 'remove', path: `users/${auth.currentUser.uid}/blocked/${uid}` }]);
    },
    async submitReport(targetId, profileId, commentId, reason, detail) {
      requireOnline();
      const reporterId = auth.currentUser.uid;
      if (targetId === reporterId) throw Error('Не можна скаржитися на себе.');
      const data = reportData(reason, detail);
      const source = commentId ? await api.getLive(`publicProfiles/${profileId}/comments/${commentId}`) : null;
      if (commentId && (!source || source.authorId !== targetId)) throw Error('Коментар уже недоступний.');
      const ref = C.doc(db, `reports/${reporterId}_${targetId}_${commentId || 'profile'}`);
      return C.runTransaction(db, async (t) => {
        if ((await t.get(ref)).exists()) return false;
        t.set(ref, { ...data, reporterId, targetId, profileId, commentId: commentId || '',
          commentText: source?.text || '', status: 'open', createdAt: C.serverTimestamp() });
        return true;
      });
    },
    async reports() {
      requireOnline();
      return (await C.getDocsFromServer(C.query(C.collection(db, 'reports'), C.orderBy('createdAt', 'desc'), C.limit(100))))
        .docs.map((d) => ({ ...d.data(), id: d.id }));
    },
    async reviewReport(id, status) {
      requireOnline();
      await commit([{ kind: 'patch', path: `reports/${id}`, data: { status, reviewedAt: C.serverTimestamp() } }]);
    },
    async sendTrainingInvite(to, data) {
      requireOnline();
      const from = auth.currentUser.uid, id = crypto.randomUUID();
      const invite = { ...data, from, to, members: [from, to], status: 'pending', createdAt: C.serverTimestamp() };
      const session = inviteSession(invite, id, from), { id: sessionId, ...stored } = session;
      await commit([{ kind: 'save', path: `trainingInvites/${id}`, data: invite },
        { kind: 'save', path: `users/${from}/sessions/${sessionId}`, data: stored }, notice(to, 'training_invite', id, from)]);
      return id;
    },
    async trainingInvites() {
      requireOnline();
      const query=C.query(C.collection(db,'trainingInvites'),C.where('members','array-contains',auth.currentUser.uid));
      return (await C.getDocsFromServer(query)).docs.map((d)=>({...d.data(),id:d.id}))
        .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    },
    async respondTrainingInvite(id, status) {
      requireOnline();
      const uid = auth.currentUser.uid, ref = C.doc(db, `trainingInvites/${id}`);
      return C.runTransaction(db, async (t) => {
        const invite = (await t.get(ref)).data();
        if (!invite) throw Error('Запрошення недоступне.');
        if (invite.status !== 'pending') {
          if (invite.status === status) return invite.sessionId || '';
          throw Error('На це запрошення вже відповіли.');
        }
        if (status === 'cancelled') {
          if (invite.from !== uid) throw Error('Немає доступу.');
          const sessionRef = C.doc(db, `users/${uid}/sessions/invite_${id}`), session = await t.get(sessionRef);
          if (session.exists() && session.data().status === 'planned') t.delete(sessionRef);
        } else if (invite.to !== uid) throw Error('Немає доступу.');
        const changes = { status, respondedAt: C.serverTimestamp() };
        if (status === 'accepted') {
          const session = inviteSession(invite, id, uid), { id: sessionId, ...stored } = session;
          const sessionRef = C.doc(db, `users/${uid}/sessions/${sessionId}`);
          if ((await t.get(sessionRef)).exists()) throw Error('Тренування вже існує. Онови сторінку.');
          t.set(sessionRef, stored); changes.sessionId = sessionId;
          const notification = notice(invite.from, 'training_accepted', id, uid);
          t.set(C.doc(db, notification.path), notification.data);
        }
        t.update(ref, changes);
        return changes.sessionId || '';
      });
    },
    watchNotifications(onChange, onError) {
      const uid = auth.currentUser.uid;
      return C.onSnapshot(C.query(C.collection(db, `users/${uid}/notifications`), C.orderBy('createdAt', 'desc'), C.limit(100)),
        (snapshot) => onChange(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))), onError);
    },
    async readNotifications(ids) {
      requireOnline();
      await commit(ids.slice(0, 100).map((id) => ({ kind: 'patch', path: `users/${auth.currentUser.uid}/notifications/${id}`, data: { read: true } })));
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
