import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {achievementCatalog} from './achievement-catalog.js';
import {recomputeAchievements} from './achievement-service.js';
const OWNER_UID='ljYr2MF28zg1zAFsD7M1sNH6s8O2';
export async function manageAchievementAward(db,request) {
  if(request.auth?.uid!==OWNER_UID||request.auth?.token.email_verified!==true)throw new HttpsError('permission-denied','Немає доступу до видачі досягнень.');
  const {uid,action,medalId,note=''}=request.data||{};
  if(typeof uid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||!['list','grant','revoke'].includes(action))throw new HttpsError('invalid-argument','Перевір користувача та дію.');
  if(!(await db.doc(`users/${uid}`).get()).exists)throw new HttpsError('not-found','Користувача не знайдено.');
  if(action!=='list') {
    if(!achievementCatalog.some(medal=>medal.id===medalId)||typeof note!=='string'||note.length>200)throw new HttpsError('invalid-argument','Перевір досягнення та примітку.');
    const award=db.doc(`users/${uid}/achievementAwards/${medalId}`),audit=db.collection(`users/${uid}/achievementAwardAudit`).doc();
    await db.runTransaction(async transaction=>{
      const previous=await transaction.get(award);
      if(previous.exists&&previous.data().awarded===(action==='grant'))return;
      const value={medalId,awarded:action==='grant',awardedBy:request.auth.uid,note:note.trim(),updatedAt:FieldValue.serverTimestamp()};
      transaction.set(award,value);transaction.create(audit,value);
    });
    await recomputeAchievements(db,uid);
  }
  const [progress,awards]=await Promise.all([db.doc(`users/${uid}/achievements/progress`).get(),db.collection(`users/${uid}/achievementAwards`).get()]);
  return {earnedIds:progress.data()?.earnedIds||[],score:progress.data()?.score||0,manualIds:awards.docs.filter(doc=>doc.data().awarded).map(doc=>doc.id)};
}
