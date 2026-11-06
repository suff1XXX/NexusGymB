import { readFileSync } from 'node:fs';
import { initializeTestEnvironment,assertFails,assertSucceeds } from '@firebase/rules-unit-testing';
import { doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,collection,serverTimestamp,writeBatch,setLogLevel,query,where,orderBy,limit,getCountFromServer } from 'firebase/firestore';
setLogLevel('silent');
const env=await initializeTestEnvironment({projectId:'demo-nexus-gymb',firestore:{rules:readFileSync('firestore.rules','utf8')}});
const auth=(uid,verified=true)=>env.authenticatedContext(uid,{email_verified:verified,email:`${uid}@example.test`}).firestore();
const alice=auth('alice'),bob=auth('bob'),admin=auth('ljYr2MF28zg1zAFsD7M1sNH6s8O2');
let count=0;const ok=async(p)=>{await assertSucceeds(p);count++;},no=async(p)=>{await assertFails(p);count++;};
try {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async(c)=>{
    const db=c.firestore();
    for(const [index,uid] of ['alice','bob'].entries()){
      await setDoc(doc(db,`users/${uid}`),{name:uid,email:`${uid}@example.test`,customId:index+1,createdAt:1,photo:''});
      await setDoc(doc(db,`publicProfiles/${uid}`),{name:uid,customId:index+1,joinedAt:1,photo:''});
    }
  });
  const path='users/alice/measurements/2026-11-06',record={date:'2026-11-06',weight:70,waist:80,note:'Приватно',updatedAt:1};
  // Exercise the same reads as the profile page, including absent tags and likes.
  await ok(getDoc(doc(alice,'publicProfiles/alice')));
  await ok(getDoc(doc(alice,'userLabels/alice')));
  await ok(getDocs(query(collection(alice,'gymBros'),where('members','array-contains','alice'))));
  await ok(setDoc(doc(alice,'publicProfiles/alice/comments/self'),{authorId:'alice',authorName:'alice',text:'Hello',createdAt:serverTimestamp()}));
  await ok(getDocs(query(collection(alice,'publicProfiles/alice/comments'),orderBy('createdAt','desc'),limit(50))));
  await ok(getCountFromServer(collection(alice,'publicProfiles/alice/comments/self/likes')));
  await ok(getDoc(doc(alice,'publicProfiles/alice/comments/self/likes/alice')));
  await ok(setDoc(doc(alice,path),record));await ok(getDoc(doc(alice,path)));await ok(getDocs(collection(alice,'users/alice/measurements')));
  for(const other of [bob,admin,auth('alice',false),env.unauthenticatedContext().firestore()]){
    await no(getDoc(doc(other,path)));await no(getDocs(collection(other,'users/alice/measurements')));
    await no(updateDoc(doc(other,path),{weight:99}));await no(deleteDoc(doc(other,path)));
  }
  await no(setDoc(doc(alice,path),{...record,weight:-1}));await no(setDoc(doc(alice,path),{...record,weight:NaN}));
  await no(setDoc(doc(alice,path),{...record,date:'2026-11-05'}));await no(setDoc(doc(alice,path),{...record,waist:301}));
  await no(setDoc(doc(alice,path),{date:'2026-11-06',note:''}));await no(setDoc(doc(alice,path),{...record,public:true}));
  await ok(updateDoc(doc(alice,path),{weight:71}));await ok(deleteDoc(doc(alice,path)));
  await no(updateDoc(doc(alice,'publicProfiles/alice'),{measurements:[record]}));
  await ok(updateDoc(doc(alice,'publicProfiles/alice'),{photo:'data:image/png;base64,YQ==',banner:'data:image/webp;base64,YQ==',visibility:{gymBros:false}}));
  await no(getDoc(doc(bob,'users/alice')));await ok(getDoc(doc(admin,'users/alice')));
  await no(setDoc(doc(alice,'userLabels/alice'),{tags:[{text:'Fake',color:'#ffffff',textColor:'#000000'}]}));
  await ok(setDoc(doc(admin,'userLabels/alice'),{tags:[{text:'Власник',color:'#ffffff',textColor:'#000000'}]}));
  const request={from:'alice',to:'bob',members:['alice','bob'],status:'pending',createdAt:serverTimestamp()};
  await ok(setDoc(doc(alice,'gymBros/alice_bob'),request));await ok(updateDoc(doc(bob,'gymBros/alice_bob'),{status:'accepted'}));
  await ok(setDoc(doc(alice,'publicProfiles/alice/friends/bob'),{uid:'bob'}));await no(getDocs(collection(bob,'publicProfiles/alice/friends')));
  const invite={...request,program:{name:'План',days:[{name:'День',items:[]}]},date:'2099-11-07',time:'18:30',note:''};
  const batch=writeBatch(alice);batch.set(doc(alice,'trainingInvites/first'),invite);
  batch.set(doc(alice,'users/bob/notifications/training_invite_first'),{type:'training_invite',actorId:'alice',profileId:'alice',targetId:'first',read:false,createdAt:serverTimestamp()});
  await ok(batch.commit());await no(getDoc(doc(admin,'trainingInvites/first')));
  await no(updateDoc(doc(bob,'trainingInvites/first'),{status:'accepted',sessionId:'invite_first',respondedAt:serverTimestamp()}));
  const accept=writeBatch(bob);accept.set(doc(bob,'users/bob/sessions/invite_first'),{status:'planned',invitationId:'first'});
  accept.update(doc(bob,'trainingInvites/first'),{status:'accepted',sessionId:'invite_first',respondedAt:serverTimestamp()});await ok(accept.commit());
  await ok(setDoc(doc(bob,'users/bob/blocked/alice'),{createdAt:serverTimestamp()}));
  await no(setDoc(doc(alice,'publicProfiles/bob/comments/blocked'),{authorId:'alice',authorName:'alice',text:'Hi',parentId:'',createdAt:serverTimestamp()}));
  await no(setDoc(doc(alice,'trainingInvites/blocked'),invite));
  await ok(setDoc(doc(alice,'reports/alice_bob_profile'),{reporterId:'alice',targetId:'bob',profileId:'bob',commentId:'',commentText:'',reason:'spam',detail:'test',status:'open',createdAt:serverTimestamp()}));
  await no(getDocs(collection(bob,'reports')));await ok(getDocs(collection(admin,'reports')));
  console.log(`PASS: ${count} Firestore access checks (including administrator isolation for measurements)`);
}finally{await env.cleanup();}
