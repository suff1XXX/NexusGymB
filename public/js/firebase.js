import {nextTurnState,turnActionApplied} from './gymbro-turns.js';
import { calendarSnapshot, calendarScopeLabels } from './calendar-privacy.js';
import { profileName, trainingProfileLimit, trainingProfiles, profileData, defaultTrainingProfile } from './training-profiles.js';
import {personalRecords} from './fitness.js';
import { reactionSummary, reactions } from './social.js';
import { firebaseConfig, OWNER_UID } from "./config.js";
import { loginTime, newerLogin, loginMetadata, loginIpHistory } from "./login-metadata.js";
import { createOfflineStore, retryable, timeout } from "./offline.js";
import { publicProfileData } from "./people.js";
import { profileSnapshots, sharedRecords, recordSharingKeys } from "./profile-data.js";
import { inviteSession } from './training-invites.js';
import { reportData } from './community-safety.js';
import { progressSessions } from './manual-sets.js';
import { createReadCache } from './read-cache.js';
import { statsSignature, publishOnce } from './stats-publication.js';
import { activityMillis } from './activity.js';
import { achievementCatalog,achievementFacts } from './achievement-catalog.js';
import {sparkProgress,sparkDisplay,sameSparkProgress} from './achievement-spark.js';
import {challengeData,challengeCount,reflectionData,profileLayout,weekStart} from './training-experience.js';
import {pollData} from './workout-additions.js';
let api,
  registering = false, connecting;
const authListeners = new Set();
export async function connect() {
  if (api) return api;
  if (!connecting) connecting = initialize().finally(() => { connecting = null; });
  return connecting;
}
async function initialize() {
  const base = "https://www.gstatic.com/firebasejs/11.10.0/";
  const [A, B, C] = await Promise.all([
    import(base + "firebase-app.js"),
    import(base + "firebase-auth.js"),
    import(base + "firebase-firestore.js"),
  ]);
  const app = A.initializeApp(firebaseConfig),
    auth = B.initializeAuth(app,{persistence:[B.browserLocalPersistence,B.indexedDBLocalPersistence]}),
    db = C.getFirestore(app);
  await auth.authStateReady();
  const requireOnline = () => {
    if (!navigator.onLine)
      throw Error(
        "Немає з’єднання. Введені дані залишилися на екрані. Спробуйте знову після відновлення мережі.",
      );
  };
  const stores = new Map();
  const friendDirectories = new Set();
  const identityLookups = new Map();
  let achievementBoard,achievementBoardPending,sparkRefreshPending,sparkRefreshTimer;
  const scheduleSparkRefresh=()=>{
    clearTimeout(sparkRefreshTimer);
    sparkRefreshTimer=setTimeout(()=>{if(auth.currentUser?.emailVerified&&navigator.onLine)api.refreshAchievements().catch(error=>console.warn('Achievements:',error.code||error.message));},2500);
  };
  const store = (uid = auth.currentUser?.uid) => {
    if (!uid) throw Error("Спочатку увійди в акаунт.");
    if (!stores.has(uid)) stores.set(uid, createOfflineStore(localStorage, uid));
    return stores.get(uid);
  };
  const locked = (name, fn) => navigator.locks ? navigator.locks.request(name, fn) : fn();
  const notifySync = (error = "") => window.dispatchEvent(new CustomEvent("nexus-sync", { detail: { pending: auth.currentUser ? store().pending() : 0, error } }));
  const commit = async (operations) => {
    const batch = C.writeBatch(db);
    // Keep only public identity in a separate document so closed profiles remain private.
    const profileWrite=operations.find(op=>op.path===`publicProfiles/${auth.currentUser?.uid}` && op.kind!=='remove');
    if(profileWrite) {
      identityLookups.delete(auth.currentUser.uid);
      const previous=profileWrite.kind==='save'?{}:(await C.getDocFromServer(C.doc(db,profileWrite.path))).data();
      const profile={...previous,...profileWrite.data};
      batch.set(C.doc(db,`profileCards/${auth.currentUser.uid}`),{
        name:profile.name,photo:profile.photo,customId:profile.customId,isPrivate:profile.isPrivate===true,
      });
    }
    for (const op of operations) {
      const ref = C.doc(db, op.path);
      if (op.kind === "remove") batch.delete(ref);
      else if (op.kind === "patch") batch.update(ref, op.data);
      else batch.set(ref, op.data);
    }
    await timeout(batch.commit());
    if(operations.some(op=>/^users\/[^/]+\/(programs|exercises)\//.test(op.path)||/^users\/[^/]+\/sessions\//.test(op.path)&&(op.kind==='remove'||op.data?.status==='completed')||/^publicProfiles\/[^/]+$/.test(op.path)||/^gymBros\//.test(op.path)||/\/comments\/[^/]+$/.test(op.path)))scheduleSparkRefresh();
    if (auth.currentUser) await locked(`nexus-data-${auth.currentUser.uid}`, () => store().invalidate([
      ...operations.map(op => op.path),
      ...(profileWrite ? [`profileCards/${auth.currentUser.uid}`] : []),
    ]));
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
    path: `users/${recipient}/notifications/event_${crypto.randomUUID()}`, data: {
      type, actorId: auth.currentUser.uid, profileId, targetId, createdAt: C.serverTimestamp(), read: false,
    } });
  const readSpark=async path=>(await timeout(C.getDocFromServer(C.doc(db,path)))).data()||null;
  const listSpark=async path=>(await timeout(C.getDocsFromServer(C.collection(db,path)))).docs.map(doc=>({...doc.data(),id:doc.id}));
  async function recordSparkDay(uid) {
    const ref=C.doc(db,`users/${uid}/achievementActivity/current`);
    return C.runTransaction(db,async tx=>{
      const previous=(await tx.get(ref)).data(),day=Math.floor(Date.now()/86400000);
      if(previous?.lastDay>=day)return false;
      tx.set(ref,{count:Math.min(90,(previous?.count||0)+1),lastDay:day,updatedAt:C.serverTimestamp()});return true;
    });
  }
  async function refreshSpark(uid) {
    await recordSparkDay(uid);
    const [sessions,programs,exercises,friends,profile,invites,activity,comments]=await Promise.all([
      listSpark(`users/${uid}/sessions`),listSpark(`users/${uid}/programs`),listSpark(`users/${uid}/exercises`),api.gymBros(),readSpark(`publicProfiles/${uid}`),api.trainingInvites(),readSpark(`users/${uid}/achievementActivity/current`),
      C.getDocsFromServer(C.query(C.collectionGroup(db,'comments'),C.where('authorId','==',uid),C.limit(10))),
    ]);
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const own=new Map(sessions.map(session=>[session.id,session]));let sharedWorkouts=0;
    for(const invite of invites.filter(value=>value.status==='accepted')) {
      const session=own.get(`invite_${invite.id}`),partner=invite.from===uid?invite.to:invite.from;
      if(session?.invitationId!==invite.id||session.gymBroId!==partner||session.date!==invite.date||!achievementFacts({sessions:[session],today}).workouts)continue;
      const ref=C.doc(db,`trainingInvites/${invite.id}/completions/${uid}`);
      const previous=(await C.getDocFromServer(ref)).data();
      if(!previous)await C.setDoc(ref,{completed:true,updatedAt:C.serverTimestamp()});
      try {
        const other=await C.getDocFromServer(C.doc(db,`trainingInvites/${invite.id}/completions/${partner}`));
        if(other.exists()&&other.data().completed===true)sharedWorkouts++;
      } catch(error) {if(error.code!=='permission-denied')throw error;}
    }
    const facts=achievementFacts({uid,today,sessions,programs,exercises,friends,profile:profile||{},sharedWorkouts,activeDays:activity?.count||0,
      comments:comments.docs.filter(doc=>/^(publicProfiles|exercises|programTemplates)\/[^/]+\/comments\/[^/]+$/.test(doc.ref.path)).map(doc=>doc.data())});
    const challenges=await api.syncChallenges(sessions);
    facts.challenges=challenges.filter(c=>c.status==='accepted'&&c.members.every(member=>(c.progress[member]||0)>=c.target)).length;
    if(auth.currentUser?.uid!==uid)throw Error('Обліковий запис змінився.');
    return publishSpark(uid,facts);
  }
  async function publishSpark(uid,facts,award=null,display=null) {
    const progressRef=C.doc(db,`users/${uid}/achievements/progress`),grantsRef=C.doc(db,`users/${uid}/achievementGrants/current`),settingsRef=C.doc(db,`users/${uid}/achievementSettings/display`);
    const auditRef=award&&award.action!=='list'?C.doc(C.collection(db,`users/${uid}/achievementAwardAudit`)):null;
    const result=await C.runTransaction(db,async tx=>{
      const showcaseRef=C.doc(db,`publicProfiles/${uid}/achievements/showcase`),scoreRef=C.doc(db,`achievementScores/${uid}`);
      const [progress,grants,settings,profile,account,activity,showcase,score]=await Promise.all([tx.get(progressRef),tx.get(grantsRef),tx.get(settingsRef),tx.get(C.doc(db,`publicProfiles/${uid}`)),tx.get(C.doc(db,`users/${uid}`)),tx.get(C.doc(db,`users/${uid}/achievementActivity/current`)),tx.get(showcaseRef),tx.get(scoreRef)]);
      if(!account.exists())throw Error('Користувача не знайдено.');
      let manualIds=grants.data()?.ids||[];
      if(award?.action==='list')return {earnedIds:progress.data()?.earnedIds||[],manualIds,score:progress.data()?.score||0};
      let changedGrant=false;
      if(award) {
        const requested=award.action==='grant'?[...manualIds,award.medalId]:manualIds.filter(id=>id!==award.medalId);
        const ids=achievementCatalog.filter(medal=>requested.includes(medal.id)).map(medal=>medal.id);
        changedGrant=JSON.stringify(ids)!==JSON.stringify(manualIds);manualIds=ids;
      }
      const next=sparkProgress({...(facts||progress.data()?.facts||{}),activeDays:activity.data()?.count||0},manualIds);
      const newIds=next.earnedIds.filter(id=>progress.data()?.eventsVersion!==1||!progress.data()?.earnedIds?.includes(id));
      const eventRefs=newIds.map(id=>C.doc(db,`users/${uid}/achievementEvents/${id}`));
      const existingEvents=await Promise.all(eventRefs.map(ref=>tx.get(ref)));
      if(changedGrant) {
        tx.set(grantsRef,{ids:manualIds,updatedAt:C.serverTimestamp(),updatedBy:auth.currentUser.uid});
        tx.set(auditRef,{medalId:award.medalId,action:award.action,note:award.note.trim(),actorId:auth.currentUser.uid,createdAt:C.serverTimestamp()});
      }
      eventRefs.forEach((ref,index)=>{
        if(existingEvents[index].exists())return;
        const medal=achievementCatalog.find(m=>m.id===newIds[index]),manual=manualIds.includes(medal.id);
        const reason=manual?(award?.medalId===medal.id&&award.action==='grant'&&award.note.trim()||'Видано адміністратором'):medal.description;
        const migrated=progress.exists()&&progress.data().eventsVersion!==1&&progress.data().earnedIds?.includes(medal.id);
        tx.set(ref,{medalId:medal.id,source:manual?'admin':'automatic',reason:(migrated?'Додано до історії. ':'')+reason,earnedAt:C.serverTimestamp(),read:false});
      });
      const savedDisplay=settings.data(),nextDisplay=sparkDisplay(display||savedDisplay,next.earnedIds);
      if(display&&JSON.stringify(nextDisplay.selectedIds)!==JSON.stringify(display.selectedIds))throw Error('Цю медаль ще не отримано. Онови прогрес.');
      const progressChanged=!sameSparkProgress(progress.data(),next);
      if(progressChanged)tx.set(progressRef,{...next,updatedAt:C.serverTimestamp()});
      const displayChanged=display||savedDisplay&&JSON.stringify(nextDisplay)!==JSON.stringify(savedDisplay);
      if(displayChanged)tx.set(settingsRef,nextDisplay);
      const publicProfile=profile.data()||account.data();
      if(profile.exists()&&JSON.stringify(showcase.data()?.selectedIds)!==JSON.stringify(nextDisplay.selectedIds))tx.set(showcaseRef,{selectedIds:nextDisplay.selectedIds,updatedAt:C.serverTimestamp()});
      const scoreData={uid,name:publicProfile.name,photo:publicProfile.photo||'',customId:publicProfile.customId,score:next.score,medalCount:next.earnedIds.length};
      if(nextDisplay.rankingEnabled&&profile.exists()&&Number.isInteger(publicProfile.customId)) {
        if(Object.entries(scoreData).some(([key,value])=>score.data()?.[key]!==value))tx.set(scoreRef,{...scoreData,updatedAt:C.serverTimestamp()});
      } else if(!nextDisplay.rankingEnabled&&score.exists())tx.delete(scoreRef);
      return next;
    });
    achievementBoard=null;return result;
  }
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
    async createTrainingProfile(name,legacyMachine='') {
      requireOnline();
      const uid=auth.currentUser?.uid;
      if (!uid || !auth.currentUser.emailVerified) throw Error('Увійди та підтвердь пошту.');
      const cleanName=profileName(name),base=`users/${uid}/trainingProfiles`;
      const result=await C.runTransaction(db,async transaction=>{
        const access=(await transaction.get(C.doc(db,`userAccess/${uid}`))).data();
        const limit=trainingProfileLimit(access),snapshots=[];
        for (let k=1;k<=5;k++) snapshots.push(await transaction.get(C.doc(db,`${base}/profile-${k}`)));
        const records=trainingProfiles(snapshots.filter(snapshot=>snapshot.exists()).map(snapshot=>({id:snapshot.id,...snapshot.data()})));
        if (records.some(profile=>profile.name.toLocaleLowerCase('uk') === cleanName.toLocaleLowerCase('uk'))) throw Error('Профіль із такою назвою вже є.');
        const id=Array.from({length:limit-1},(_,k)=>`profile-${k+2}`).find(id=>!records.some(profile=>profile.id===id));
        if (!id) throw Error(`Досягнуто ліміту: ${limit} профілі тренувань.`);
        const now=Date.now(),data=profileData({name:cleanName,loads:{},createdAt:now,updatedAt:now,...(legacyMachine?{legacyMachine}: {})});
        trainingProfiles([...records,{id,...data}]);
        if (!snapshots[0].exists()) {const {id:unused,...primary}=defaultTrainingProfile();transaction.set(C.doc(db,`${base}/profile-1`),primary);}
        transaction.set(C.doc(db,`${base}/${id}`),data);
        return {id,...data};
      });
      store().invalidate([base,`${base}/profile-1`,`${base}/${result.id}`]);
      return result;
    },
    async toggleAccess(uid, key) {
      requireOnline();
      if (!['homeWorkouts','nutrition','profileCustomization','extraTrainingProfiles'].includes(key)) throw Error('Невідомий тип доступу.');
      const ref = C.doc(db, `userAccess/${uid}`);
      const result = await C.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        const previous = snapshot.exists() ? snapshot.data() : {};
        const data = { homeWorkouts: previous.homeWorkouts === true, nutrition: previous.nutrition === true,profileCustomization:previous.profileCustomization===true,extraTrainingProfiles:previous.extraTrainingProfiles===true };
        data[key] = !data[key];
        transaction.set(ref,data);
        return data;
      });
      store().invalidate([`userAccess/${uid}`]);
      return result;
    },
    async saveNutritionGenerator(value) {
      requireOnline();
      await commit([{kind:'save',path:`users/${auth.currentUser.uid}/nutrition/generator`,data:value}]);
    },
    async meetingPolls() {
      requireOnline();const uid=auth.currentUser.uid;
      const docs=await C.getDocsFromServer(C.query(C.collection(db,'meetingPolls'),C.where('members','array-contains',uid),C.orderBy('createdAt','desc'),C.limit(50)));
      return Promise.all(docs.docs.map(async doc=>{
        const poll={...doc.data(),id:doc.id},partner=poll.members.find(member=>member!==uid);
        poll.partnerName=(await api.publicIdentity(partner).catch(()=>null))?.name||'GymBro';poll.votes={};
        await Promise.all(poll.members.map(async member=>{const vote=await readSpark(`meetingPolls/${poll.id}/votes/${member}`);if(vote)poll.votes[member]=vote;}));return poll;
      }));
    },
    async createMeetingPoll(partnerId,value) {
      requireOnline();const uid=auth.currentUser.uid,data=pollData(value);
      if(!partnerId||partnerId===uid)throw Error('Обери GymBro.');
      const ref=C.doc(C.collection(db,'meetingPolls')),options=data.options;
      const batch=C.writeBatch(db);
      batch.set(ref,{title:data.title,options,creatorId:uid,partnerId,members:[uid,partnerId],status:'open',createdAt:C.serverTimestamp()});
      batch.set(C.doc(db,`meetingPolls/${ref.id}/votes/${uid}`),{choices:options.map((_,index)=>index),updatedAt:C.serverTimestamp()});
      await batch.commit();return ref.id;
    },
    async voteMeetingPoll(id,choices) {
      requireOnline();const poll=await readSpark(`meetingPolls/${id}`);
      if(!poll||poll.status!=='open')throw Error('Голосування вже завершено. Онови список.');
      if(!Array.isArray(choices)||new Set(choices).size!==choices.length||choices.some(index=>!Number.isInteger(index)||index<0||index>=poll.options.length))throw Error('Перевір обрані варіанти.');
      await C.setDoc(C.doc(db,`meetingPolls/${id}/votes/${auth.currentUser.uid}`),{choices:[...choices].sort((a,b)=>a-b),updatedAt:C.serverTimestamp()});
    },
    async closeMeetingPoll(id,index) {
      requireOnline();const uid=auth.currentUser.uid,ref=C.doc(db,`meetingPolls/${id}`);
      await C.runTransaction(db,async tx=>{
        const poll=(await tx.get(ref)).data();
        if(!poll||poll.creatorId!==uid||poll.status!=='open'||!Number.isInteger(index)||index<0||index>=poll.options.length)throw Error('Не можна обрати цей час.');
        const votes=await Promise.all(poll.members.map(member=>tx.get(C.doc(db,`meetingPolls/${id}/votes/${member}`))));
        if(votes.some(vote=>!vote.exists())||!votes.some(vote=>vote.data().choices.includes(index)))throw Error('Дочекайся відповідей обох і обери варіант, який комусь підходить.');
        const clock=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace(' ','T');
        if(poll.options[index].date+'T'+poll.options[index].time<clock)throw Error('Цей час уже минув. Створи нове опитування.');
        tx.update(ref,{status:'closed',selectedIndex:index,closedAt:C.serverTimestamp()});
      });
    },
    async cancelMeetingPoll(id) {
      requireOnline();await C.updateDoc(C.doc(db,`meetingPolls/${id}`),{status:'cancelled',cancelledAt:C.serverTimestamp()});
    },
    async sendPollInvite(id,data) {
      requireOnline();const poll=await readSpark(`meetingPolls/${id}`);
      if(!poll||poll.creatorId!==auth.currentUser.uid||poll.status!=='closed')throw Error('Спочатку обери підсумковий час.');
      if(poll.invitationId)return poll.invitationId;
      const chosen=poll.options[poll.selectedIndex];
      if(data.date!==chosen.date||data.time!==chosen.time)throw Error('Дата й час мають відповідати результату опитування.');
      const clock=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace(' ','T');
      if(chosen.date+'T'+chosen.time<clock)throw Error('Обраний час уже минув. Створи нове опитування.');
      const invitationId=await api.sendTrainingInvite(poll.partnerId,data,`poll_${id}`);
      try {await C.updateDoc(C.doc(db,`meetingPolls/${id}`),{invitationId});}
      catch(error) {if((await readSpark(`meetingPolls/${id}`))?.invitationId!==invitationId)throw error;}
      return invitationId;
    },
    async weeklyGoals() {
      requireOnline();return (await C.getDocsFromServer(C.query(C.collection(db,`users/${auth.currentUser.uid}/weeklyGoals`),C.orderBy('week','desc'),C.limit(60)))).docs.map(doc=>({...doc.data(),id:doc.id}));
    },
    async saveWeeklyGoal(week,target,profileId='profile-1') {
      requireOnline();target=Number(target);
      if(weekStart(week)!==week||!Number.isInteger(target)||target<1||target>14)throw Error('Ціль: від 1 до 14 тренувань на тиждень.');
      if(!/^profile-[1-5]$/.test(profileId))throw Error('Некоректний профіль тренувань.');
      const id=profileId==='profile-1'?week:`${profileId}_${week}`;
      await commit([{kind:'save',path:`users/${auth.currentUser.uid}/weeklyGoals/${id}`,data:{week,target,profileId,updatedAt:C.serverTimestamp()}}]);
      return {week,target,profileId,id};
    },
    async saveWorkoutReflection(id,value) {
      requireOnline();const data=reflectionData(value);
      await commit([{kind:'save',path:`users/${auth.currentUser.uid}/workoutReflections/${id}`,data:{...data,updatedAt:C.serverTimestamp()}}]);return {...data,id};
    },
    async saveProfileLayout(value) {
      requireOnline();const data=profileLayout(value);
      await commit([{kind:'save',path:`publicProfiles/${auth.currentUser.uid}/layout/display`,data:{...data,updatedAt:C.serverTimestamp()}}]);return data;
    },
    async challenges() {
      requireOnline();const uid=auth.currentUser.uid;
      const docs=await C.getDocsFromServer(C.query(C.collection(db,'gymChallenges'),C.where('members','array-contains',uid),C.orderBy('createdAt','desc'),C.limit(50)));
      return Promise.all(docs.docs.map(async doc=>{
        const value={...doc.data(),id:doc.id},partner=value.members.find(member=>member!==uid);
        value.partnerName=(await api.publicIdentity(partner).catch(()=>null))?.name||'GymBro';value.progress={};
        if(value.status==='accepted')await Promise.all(value.members.map(async member=>{const p=await readSpark(`gymChallenges/${doc.id}/progress/${member}`);value.progress[member]=p?.count||0;}));
        return value;
      }));
    },
    async createChallenge(partnerId,value) {
      requireOnline();const uid=auth.currentUser.uid,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),data=challengeData(value,today);
      if(!partnerId||partnerId===uid)throw Error('Обери GymBro.');
      const ref=C.doc(C.collection(db,'gymChallenges'));
      await C.setDoc(ref,{...data,creatorId:uid,partnerId,members:[uid,partnerId],status:'pending',startsAt:C.Timestamp.fromDate(new Date(data.startDate+'T00:00:00Z')),endsAt:C.Timestamp.fromDate(new Date(data.endDate+'T23:59:59Z')),createdAt:C.serverTimestamp()});
      return ref.id;
    },
    async respondChallenge(id,status) {
      requireOnline();if(!['accepted','declined','cancelled'].includes(status))throw Error('Перевір дію.');
      await C.updateDoc(C.doc(db,`gymChallenges/${id}`),{status,respondedAt:C.serverTimestamp()});
      scheduleSparkRefresh();
    },
    async syncChallenges(sessions) {
      const uid=auth.currentUser.uid,items=await api.challenges(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      for(const challenge of items.filter(c=>c.status==='accepted')) {
        const count=challengeCount(sessions,challenge,today);
        if(count!==(challenge.progress[uid]||0))await C.setDoc(C.doc(db,`gymChallenges/${challenge.id}/progress/${uid}`),{count,updatedAt:C.serverTimestamp()});
        challenge.progress[uid]=count;
      }
      return items;
    },
    watchAchievementEvents(onChange,onError) {
      return C.onSnapshot(C.query(C.collection(db,`users/${auth.currentUser.uid}/achievementEvents`),C.orderBy('earnedAt','desc')),snapshot=>onChange(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),onError);
    },
    async readAchievementEvents(ids) {
      requireOnline();for(let start=0;start<ids.length;start+=100)await commit(ids.slice(start,start+100).map(id=>({kind:'patch',path:`users/${auth.currentUser.uid}/achievementEvents/${id}`,data:{read:true}})));
    },
    async adminAchievementAwards(uid,action='list',medalId='',note='') {
      requireOnline();
      if(auth.currentUser?.uid!==OWNER_UID)throw Error('Немає доступу.');
      if(typeof uid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||!['list','grant','revoke'].includes(action))throw Error('Перевір користувача та дію.');
      if(action!=='list'&&(!achievementCatalog.some(m=>m.id===medalId)||typeof note!=='string'||note.length>200))throw Error('Перевір медаль та примітку.');
      return publishSpark(uid,null,{action,medalId,note});
    },
    async refreshAchievements() {
      requireOnline();
      const uid=auth.currentUser?.uid;
      if(!uid||!auth.currentUser.emailVerified)throw Error('Увійди та підтвердь пошту.');
      if(sparkRefreshPending?.uid===uid)return sparkRefreshPending.promise;
      const promise=refreshSpark(uid);sparkRefreshPending={uid,promise};
      try{return await promise;}finally{if(sparkRefreshPending?.promise===promise)sparkRefreshPending=null;}
    },
    watchAchievements(onChange,onError) {
      return C.onSnapshot(C.doc(db,`users/${auth.currentUser.uid}/achievements/progress`),snapshot=>onChange(snapshot.exists()?snapshot.data():null),onError);
    },
    async saveAchievementDisplay(selectedIds,rankingEnabled) {
      requireOnline();
      if(!Array.isArray(selectedIds)||selectedIds.length>3||new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!achievementCatalog.some(medal=>medal.id===id))||typeof rankingEnabled!=='boolean')throw Error('Обери до трьох зароблених медалей.');
      return publishSpark(auth.currentUser.uid,null,null,{selectedIds,rankingEnabled});
    },
    async achievementLeaderboard(force=false) {
      requireOnline();
      const uid=auth.currentUser.uid;
      if(!force&&achievementBoard?.uid===uid&&Date.now()-achievementBoard.at<30000)return achievementBoard.rows;
      if(achievementBoardPending?.uid===uid)return achievementBoardPending.promise;
      const promise=(async()=>{
        const query=C.query(C.collection(db,'achievementScores'),C.orderBy('score','desc'),C.orderBy('customId','asc'),C.limit(50));
        const rows=(await timeout(C.getDocsFromServer(query))).docs.map(doc=>({...doc.data(),uid:doc.id}));
        achievementBoard={uid,at:Date.now(),rows};return rows;
      })();
      achievementBoardPending={uid,promise};
      try{return await promise;}finally{if(achievementBoardPending?.promise===promise)achievementBoardPending=null;}
    },
    async nutritionData() {
      requireOnline();
      const [plans, selection] = await Promise.all([
        api.list('nutritionPlans'), api.get(`users/${auth.currentUser.uid}/nutrition/selection`),
      ]);
      return { plans, selection };
    },
    async isOwner() {
      return auth.currentUser?.uid === OWNER_UID;
    },
    async markActive(uid) {
      if (!navigator.onLine || !auth.currentUser?.emailVerified || auth.currentUser.uid !== uid) return false;
      return locked(`nexus-presence-${uid}`, async () => {
        const key = `nexus:presence:${uid}`;
        try {
          const elapsed = Date.now() - Number(localStorage.getItem(key));
          if (elapsed >= 0 && elapsed < 120000) return false;
        } catch {}
        if (auth.currentUser?.uid !== uid) return false;
        // One batch and one presence update across tabs every two minutes.
        await commit([
          { kind: 'patch', path: `users/${uid}`, data: { lastActiveAt: C.serverTimestamp() } },
          { kind: 'save', path: `publicProfiles/${uid}/stats/lastActive`, data: { at: C.serverTimestamp() } },
        ]);
        if(await recordSparkDay(uid))scheduleSparkRefresh();
        try { localStorage.setItem(key, String(Date.now())); } catch {}
        return true;
      });
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
    async prepareAccess() {
      const user = auth.currentUser;
      if (!user || !navigator.onLine) return;
      // Firestore reads the token claim, not the cached Auth user property.
      const token = await B.getIdTokenResult(user);
      if ((token.claims.email_verified === true) !== user.emailVerified) {
        await B.getIdToken(user, true);
      }
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
      const initial = await timeout(C.getDocFromServer(ref));
      let profile = initial.data();
      if (!initial.exists() || !Number.isInteger(profile.customId)) {
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
        profile = (await C.getDocFromServer(ref)).data();
      }
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
    list: (path) => cachedRead(path, ['exercises', 'programTemplates'].includes(path) ? 300000 : 60000),
    get: (path) => cachedRead(path),
    async getLive(path) {
      requireOnline();
      try {
        const snapshot = await timeout(C.getDocFromServer(C.doc(db, path)));
        return snapshot.exists() ? snapshot.data() : null;
      } catch(error) {
        const match=/^publicProfiles\/([^/]+)$/.exec(path);
        if(error.code!=='permission-denied'||!match)throw error;
        const card=await timeout(C.getDocFromServer(C.doc(db,`profileCards/${match[1]}`)));
        if(!card.exists())throw error;
        return {...card.data(),restricted:true};
      }
    },
    async ensurePublicProfile(profile) {
      requireOnline();
      const uid = auth.currentUser.uid, ref = C.doc(db, 'publicProfiles', uid);
      await C.runTransaction(db, async (t) => {
        const current = await t.get(ref);
        const cardRef=C.doc(db,'profileCards',uid),card=await t.get(cardRef);
        const data=current.exists()?current.data():publicProfileData(profile);
        if (!current.exists()) t.set(ref,data);
        const identity={name:data.name,photo:data.photo,customId:data.customId,isPrivate:data.isPrivate===true};
        if(!card.exists()||Object.entries(identity).some(([key,value])=>card.data()[key]!==value))t.set(cardRef,identity);
      });
      if (!friendDirectories.has(uid)) {
        await locked(`nexus-friends-${uid}`, async () => {
          const key = `nexus:friend-directory:v1:${uid}`;
          try { if (localStorage.getItem(key)) return; } catch {}
          // Existing accounts need this migration once; friendship actions maintain it afterwards.
          await api.syncFriendDirectory();
          try { localStorage.setItem(key, 'done'); } catch {}
        });
        friendDirectories.add(uid);
      }
    },
    async changeName(value) {
      requireOnline();
      const name=String(value || '').trim(), uid=auth.currentUser.uid;
      if (!name || name.length > 100) throw Error('Вкажи ім’я до 100 символів.');
      await commit([
        {kind:'patch',path:`users/${uid}`,data:{name}},
        {kind:'patch',path:`publicProfiles/${uid}`,data:{name}},
      ]);
      await locked(`nexus-data-${uid}`,()=>{
        const queue=store(uid), path=`users/${uid}`, profile=queue.cached(path);
        if(profile)queue.cache(path,{...profile,name});
      });
      return name;
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
    async supportThreads() {
      requireOnline();
      const collection=C.collection(db,'supportThreads'),admin=auth.currentUser.uid===OWNER_UID;
      const query=admin?C.query(collection,C.orderBy('updatedAt','desc'),C.limit(50)):C.query(collection,C.where('userId','==',auth.currentUser.uid),C.orderBy('updatedAt','desc'),C.limit(50));
      return (await timeout(C.getDocsFromServer(query))).docs.map(doc=>({...doc.data(),id:doc.id}));
    },
    async supportThread(id) {
      requireOnline();if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Звернення не знайдено.');
      const snapshot=await timeout(C.getDocFromServer(C.doc(db,`supportThreads/${id}`)));
      if(!snapshot.exists())throw Error('Звернення не знайдено.');return {...snapshot.data(),id:snapshot.id};
    },
    async createSupportThread(value) {
      requireOnline();
      const email=String(value.email||'').trim(),subject=String(value.subject||'').trim(),body=String(value.body||'').trim(),category=String(value.category||'technical');
      if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Вкажи коректну електронну пошту.');
      if(!subject||subject.length>120||!body||body.length>4000||!['technical','cooperation','other'].includes(category))throw Error('Вкажи тему до 120 символів і повідомлення до 4000 символів.');
      const id=crypto.randomUUID(),uid=auth.currentUser.uid,admin=uid===OWNER_UID,authorName=String(auth.currentUser.displayName||'Спортсмен').slice(0,100);
      await commit([{kind:'save',path:`supportThreads/${id}`,data:{userId:uid,email,subject,category,status:'open',createdAt:C.serverTimestamp(),updatedAt:C.serverTimestamp(),lastSenderId:uid,lastMessageId:'initial'}},
        {kind:'save',path:`supportThreads/${id}/messages/initial`,data:{authorId:uid,authorName,authorRole:admin?'admin':'user',body,createdAt:C.serverTimestamp()}}]);
      return id;
    },
    async replySupportThread(id,text) {
      requireOnline();const body=String(text||'').trim();if(!body||body.length>4000)throw Error('Повідомлення — від 1 до 4000 символів.');
      const thread=await api.supportThread(id),uid=auth.currentUser.uid,admin=uid===OWNER_UID;
      if(!admin&&thread.userId!==uid)throw Error('Немає доступу до цього листування.');
      const messageId=crypto.randomUUID(),authorName=String(auth.currentUser.displayName||'Спортсмен').slice(0,100);
      await commit([{kind:'save',path:`supportThreads/${id}/messages/${messageId}`,data:{authorId:uid,authorName,authorRole:admin?'admin':'user',body,createdAt:C.serverTimestamp()}},
        {kind:'patch',path:`supportThreads/${id}`,data:{status:'open',updatedAt:C.serverTimestamp(),lastSenderId:uid,lastMessageId:messageId}}]);
    },
    watchSupportMessages(id,onChange,onError) {
      return C.onSnapshot(C.query(C.collection(db,`supportThreads/${id}/messages`),C.orderBy('createdAt','desc'),C.limit(100)),snapshot=>onChange(snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).reverse()),onError);
    },
    watchSupportThread(id,onChange,onError) {
      return C.onSnapshot(C.doc(db,`supportThreads/${id}`),snapshot=>{if(snapshot.exists())onChange({...snapshot.data(),id:snapshot.id});},onError);
    },
    async setSupportStatus(id,status) {
      requireOnline();if(auth.currentUser.uid!==OWNER_UID||!['open','resolved'].includes(status))throw Error('Немає доступу.');
      await commit([{kind:'patch',path:`supportThreads/${id}`,data:{status,updatedAt:C.serverTimestamp()}}]);
    },
    async profileComments(uid) {
      requireOnline();
      const q = C.query(C.collection(db, `publicProfiles/${uid}/comments`), C.orderBy('createdAt', 'desc'), C.limit(50));
      const comments = (await timeout(C.getDocsFromServer(q))).docs.map((d) => ({ ...d.data(), id: d.id }));
      const parents = [...new Set(comments.map((c) => c.parentId).filter((id) => id && !comments.some((c) => c.id === id)))];
      const missing = await Promise.all(parents.map(id => timeout(C.getDocFromServer(C.doc(db, `publicProfiles/${uid}/comments/${id}`)))));
      for (const parent of missing) if (parent.exists()) comments.push({ ...parent.data(), id: parent.id });
      return Promise.all(comments.map(async (comment) => ({ ...comment,
        reactions: await api.commentReactions(`publicProfiles/${uid}/comments/${comment.id}`) })));
    },
    async publicIdentity(uid) {
      const cached=identityLookups.get(uid);
      if(cached && Date.now()-cached.at<30000)return cached.promise;
      const promise=(async()=>{
        const card=await cachedRead(`profileCards/${uid}`,300000);
        const person=card||await api.getLive(`publicProfiles/${uid}`);
        return {uid,name:person?.name||'Спортсмен',photo:person?.photo||'',customId:person?.customId||null};
      })();
      identityLookups.set(uid,{at:Date.now(),promise});
      try{return await promise;}catch(error){identityLookups.delete(uid);throw error;}
    },
    async commentReactions(path) {
      const entries = await api.list(`${path}/reactions`);
      if (path.startsWith('publicProfiles/')) {
        const legacy = await api.list(`${path}/likes`);
        entries.push(...legacy.filter(like => !entries.some(entry => entry.id === like.id)).map(like => ({ ...like, kind: 'love' })));
      }
      const decorated=await Promise.all(entries.map(async entry=>{
        const person=await api.publicIdentity(entry.id);
        return {...entry,authorName:person?.name||'Спортсмен',authorPhoto:person?.photo||''};
      }));
      return reactionSummary(decorated, auth.currentUser.uid);
    },
    async reactToComment(path, kind) {
      requireOnline();
      if (!Object.hasOwn(reactions,kind) || !/^(exercises|programTemplates|publicProfiles)\/[^/]+\/comments\/[^/]+$/.test(path)) throw Error('Невідома реакція.');
      const ref = C.doc(db, `${path}/reactions/${auth.currentUser.uid}`);
      let added = false;
      await C.runTransaction(db, async transaction => {
        const current = await transaction.get(ref);
        const legacyRef = path.startsWith('publicProfiles/') ? C.doc(db, `${path}/likes/${auth.currentUser.uid}`) : null;
        const legacy = legacyRef ? await transaction.get(legacyRef) : null;
        const previousKind = current.exists() ? current.data().kind : legacy?.exists() ? 'love' : '';
        added = previousKind !== kind;
        if (legacy?.exists()) transaction.delete(legacyRef);
        if (added) transaction.set(ref, { kind, createdAt: C.serverTimestamp() });
        else transaction.delete(ref);
      });
      await locked(`nexus-data-${auth.currentUser.uid}`, () => store().invalidate([
        `${path}/reactions/${auth.currentUser.uid}`,
        `${path}/likes/${auth.currentUser.uid}`,
      ]));
      if (added) await api.recordActivity('reaction', path, kind);
    },
    async recordActivity(type, target, detail = '') {
      try {
        await api.save(`publicProfiles/${auth.currentUser.uid}/activity/${crypto.randomUUID()}`, {
          type, target, detail: String(detail).slice(0, 100), createdAt: C.serverTimestamp(),
        });
      } catch (error) { console.warn('Не вдалося записати активність:', error.code || error.message); }
    },
    async recentActivity(uid, workouts = false) {
      requireOnline();
      const path = `publicProfiles/${uid}/${workouts ? 'workoutActivity' : 'activity'}`;
      const q = C.query(C.collection(db, path), C.orderBy('createdAt', 'desc'), C.limit(30));
      return (await timeout(C.getDocsFromServer(q))).docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async setRecordVisibility(key, visible, sessions, manualSets = []) {
      requireOnline();
      const uid=auth.currentUser.uid,records=personalRecords(progressSessions(sessions,manualSets));
      if(!records.some(record=>record.key===key)||typeof visible!=='boolean')throw Error('Рекорд уже недоступний. Онови профіль.');
      const preferenceRef=C.doc(db,`users/${uid}/recordSettings/visibility`),profileRef=C.doc(db,`publicProfiles/${uid}`);
      return C.runTransaction(db,async transaction=>{
        const [preferenceSnapshot,profileSnapshot]=await Promise.all([transaction.get(preferenceRef),transaction.get(profileRef)]);
        if(!profileSnapshot.exists())throw Error('Спочатку онови профіль.');
        const profile=profileSnapshot.data(),previous=preferenceSnapshot.exists()?preferenceSnapshot.data():null;
        const keys=new Set(recordSharingKeys(records,previous,profile.visibility?.records===true));
        if(visible)keys.add(key);else keys.delete(key);
        if(keys.size>200)throw Error('Можна показувати до 200 рекордів. Спочатку приховай один із вибраних.');
        const preference={visibleKeys:[...keys],revision:(previous?.revision||0)+1};
        const visibility={...(profile.visibility||{}),...(visible?{records:true}:{})};
        transaction.set(preferenceRef,preference);
        transaction.set(C.doc(db,`publicProfiles/${uid}/stats/records`),{items:sharedRecords(records,preference),visibilityVersion:preference.revision});
        if(visible&&profile.visibility?.records!==true)transaction.update(profileRef,{visibility});
        return {preference,visibility};
      });
    },
    async setProfileVisibility(visibility,sessions,programs=[],manualSets=[],streakSessions=sessions) {
      requireOnline();
      if (typeof visibility.calendar !== 'boolean' || !Object.hasOwn(calendarScopeLabels,visibility.calendarScope)) throw Error('Перевір видимість і типи тренувань у календарі.');
      const uid=auth.currentUser.uid,ref=C.doc(db,`publicProfiles/${uid}`);
      const calendar=calendarSnapshot(sessions,{visibility},programs);
      await C.runTransaction(db,async transaction=>{
        const [existing,preference]=await Promise.all([transaction.get(ref),transaction.get(C.doc(db,`users/${uid}/recordSettings/visibility`))]);
        if (!existing.exists()) throw Error('Спочатку завантаж профіль.');
        const snapshots=profileSnapshots(sessions,preference.exists()?preference.data():null,manualSets,{visibility},programs,streakSessions);
        transaction.update(ref,{visibility});
        for(const [kind,data] of Object.entries(snapshots))transaction.set(C.doc(db,`publicProfiles/${uid}/stats/${kind}`),data);
      });
      return calendar;
    },
    async publishProfileStats(sessions, manualSets = [],programs=[],streakSessions=sessions) {
      requireOnline();
      sessions = structuredClone(sessions);
      manualSets = structuredClone(manualSets);programs=structuredClone(programs);streakSessions=structuredClone(streakSessions);
      const uid = auth.currentUser.uid;
      const signature = await statsSignature(sessions, manualSets, new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' }),programs,streakSessions);
      return locked(`nexus-stats-${uid}`, () => publishOnce(localStorage, `nexus:published-stats:v2:${uid}`, signature, async () => {
        if (auth.currentUser?.uid !== uid) throw Error('Обліковий запис змінився.');
        await C.runTransaction(db,async transaction=>{
          const [preference,profile]=await Promise.all([transaction.get(C.doc(db,`users/${uid}/recordSettings/visibility`)),transaction.get(C.doc(db,`publicProfiles/${uid}`))]);
          const snapshots=profileSnapshots(sessions,preference.exists()?preference.data():null,manualSets,profile.data()||{},programs,streakSessions);
          if(!profile.exists())delete snapshots.calendar;
          for(const [kind,data] of Object.entries(snapshots))transaction.set(C.doc(db,`publicProfiles/${uid}/stats/${kind}`),data);
        });
        const completed = sessions.filter(s => s.status === 'completed').sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,30);
        const existing = await api.list(`publicProfiles/${uid}/workoutActivity`);
        const operations = existing.filter(e => !completed.some(s => s.id === e.id)).map(e => ({ kind: 'remove', path: `publicProfiles/${uid}/workoutActivity/${e.id}` }));
        for (const session of completed) {
          const detail = String(session.name || 'Тренування').slice(0,100);
          const createdAt = new Date(session.endedAt || session.updatedAt || session.date);
          const previous = existing.find(entry => entry.id === session.id);
          if (previous?.detail === detail && activityMillis(previous.createdAt) === createdAt.getTime()) continue;
          operations.push({ kind: 'save', path: `publicProfiles/${uid}/workoutActivity/${session.id}`,
            data: { type: 'workout', target: session.id, detail, createdAt } });
        }
        if (operations.length) await commit(operations);
      }));
    },
    async addProfileComment(uid, text, parentId = '', photo = '', richText = '') {
      requireOnline();
      const author = await api.getLive(`publicProfiles/${auth.currentUser.uid}`);
      const id = crypto.randomUUID();
      const operations = [{ kind: 'save', path: `publicProfiles/${uid}/comments/${id}`,
        data: { authorId: auth.currentUser.uid, authorName: author.name, text, parentId, photo, ...(richText?{richText}:{}), createdAt: C.serverTimestamp() } }];
      if (uid !== auth.currentUser.uid) operations.push(notice(uid, 'comment', id, uid));
      if (parentId) {
        const parent = await api.getLive(`publicProfiles/${uid}/comments/${parentId}`);
        if (!parent || parent.parentId) throw Error('Коментар для відповіді вже недоступний.');
        if (parent.authorId !== uid && parent.authorId !== auth.currentUser.uid) operations.push(notice(parent.authorId, 'reply', id, uid));
      }
      await commit(operations);
      await api.recordActivity(parentId ? 'reply' : 'comment', `publicProfiles/${uid}/comments/${id}`);
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
          commentText: source?.text || '', ...(source?.richText?{commentRichText:source.richText}:{}), status: 'open', createdAt: C.serverTimestamp() });
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
    async sendTrainingInvite(to, data, requestId='') {
      requireOnline();
      const from = auth.currentUser.uid, id = requestId||crypto.randomUUID();
      const alreadySent=async()=>{
        if(!requestId)return false;
        const previous=await readSpark(`trainingInvites/${id}`).catch(error=>{if(error.code==='permission-denied')return null;throw error;});
        if(!previous)return false;
        if(previous.from!==from||previous.to!==to||previous.date!==data.date||previous.time!==data.time)throw Error('Запрошення з таким ID вже існує.');
        return true;
      };
      if(await alreadySent())return id;
      const invite = { ...data, from, to, members: [from, to], status: 'pending', createdAt: C.serverTimestamp() };
      const session = inviteSession(invite, id, from), { id: sessionId, ...stored } = session;
      try {
      await commit([{ kind: 'save', path: `trainingInvites/${id}`, data: invite },
        { kind: 'save', path: `users/${from}/sessions/${sessionId}`, data: stored }, notice(to, 'training_invite', id, from)]);
      } catch(error) {if(!await alreadySent())throw error;}
      return id;
    },
    watchWorkoutTurns(id,onChange,onError) {
      return C.onSnapshot(C.doc(db,`trainingInvites/${id}/turns/current`),snapshot=>onChange(snapshot.exists()?snapshot.data():null),onError);
    },
    async updateWorkoutTurns(id,action,token='') {
      requireOnline();const uid=auth.currentUser.uid;
      const turnRef=C.doc(db,`trainingInvites/${id}/turns/current`);
      try{return await timeout(C.runTransaction(db,async transaction=>{
        const inviteRef=C.doc(db,`trainingInvites/${id}`);
        const [invite,previous]=await Promise.all([transaction.get(inviteRef),transaction.get(turnRef)]);
        const next=nextTurnState(invite.data(),uid,action,previous.exists()?previous.data():null,token);
        if(next)transaction.set(turnRef,{...next,updatedAt:C.serverTimestamp()});
        return next||previous.data()||null;
      }),8000);}catch(error){
        if(error.code==='permission-denied'){const current=(await C.getDocFromServer(turnRef)).data();if(turnActionApplied(current,uid,action,token))return current;}
        throw error;
      }
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
    async olderNotifications(lastId) {
      requireOnline();
      const path=`users/${auth.currentUser.uid}/notifications`,last=await C.getDocFromServer(C.doc(db,`${path}/${lastId}`));
      if(!last.exists())throw Error('Онови список сповіщень.');
      const snapshot=await C.getDocsFromServer(C.query(C.collection(db,path),C.orderBy('createdAt','desc'),C.startAfter(last),C.limit(50)));
      return snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
    },
    async readNotifications(ids) {
      requireOnline();
      for(let start=0;start<ids.length;start+=100)await commit(ids.slice(start,start+100).map(id=>({kind:'patch',path:`users/${auth.currentUser.uid}/notifications/${id}`,data:{read:true}})));
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
  const readers = new Map();
  function cachedRead(path, age = 60000) {
    const uid = auth.currentUser?.uid;
    if (!readers.has(uid)) readers.set(uid, createReadCache({
      store: store(uid), online: () => navigator.onLine, retryable,
      lock: fn => locked(`nexus-data-${uid}`, fn),
      readLock: (path, fn) => locked(`nexus-read-${uid}-${path}`, fn),
      fetch: async path => {
        if (path.split('/').length % 2) {
          return (await timeout(C.getDocsFromServer(C.collection(db, path)))).docs.map(x => ({ ...x.data(), id: x.id }));
        }
        const snapshot = await timeout(C.getDocFromServer(C.doc(db, path)));
        return snapshot.exists() ? snapshot.data() : null;
      },
    }));
    return readers.get(uid)(path, age);
  }
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
