import {FieldValue,Timestamp} from 'firebase-admin/firestore';
import {achievementFacts,evaluateAchievements,sharedWorkoutCount} from './achievement-catalog.js';

const data = snapshot=>snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
const today = ()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function writePublic(transaction,db,uid,progress,settings,profile) {
  const selectedIds=[...new Set(settings?.selectedIds||[])].filter(id=>progress.earnedIds.includes(id)).slice(0,3);
  const showcase=db.doc(`publicProfiles/${uid}/achievements/showcase`),score=db.doc(`achievementScores/${uid}`);
  if(!profile){transaction.delete(showcase);transaction.delete(score);return selectedIds;}
  transaction.set(showcase,{selectedIds,updatedAt:FieldValue.serverTimestamp()});
  if(settings?.rankingEnabled===true && profile && Number.isInteger(profile.customId))
    transaction.set(score,{uid,name:profile.name||'Спортсмен',photo:profile.photo||'',customId:profile.customId,
      score:progress.score,medalCount:progress.earnedIds.length,updatedAt:FieldValue.serverTimestamp()});
  else transaction.delete(score);
  return selectedIds;
}
export async function recomputeAchievements(db,uid,{claimRefresh=false}={}) {
  return db.runTransaction(async transaction=>{
    const progressRef=db.doc(`users/${uid}/achievements/progress`),settingsRef=db.doc(`users/${uid}/achievementSettings/display`);
    const [account,profile,settings,previous]=await Promise.all([
      transaction.get(db.doc(`users/${uid}`)),transaction.get(db.doc(`publicProfiles/${uid}`)),transaction.get(settingsRef),transaction.get(progressRef),
    ]);
    if(!account.exists) {
      transaction.delete(progressRef);transaction.delete(db.doc(`achievementScores/${uid}`));transaction.delete(db.doc(`publicProfiles/${uid}/achievements/showcase`));return null;
    }
    if(claimRefresh && Date.now()-(previous.data()?.refreshedAt?.toMillis?.()||0)<60000)return previous.data();
    const [sessions,programs,exercises,friends,comments,days,awards,invites]=await Promise.all([
      transaction.get(db.collection(`users/${uid}/sessions`)),transaction.get(db.collection(`users/${uid}/programs`)),
      transaction.get(db.collection(`users/${uid}/exercises`)),
      transaction.get(db.collection('gymBros').where('members','array-contains',uid)),
      transaction.get(db.collectionGroup('comments').where('authorId','==',uid)),
      transaction.get(db.collection(`users/${uid}/achievementDays`).limit(30)),
      transaction.get(db.collection(`users/${uid}/achievementAwards`)),
      transaction.get(db.collection('trainingInvites').where('members','array-contains',uid)),
    ]);
    const sessionData=data(sessions),inviteData=data(invites),day=today(),partners=new Map();
    const ownIds=new Set(sessionData.filter(session=>session.status==='completed').map(session=>session.id));
    await Promise.all(inviteData.filter(invite=>invite.status==='accepted'&&[invite.from,invite.to].includes(uid)&&ownIds.has(`invite_${invite.id}`)).map(async invite=>{
      const partner=invite.from===uid?invite.to:invite.from;
      if(typeof partner!=='string'||!partner||partner.includes('/'))return;
      const other=await transaction.get(db.doc(`users/${partner}/sessions/invite_${invite.id}`));
      if(other.exists)partners.set(`${partner}/${invite.id}`,other.data());
    }));
    const facts=achievementFacts({uid,today:day,sharedWorkouts:sharedWorkoutCount(uid,sessionData,inviteData,partners,day),sessions:sessionData,programs:data(programs),exercises:data(exercises),friends:data(friends),
      comments:comments.docs.filter(doc=>/^(publicProfiles|exercises|programTemplates)\/[^/]+\/comments\/[^/]+$/.test(doc.ref.path)).map(doc=>doc.data()),
      profile:profile.data()||{},activeDays:days.size});
    const manualIds=awards.docs.filter(doc=>doc.data().awarded===true).map(doc=>doc.id);
    const progress={...evaluateAchievements(facts,manualIds),manualIds,facts,catalogVersion:2,updatedAt:FieldValue.serverTimestamp(),
      refreshedAt:claimRefresh?Timestamp.now():previous.data()?.refreshedAt||Timestamp.fromMillis(0)};
    transaction.set(progressRef,progress);
    const selectedIds=writePublic(transaction,db,uid,progress,settings.data(),profile.data());
    if(settings.exists && JSON.stringify(settings.data().selectedIds)!==JSON.stringify(selectedIds))transaction.update(settingsRef,{selectedIds});
    return progress;
  });
}
export async function publishAchievementDisplay(db,uid) {
  return db.runTransaction(async transaction=>{
    const [progress,settings,profile,account]=await Promise.all([
      transaction.get(db.doc(`users/${uid}/achievements/progress`)),transaction.get(db.doc(`users/${uid}/achievementSettings/display`)),
      transaction.get(db.doc(`publicProfiles/${uid}`)),
      transaction.get(db.doc(`users/${uid}`)),
    ]);
    if(!profile.exists||!account.exists){transaction.delete(db.doc(`achievementScores/${uid}`));transaction.delete(db.doc(`publicProfiles/${uid}/achievements/showcase`));return;}
    writePublic(transaction,db,uid,progress.data()||{earnedIds:[],score:0},settings.data(),profile.data());
  });
}
export async function recordAchievementDay(db,uid) {
  const ref=db.doc(`users/${uid}/achievementDays/${today()}`);
  return db.runTransaction(async transaction=>{
    const previous=await transaction.get(ref);
    if(previous.exists)return false;
    transaction.create(ref,{at:FieldValue.serverTimestamp()});return true;
  });
}
export {sessionAchievementSignature} from './achievement-catalog.js';
