import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {onDocumentWritten} from 'firebase-functions/v2/firestore';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {recomputeAchievements,publishAchievementDisplay,recordAchievementDay,sessionAchievementSignature} from './lib/achievement-service.js';
import {manageAchievementAward} from './lib/achievement-admin.js';

initializeApp();
const db=getFirestore(),region='europe-west1';
const trigger=(document,handler)=>onDocumentWritten({document,region,retry:true,maxInstances:5},handler);
export const manageGymBAchievementAward=onCall({region,maxInstances:3},request=>manageAchievementAward(db,request));
export const gymBAchievementAwards=trigger('users/{uid}/achievementAwards/{id}',event=>recomputeAchievements(db,event.params.uid));
export const refreshGymBAchievements=onCall({region,maxInstances:5},async request=>{
  if(!request.auth || request.auth.token.email_verified!==true)throw new HttpsError('unauthenticated','Увійди та підтвердь пошту.');
  await recomputeAchievements(db,request.auth.uid,{claimRefresh:true});
  return {ok:true};
});
export const gymBAchievementSessions=trigger('users/{uid}/sessions/{id}',async event=>{
  const before=event.data?.before.data(),after=event.data?.after.data();
  if(sessionAchievementSignature(before)===sessionAchievementSignature(after))return;
  const members=new Set([event.params.uid]);
  for(const id of new Set([before?.invitationId,after?.invitationId])) {
    if(typeof id!=='string'||!id||id.includes('/'))continue;
    const invite=(await db.doc(`trainingInvites/${id}`).get()).data();
    if(invite&&[invite.from,invite.to].includes(event.params.uid))for(const uid of [invite.from,invite.to])members.add(uid);
  }
  await Promise.all([...members].map(uid=>recomputeAchievements(db,uid)));
});
export const gymBAchievementTrainingInvites=trigger('trainingInvites/{id}',async event=>{
  const before=event.data?.before.data(),after=event.data?.after.data();
  if(before?.status!=='accepted'&&after?.status!=='accepted')return;
  const members=[...new Set([before?.from,before?.to,after?.from,after?.to].filter(uid=>typeof uid==='string'&&uid&&!uid.includes('/')))];
  await Promise.all(members.map(uid=>recomputeAchievements(db,uid)));
});
export const gymBAchievementPrograms=trigger('users/{uid}/programs/{id}',event=>recomputeAchievements(db,event.params.uid));
export const gymBAchievementExercises=trigger('users/{uid}/exercises/{id}',event=>recomputeAchievements(db,event.params.uid));
export const gymBAchievementProfile=trigger('publicProfiles/{uid}',async event=>{
  const before=event.data?.before.data()||{},after=event.data?.after.data()||{};
  if(['name','photo','bio','location','customId'].some(key=>before[key]!==after[key]))await recomputeAchievements(db,event.params.uid);
});
export const gymBAchievementFriends=trigger('gymBros/{id}',async event=>{
  const before=event.data?.before.data(),after=event.data?.after.data();
  if(before?.status!=='accepted'&&after?.status!=='accepted')return;
  const members=[...new Set([...(before?.members||[]),...(after?.members||[])])];
  await Promise.all(members.map(uid=>recomputeAchievements(db,uid)));
});
export const gymBAchievementComments=trigger('{scope}/{target}/comments/{id}',async event=>{
  if(!['publicProfiles','exercises','programTemplates'].includes(event.params.scope))return;
  const ids=[...new Set([event.data?.before.data()?.authorId,event.data?.after.data()?.authorId].filter(Boolean))];
  await Promise.all(ids.map(uid=>recomputeAchievements(db,uid)));
});
export const gymBAchievementSettings=trigger('users/{uid}/achievementSettings/display',event=>publishAchievementDisplay(db,event.params.uid));
export const gymBAchievementDays=trigger('users/{uid}',async event=>{
  const before=event.data?.before.data(),after=event.data?.after.data();
  if(!after){await recomputeAchievements(db,event.params.uid);return;}
  if(!after.lastActiveAt || before?.lastActiveAt?.isEqual?.(after.lastActiveAt))return;
  if(await recordAchievementDay(db,event.params.uid))await recomputeAchievements(db,event.params.uid);
});
