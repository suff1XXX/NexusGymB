import {readFileSync,writeFileSync} from 'node:fs';
import {defaultBlockOrder} from '../public/js/training-experience.js';
import {achievementCatalog} from '../public/js/achievement-catalog.js';
const blocks=defaultBlockOrder.map(key=>`'${key}'`).join(','),medals=achievementCatalog.map(m=>`'${m.id}'`).join(',');
const block=`    // TRAINING EXPERIENCE BEGIN
    match /users/{uid}/weeklyGoals/{week} {
      allow read: if self(uid);
      allow delete: if self(uid);
      allow create, update: if self(uid) && request.resource.data.keys().hasAll(['week','target','updatedAt'])
        && request.resource.data.keys().hasOnly(['week','target','updatedAt']) && request.resource.data.week == week
        && week.matches('[0-9]{4}-[0-9]{2}-[0-9]{2}') && request.resource.data.target is int
        && request.resource.data.target >= 1 && request.resource.data.target <= 14 && request.resource.data.updatedAt == request.time;
    }
    match /users/{uid}/workoutReflections/{id} {
      allow read, delete: if self(uid);
      allow create, update: if self(uid)
        && exists(/databases/$(database)/documents/users/$(uid)/sessions/$(id))
        && get(/databases/$(database)/documents/users/$(uid)/sessions/$(id)).data.status == 'completed'
        && request.resource.data.keys().hasAll(['difficulty','energy','note','updatedAt'])
        && request.resource.data.keys().hasOnly(['difficulty','energy','note','updatedAt'])
        && request.resource.data.difficulty is int && request.resource.data.difficulty >= 1 && request.resource.data.difficulty <= 10
        && request.resource.data.energy is int && request.resource.data.energy >= 1 && request.resource.data.energy <= 5
        && request.resource.data.note is string && request.resource.data.note.size() <= 1000 && request.resource.data.updatedAt == request.time;
    }
    match /publicProfiles/{uid}/layout/{id} {
      allow get: if id == 'display' && canViewProfile(uid);
      allow list: if false;
      allow delete: if self(uid) && id == 'display';
      allow create, update: if self(uid) && id == 'display'
        && request.resource.data.keys().hasAll(['order','visible','updatedAt']) && request.resource.data.keys().hasOnly(['order','visible','updatedAt'])
        && request.resource.data.order is list && request.resource.data.order.size() == ${defaultBlockOrder.length}
        && request.resource.data.order.toSet().size() == ${defaultBlockOrder.length} && request.resource.data.order.hasOnly([${blocks}])
        && request.resource.data.visible is list && request.resource.data.visible.toSet().size() == request.resource.data.visible.size()
        && request.resource.data.visible.hasOnly([${blocks}]) && request.resource.data.updatedAt == request.time;
    }
    match /users/{uid}/achievementEvents/{medal} {
      allow get: if self(uid) || owner();
      allow list: if self(uid);
      allow create: if (self(uid) || owner()) && medal in [${medals}]
        && request.resource.data.keys().hasAll(['medalId','source','reason','earnedAt','read'])
        && request.resource.data.keys().hasOnly(['medalId','source','reason','earnedAt','read'])
        && request.resource.data.medalId == medal && request.resource.data.read == false && request.resource.data.earnedAt == request.time
        && request.resource.data.reason is string && request.resource.data.reason.size() > 0 && request.resource.data.reason.size() <= 300
        && medal in getAfter(/databases/$(database)/documents/users/$(uid)/achievements/progress).data.earnedIds
        && (request.resource.data.source == 'automatic' || (request.resource.data.source == 'admin' && medal in achievementManual(uid)));
      allow update: if self(uid) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']) && request.resource.data.read == true;
      allow delete: if false;
    }
    function challengeDate(t) {
      return string(t.year()) + '-' + (t.month() < 10 ? '0' : '') + string(t.month()) + '-' + (t.day() < 10 ? '0' : '') + string(t.day());
    }
    function challengeMember(id) { return verified() && request.auth.uid in get(/databases/$(database)/documents/gymChallenges/$(id)).data.members; }
    match /gymChallenges/{id} {
      allow get: if verified() && request.auth.uid in resource.data.members;
      allow list: if verified() && request.auth.uid in resource.data.members && request.query.limit != null && request.query.limit <= 50;
      allow create: if verified()
        && request.resource.data.keys().hasAll(['title','target','startDate','endDate','startsAt','endsAt','creatorId','partnerId','members','status','createdAt'])
        && request.resource.data.keys().hasOnly(['title','target','startDate','endDate','startsAt','endsAt','creatorId','partnerId','members','status','createdAt'])
        && request.resource.data.creatorId == request.auth.uid && request.resource.data.partnerId is string && request.resource.data.partnerId != request.auth.uid
        && request.resource.data.members == [request.auth.uid,request.resource.data.partnerId]
        && profileFriend(request.resource.data.partnerId) && notBlocked(request.auth.uid,request.resource.data.partnerId)
        && request.resource.data.title is string && request.resource.data.title.size() > 0 && request.resource.data.title.size() <= 80
        && request.resource.data.target is int && request.resource.data.target >= 1 && request.resource.data.target <= 30
        && request.resource.data.startsAt is timestamp && request.resource.data.endsAt is timestamp
        && request.resource.data.startDate == challengeDate(request.resource.data.startsAt) && request.resource.data.endDate == challengeDate(request.resource.data.endsAt)
        && request.resource.data.startsAt >= request.time - duration.value(1,'d')
        && request.resource.data.endsAt > request.resource.data.startsAt && request.resource.data.endsAt - request.resource.data.startsAt <= duration.value(91,'d')
        && request.resource.data.endsAt <= request.time + duration.value(182,'d')
        && request.resource.data.status == 'pending' && request.resource.data.createdAt == request.time;
      allow update: if verified() && resource.data.status == 'pending' && request.resource.data.respondedAt == request.time
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','respondedAt'])
        && ((request.auth.uid == resource.data.partnerId && request.resource.data.status in ['accepted','declined'])
          || (request.auth.uid == resource.data.creatorId && request.resource.data.status == 'cancelled'));
      allow delete: if false;
      match /progress/{uid} {
        allow get: if challengeMember(id);
        allow list, delete: if false;
        allow create, update: if self(uid) && challengeMember(id)
          && get(/databases/$(database)/documents/gymChallenges/$(id)).data.status == 'accepted'
          && request.resource.data.keys().hasAll(['count','updatedAt']) && request.resource.data.keys().hasOnly(['count','updatedAt'])
          && request.resource.data.count is int && request.resource.data.count >= 0
          && request.resource.data.count <= get(/databases/$(database)/documents/gymChallenges/$(id)).data.target
          && (request.resource.data.count == 0 || request.time >= get(/databases/$(database)/documents/gymChallenges/$(id)).data.startsAt)
          && request.resource.data.updatedAt == request.time;
      }
    }
    // TRAINING EXPERIENCE END`;
const path=process.argv[2]||'firestore.rules';let source=readFileSync(path,'utf8');
const start=source.indexOf('    // TRAINING EXPERIENCE BEGIN'),end=source.indexOf('    // TRAINING EXPERIENCE END',start);
if(start>=0&&end>=0)source=source.slice(0,start)+block+source.slice(end+'    // TRAINING EXPERIENCE END'.length);
else {const close=source.lastIndexOf('  }');if(close<0)throw Error('Firestore root not found.');source=source.slice(0,close)+block+'\n'+source.slice(close);}
writeFileSync(path,source);console.log('Updated training experience rules.');
