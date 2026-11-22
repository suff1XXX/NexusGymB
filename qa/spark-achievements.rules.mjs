import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as C from 'firebase/firestore';
import assert from 'node:assert/strict';
import {weekStart,shiftDate,defaultBlockOrder} from '../public/js/training-experience.js';
import {achievementCatalog} from '../public/js/achievement-catalog.js';
import {invitePlan} from '../public/js/training-invites.js';
import {newSession} from '../public/js/model.js';

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
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  await alice.api.saveWeeklyGoal(weekStart(today),4);
  assert.equal((await alice.api.weeklyGoals())[0].target,4);
  await assertFails(C.getDoc(C.doc(bob.db,`users/alice/weeklyGoals/${weekStart(today)}`)));
  await assertFails(C.getDoc(C.doc(ceo.db,`users/alice/weeklyGoals/${weekStart(today)}`)));
  await assertFails(C.setDoc(C.doc(alice.db,`users/alice/weeklyGoals/${weekStart(today)}`),{week:weekStart(today),target:99,updatedAt:C.serverTimestamp()}));
  await alice.api.saveWorkoutReflection('first',{difficulty:7,energy:4,note:'Приватна нотатка'});
  assert.equal((await get(alice.db,'users/alice/workoutReflections/first')).note,'Приватна нотатка');
  await assertFails(C.getDoc(C.doc(bob.db,'users/alice/workoutReflections/first')));
  await assertFails(C.getDoc(C.doc(ceo.db,'users/alice/workoutReflections/first')));
  await assert.rejects(alice.api.saveWorkoutReflection('missing',{difficulty:3,energy:3,note:''}));
  await alice.api.saveProfileLayout({order:[...defaultBlockOrder].reverse(),visible:['medals','goals','comments']});
  assert.equal((await get(bob.db,'publicProfiles/alice/layout/display')).order[0],'comments');
  await assertFails(C.setDoc(C.doc(bob.db,'publicProfiles/alice/layout/display'),{order:defaultBlockOrder,visible:defaultBlockOrder,updatedAt:C.serverTimestamp()}));
  await alice.api.saveProfileLayout({order:defaultBlockOrder,visible:defaultBlockOrder});
  const event=await get(alice.db,'users/alice/achievementEvents/first-workout');
  assert.equal(event.medalId,'first-workout');assert.equal(event.source,'automatic');
  await alice.api.readAchievementEvents(['first-workout']);
  assert.equal((await get(alice.db,'users/alice/achievementEvents/first-workout')).read,true);
  await assertFails(C.getDoc(C.doc(bob.db,'users/alice/achievementEvents/first-workout')));
  await assertFails(C.updateDoc(C.doc(alice.db,'users/alice/achievementEvents/first-workout'),{reason:'Підміна'}));
  await assertFails(C.deleteDoc(C.doc(alice.db,'users/alice/achievementEvents/first-workout')));
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await C.setDoc(C.doc(db,'gymBros/alice_bob'),{from:'alice',to:'bob',members:['alice','bob'],status:'accepted'});
    for(const uid of ['alice','bob'])await C.setDoc(C.doc(db,`users/${uid}/sessions/experience-new`),{...workout,name:'Тестові ноги',date:today,programId:'p',dayId:1,startedAt:Date.now()-2700000,endedAt:Date.now(),logs:[{index:0,weight:65,reps:12}]});
  });
  const challenge=await alice.api.createChallenge('bob',{title:'Разом до цілі',target:1,startDate:today,endDate:shiftDate(today,7)});
  await assert.rejects(alice.api.respondChallenge(challenge,'accepted'));
  await bob.api.respondChallenge(challenge,'accepted');
  await assertFails(C.updateDoc(C.doc(bob.db,`gymChallenges/${challenge}`),{target:30}));
  await assertFails(C.getDoc(C.doc(ceo.db,`gymChallenges/${challenge}`)));
  await alice.api.refreshAchievements();progress=await bob.api.refreshAchievements();
  assert.equal(progress.facts.challenges,1);assert.ok(progress.earnedIds.includes('gymbro-challenge'));
  progress=await alice.api.refreshAchievements();assert.ok(progress.earnedIds.includes('gymbro-challenge'));
  await assertFails(C.setDoc(C.doc(bob.db,`gymChallenges/${challenge}/progress/alice`),{count:0,updatedAt:C.serverTimestamp()}));
  await env.withSecurityRulesDisabled(async context=>C.deleteDoc(C.doc(context.firestore(),'users/bob/sessions/experience-new')));
  await bob.api.refreshAchievements();progress=await alice.api.refreshAchievements();assert.ok(!progress.earnedIds.includes('gymbro-challenge'));
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await C.setDoc(C.doc(db,'users/all-medals'),{name:'Всі медалі',email:'all-medals@example.test',customId:99,createdAt:1});
    await C.setDoc(C.doc(db,'publicProfiles/all-medals'),{name:'Всі медалі',photo:'',customId:99,joinedAt:1});
    await C.setDoc(C.doc(db,'users/all-medals/achievementGrants/current'),{ids:achievementCatalog.map(m=>m.id),updatedAt:C.Timestamp.now(),updatedBy:owner});
  });
  const allMedals=await client('all-medals');
  assert.equal((await allMedals.api.refreshAchievements()).earnedIds.length,achievementCatalog.length);
  assert.equal((await C.getDocs(C.collection(allMedals.db,'users/all-medals/achievementEvents'))).size,achievementCatalog.length);
  const pollOptions=Array.from({length:6},(_,index)=>({date:shiftDate(today,index+1),time:'18:00'}));
  const pollId=await alice.api.createMeetingPoll('bob',{title:'Коли йдемо в зал?',options:pollOptions});
  assert.equal((await get(alice.db,`meetingPolls/${pollId}/votes/alice`)).choices.length,6);
  await assert.rejects(alice.api.closeMeetingPoll(pollId,0));
  await assertFails(C.getDoc(C.doc(ceo.db,`meetingPolls/${pollId}`)));
  await assertFails(C.setDoc(C.doc(bob.db,`meetingPolls/${pollId}/votes/alice`),{choices:[0],updatedAt:C.serverTimestamp()}));
  await assertFails(C.setDoc(C.doc(bob.db,`meetingPolls/${pollId}/votes/bob`),{choices:[99],updatedAt:C.serverTimestamp()}));
  await bob.api.voteMeetingPoll(pollId,[1,2]);
  await assert.rejects(bob.api.closeMeetingPoll(pollId,1));
  await alice.api.closeMeetingPoll(pollId,1);
  assert.equal((await get(bob.db,`meetingPolls/${pollId}`)).selectedIndex,1);
  await assert.rejects(bob.api.voteMeetingPoll(pollId,[0]));
  await assertFails(C.updateDoc(C.doc(alice.db,`meetingPolls/${pollId}`),{title:'Підміна часу'}));
  const inviteProgram={id:'replacement-source',name:'Основна програма',type:'Власна програма',scope:'main',builderMode:'advanced',days:[{weekday:0,name:'Жим',groups:'Груди',items:[{exerciseId:'press',name:'Жим штанги',primary:'Груди',sets:3,reps:'8',weight:50,seconds:0,rest:60,metrics:[]}]}]};
  const plan=invitePlan(inviteProgram,0,pollOptions[1].date,pollOptions[1].time);
  const sent=await Promise.all([alice.api.sendPollInvite(pollId,plan),alice.api.sendPollInvite(pollId,plan)]);
  assert.equal(sent[0],sent[1]);assert.equal(sent[0],`poll_${pollId}`);
  assert.equal((await get(alice.db,`users/alice/sessions/invite_${sent[0]}`)).status,'planned');
  assert.equal(await get(bob.db,`users/bob/sessions/invite_${sent[0]}`),undefined);
  await bob.api.respondTrainingInvite(sent[0],'accepted');
  assert.equal((await get(bob.db,`users/bob/sessions/invite_${sent[0]}`)).status,'planned');
  assert.equal(await alice.api.sendPollInvite(pollId,plan),sent[0]);
  const declinedPoll=await bob.api.createMeetingPoll('alice',{title:'Інший час',options:pollOptions.slice(0,2)});
  await alice.api.voteMeetingPoll(declinedPoll,[]);await bob.api.voteMeetingPoll(declinedPoll,[]);
  await assert.rejects(bob.api.closeMeetingPoll(declinedPoll,0));await bob.api.cancelMeetingPoll(declinedPoll);
  if(process.env.QA_BROWSER_PATH) {
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await C.updateDoc(C.doc(db,'publicProfiles/alice'),{visibility:{records:true}});
      await C.setDoc(C.doc(db,'publicProfiles/alice/stats/records'),{items:[{key:'squat',name:'Присідання',weight:65,reps:12,date:today}]});
      await C.setDoc(C.doc(db,'users/alice/programs/replacement-source'),inviteProgram);
      await C.setDoc(C.doc(db,'users/alice/programs/home-source'),{...inviteProgram,id:'home-source',name:'Домашній комплекс',scope:'home'});
      await C.setDoc(C.doc(db,'users/alice/sessions/today-only'),{...newSession(inviteProgram,inviteProgram.days[0]),id:'today-only'});
      await C.setDoc(C.doc(db,'users/alice/sessions/home-history'),{...workout,name:'Домашній комплекс',scope:'home',programId:'home-source',date:today});
      await C.setDoc(C.doc(db,'users/alice/sessions/main-history'),{...workout,name:'Основна програма',scope:'main',programId:'replacement-source',date:today});
      await C.setDoc(C.doc(db,'exercises/alternate-press'),{name:'Жим у тренажері',primary:'Груди',equipment:'Тренажер'});
    });
    await (await import('./spark-achievements.browser.mjs')).checkSparkBrowser(owner);
  }
  console.log('Spark rules passed: achievements, fixed scoring, private goals and reflections, layout ownership, immutable medal history, challenge acceptance and completion, and all-medal migration.');
} finally {await env.cleanup();}
