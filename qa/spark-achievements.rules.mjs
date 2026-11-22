import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as C from 'firebase/firestore';
import assert from 'node:assert/strict';

const owner='ljYr2MF28zg1zAFsD7M1sNH6s8O2';
const env=await initializeTestEnvironment({projectId:'demo-nexus-gymb',firestore:{rules:readFileSync('firestore.rules','utf8')}});
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
globalThis.window={dispatchEvent:()=>{}};
const source=readFileSync('public/js/firebase.js','utf8').replace(/from\s*(['"])(\.\/[^'"]+)\1/g,(_,quote,path)=>`from ${quote}${new URL(path,new URL('../public/js/firebase.js',import.meta.url)).href}${quote}`)
  .replace(/const \[A, B, C\] = await Promise\.all\(\[[\s\S]*?\]\);/,'const [A,B,C]=globalThis.sparkTestModules;');
async function client(uid) {
  const db=env.authenticatedContext(uid,{email_verified:true,email:`${uid}@example.test`}).firestore(),auth={currentUser:{uid,emailVerified:true}};
  globalThis.sparkTestModules=[{initializeApp:()=>({})},{getAuth:()=>auth,setPersistence:async()=>{},browserLocalPersistence:{}},{...C,getFirestore:()=>db}];
  const {connect}=await import('data:text/javascript;base64,'+Buffer.from(`// ${uid}\n`+source).toString('base64'));
  return {db,api:await connect()};
}
let admin;
const workout={status:'completed',date:'2026-11-19',items:[{exerciseId:'squat',name:'Присідання',sets:3}],logs:[{index:0,reps:10,weight:50}],simpleCompleted:[]};
const get=async(db,path)=>(await C.getDoc(C.doc(db,path))).data();
try {
  await env.withSecurityRulesDisabled(async context=>{
    admin=context.firestore();
    for(const [i,uid] of ['alice','bob',owner].entries()) {
      await C.setDoc(C.doc(admin,`users/${uid}`),{name:uid,email:`${uid}@example.test`,customId:i+1,createdAt:1});
      await C.setDoc(C.doc(admin,`publicProfiles/${uid}`),{name:uid,photo:'',customId:i+1,joinedAt:1});
    }
    await C.setDoc(C.doc(admin,'users/alice/sessions/first'),workout);
    await C.setDoc(C.doc(admin,'publicProfiles/bob/comments/c'),{authorId:'alice',text:'Коментар',createdAt:1});
  });
  const alice=await client('alice'),bob=await client('bob'),ceo=await client(owner);
  await env.withSecurityRulesDisabled(async context=>C.setDoc(C.doc(context.firestore(),'users/new-user'),{name:'Новий користувач',email:'new-user@example.test',customId:4,createdAt:1}));
  assert.equal((await ceo.api.adminAchievementAwards('new-user','grant','ceo-praise')).score,300);
  const newcomer=await client('new-user');
  assert.equal((await newcomer.api.refreshAchievements()).score,300);
  let progress=await alice.api.refreshAchievements();
  assert.equal(progress.score,40);assert.equal(progress.facts.activeDays,1);assert.ok(progress.earnedIds.includes('first-comment'));
  assert.equal((await alice.api.refreshAchievements()).facts.activeDays,1);
  await alice.api.saveAchievementDisplay(['first-workout'],true);
  assert.equal((await get(bob.db,'achievementScores/alice')).score,40);
  assert.deepEqual((await get(bob.db,'publicProfiles/alice/achievements/showcase')).selectedIds,['first-workout']);
  await assert.rejects(alice.api.adminAchievementAwards('alice','grant','ceo-praise'));
  await assertFails(C.setDoc(C.doc(alice.db,'users/alice/achievementGrants/current'),{ids:['ceo-praise'],updatedBy:'alice',updatedAt:C.serverTimestamp()}));
  const forged={...progress,score:999999,updatedAt:C.serverTimestamp()};
  await assertFails(C.setDoc(C.doc(alice.db,'users/alice/achievements/progress'),forged));
  await assertFails(C.setDoc(C.doc(alice.db,'users/alice/achievements/progress'),{...progress,earnedIds:[...progress.earnedIds,'ceo-praise'],manualIds:['ceo-praise'],score:340,updatedAt:C.serverTimestamp()}));
  await assertFails(C.updateDoc(C.doc(alice.db,'achievementScores/alice'),{score:999999,updatedAt:C.serverTimestamp()}));
  await assertFails(C.getDoc(C.doc(bob.db,'users/alice/achievements/progress')));
  await assertFails(C.getDoc(C.doc(bob.db,'users/alice/sessions/first')));
  progress=await ceo.api.adminAchievementAwards('alice','grant','ceo-praise','Відзнака');
  assert.equal(progress.score,340);assert.ok(progress.manualIds.includes('ceo-praise'));
  assert.equal((await ceo.api.adminAchievementAwards('alice','grant','ceo-praise')).score,340);
  assert.equal((await C.getDocs(C.collection(ceo.db,'users/alice/achievementAwardAudit'))).size,1);
  await alice.api.saveAchievementDisplay(['first-workout','ceo-praise'],true);
  progress=await ceo.api.adminAchievementAwards('alice','grant','bad-gymbro');assert.equal(progress.score,340);
  progress=await ceo.api.adminAchievementAwards('alice','revoke','ceo-praise');assert.equal(progress.score,40);
  assert.deepEqual((await get(bob.db,'publicProfiles/alice/achievements/showcase')).selectedIds,['first-workout']);
  assert.equal((await get(bob.db,'achievementScores/alice')).score,40);
  await assertFails(C.setDoc(C.doc(ceo.db,'users/bob/achievementSettings/display'),{selectedIds:[],rankingEnabled:true}));
  await alice.api.saveAchievementDisplay(['first-workout'],false);
  assert.equal(await get(bob.db,'achievementScores/alice'),undefined);
  progress=await ceo.api.adminAchievementAwards('alice','grant','first-workout');assert.equal(progress.score,40);
  progress=await ceo.api.adminAchievementAwards('alice','revoke','first-workout');assert.equal(progress.score,40);
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(let i=0;i<5;i++) {
      const id=`shared-${i}`;
      await C.setDoc(C.doc(db,`trainingInvites/${id}`),{from:'alice',to:'bob',members:['alice','bob'],status:'accepted',date:workout.date});
      for(const uid of ['alice','bob'])await C.setDoc(C.doc(db,`users/${uid}/sessions/invite_${id}`),{...workout,invitationId:id,gymBroId:uid==='alice'?'bob':'alice'});
    }
  });
  await alice.api.refreshAchievements();await bob.api.refreshAchievements();progress=await alice.api.refreshAchievements();
  assert.equal(progress.facts.sharedWorkouts,5);assert.ok(progress.earnedIds.includes('best-gymbro'));
  await env.withSecurityRulesDisabled(async context=>C.deleteDoc(C.doc(context.firestore(),'users/bob/sessions/invite_shared-0')));
  progress=await alice.api.refreshAchievements();assert.equal(progress.facts.sharedWorkouts,4);assert.ok(!progress.earnedIds.includes('best-gymbro'));
  await assertFails(C.updateDoc(C.doc(alice.db,'users/alice/achievementActivity/current'),{count:30,updatedAt:C.serverTimestamp()}));
  await assertFails(C.setDoc(C.doc(bob.db,'trainingInvites/shared-0/completions/alice'),{completed:true,updatedAt:C.serverTimestamp()}));
  if(process.env.QA_BROWSER_PATH)await (await import('./spark-achievements.browser.mjs')).checkSparkBrowser(owner);
  console.log('Spark achievements passed: real client refresh, private data, fixed scores, owner grants, duplicate protection, showcase, opt-out, daily limits and shared completion proofs.');
} finally {await env.cleanup();}
