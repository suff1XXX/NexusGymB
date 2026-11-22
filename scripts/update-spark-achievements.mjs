import {readFileSync,writeFileSync} from 'node:fs';
import {achievementCatalog} from '../public/js/achievement-catalog.js';
import {achievementMetricLimits} from '../public/js/achievement-spark.js';

const q=value=>`'${value}'`,ids=achievementCatalog.map(m=>q(m.id)).join(',');
const metrics=Object.entries(achievementMetricLimits);
const score=achievementCatalog.map(m=>`(${q(m.id)} in ids ? ${m.points} : 0)`).join(' + ');
const expected=achievementCatalog.map(m=>`.concat((${q(m.id)} in manual${m.manualOnly?'':` || f.${m.metric} >= ${m.target}`}) ? [${q(m.id)}] : [])`).join('');
const block=`    // GymB ACHIEVEMENT BEGIN
    // Spark: automatic facts are computed from self-reported training data in the browser.
    // Rules enforce fixed scores, administrator-only grants and private source records.
    function achievementScore(ids) { return ${score}; }
    function validAchievementIds(ids) {
      return ids is list && ids.size() <= ${achievementCatalog.length} && ids.toSet().size() == ids.size() && ids.hasOnly([${ids}]);
    }
    function achievementManual(uid) {
      let p=/databases/$(database)/documents/users/$(uid)/achievementGrants/current;
      return existsAfter(p) ? getAfter(p).data.ids : [];
    }
    function achievementDays(uid) {
      let p=/databases/$(database)/documents/users/$(uid)/achievementActivity/current;
      return existsAfter(p) ? getAfter(p).data.count : 0;
    }
    function achievementEarned(f,manual) { return []${expected}; }
    function validAchievementProgress(uid) {
      let d=request.resource.data;
      let manual=achievementManual(uid);
      let f=d.facts;
      let earned=achievementEarned(f,manual);
      return d.keys().hasOnly(['earnedIds','manualIds','facts','score','catalogVersion','updatedAt'])
        && d.catalogVersion == 3 && d.updatedAt == request.time
        && f is map && f.keys().hasAll([${metrics.map(([key])=>q(key)).join(',')}])
        && f.keys().hasOnly([${metrics.map(([key])=>q(key)).join(',')}])
        && ${metrics.map(([key,max])=>`f.${key} is int && f.${key} >= 0 && f.${key} <= ${max}`).join('\n        && ')}
        && f.activeDays == achievementDays(uid)
        && d.earnedIds == earned && d.manualIds == manual && d.score == achievementScore(earned);
    }
    function achievementSettings(uid) {
      let p=/databases/$(database)/documents/users/$(uid)/achievementSettings/display;
      return existsAfter(p) ? getAfter(p).data : {'selectedIds':[],'rankingEnabled':false};
    }
    function validAchievementDisplay(uid) {
      let d=request.resource.data;
      return d.keys().hasAll(['selectedIds','rankingEnabled']) && d.keys().hasOnly(['selectedIds','rankingEnabled'])
        && d.rankingEnabled is bool && validAchievementIds(d.selectedIds) && d.selectedIds.size() <= 3
        && (d.selectedIds.size() == 0 || d.selectedIds.hasOnly(getAfter(/databases/$(database)/documents/users/$(uid)/achievements/progress).data.earnedIds));
    }
    match /users/{uid}/achievementGrants/{id} {
      allow get: if (self(uid) || owner()) && id == 'current';
      allow list, delete: if false;
      allow create, update: if owner() && id == 'current' && exists(/databases/$(database)/documents/users/$(uid))
        && request.resource.data.keys().hasAll(['ids','updatedAt','updatedBy']) && request.resource.data.keys().hasOnly(['ids','updatedAt','updatedBy'])
        && validAchievementIds(request.resource.data.ids) && request.resource.data.updatedAt == request.time && request.resource.data.updatedBy == request.auth.uid;
    }
    match /users/{uid}/achievementAwards/{id} { allow read, write: if false; }
    match /users/{uid}/achievementAwardAudit/{id} {
      allow read: if owner();
      allow create: if owner() && request.resource.data.keys().hasAll(['medalId','action','note','actorId','createdAt'])
        && request.resource.data.keys().hasOnly(['medalId','action','note','actorId','createdAt'])
        && request.resource.data.medalId in [${ids}] && request.resource.data.action in ['grant','revoke']
        && request.resource.data.note is string && request.resource.data.note.size() <= 200
        && request.resource.data.actorId == request.auth.uid && request.resource.data.createdAt == request.time;
      allow update, delete: if false;
    }
    match /users/{uid}/achievements/{id} {
      allow get: if (self(uid) || owner()) && id == 'progress';
      allow list, delete: if false;
      allow create, update: if (self(uid) || owner()) && id == 'progress' && exists(/databases/$(database)/documents/users/$(uid)) && validAchievementProgress(uid);
    }
    match /users/{uid}/achievementActivity/{id} {
      allow get: if (self(uid) || owner()) && id == 'current';
      allow list, delete: if false;
      allow create: if self(uid) && id == 'current'
        && request.resource.data.keys().hasAll(['count','lastDay','updatedAt']) && request.resource.data.keys().hasOnly(['count','lastDay','updatedAt'])
        && request.resource.data.count == 1 && request.resource.data.lastDay == int(request.time.toMillis() / 86400000) && request.resource.data.updatedAt == request.time;
      allow update: if self(uid) && id == 'current' && request.resource.data.keys().hasAll(['count','lastDay','updatedAt']) && request.resource.data.keys().hasOnly(['count','lastDay','updatedAt'])
        && request.resource.data.lastDay == int(request.time.toMillis() / 86400000) && request.resource.data.lastDay > resource.data.lastDay
        && request.resource.data.count == (resource.data.count < 30 ? resource.data.count + 1 : 30) && request.resource.data.updatedAt == request.time;
    }
    match /users/{uid}/achievementDays/{day} { allow read, write: if false; }
    match /users/{uid}/achievementSettings/{id} {
      allow get: if (self(uid) || owner()) && id == 'display';
      allow list, delete: if false;
      allow create: if self(uid) && id == 'display' && validAchievementDisplay(uid);
      allow update: if id == 'display' && validAchievementDisplay(uid) && (self(uid) || (owner()
        && request.resource.data.rankingEnabled == resource.data.rankingEnabled
        && request.resource.data.selectedIds.hasOnly(resource.data.selectedIds)));
    }
    match /publicProfiles/{uid}/achievements/{id} {
      allow get: if id == 'showcase' && canViewProfile(uid);
      allow list, delete: if false;
      allow create, update: if (self(uid) || owner()) && id == 'showcase'
        && request.resource.data.keys().hasAll(['selectedIds','updatedAt']) && request.resource.data.keys().hasOnly(['selectedIds','updatedAt'])
        && request.resource.data.updatedAt == request.time && request.resource.data.selectedIds == achievementSettings(uid).selectedIds;
    }
    match /achievementScores/{uid} {
      allow get: if verified();
      allow list: if verified() && request.query.limit != null && request.query.limit <= 50;
      allow create, update: if (self(uid) || owner()) && achievementSettings(uid).rankingEnabled == true
        && request.resource.data.keys().hasAll(['uid','name','photo','customId','score','medalCount','updatedAt'])
        && request.resource.data.keys().hasOnly(['uid','name','photo','customId','score','medalCount','updatedAt'])
        && request.resource.data.uid == uid && request.resource.data.updatedAt == request.time
        && request.resource.data.name == getAfter(/databases/$(database)/documents/publicProfiles/$(uid)).data.name
        && request.resource.data.photo == getAfter(/databases/$(database)/documents/publicProfiles/$(uid)).data.photo
        && request.resource.data.customId == getAfter(/databases/$(database)/documents/publicProfiles/$(uid)).data.customId
        && request.resource.data.score == getAfter(/databases/$(database)/documents/users/$(uid)/achievements/progress).data.score
        && request.resource.data.medalCount == getAfter(/databases/$(database)/documents/users/$(uid)/achievements/progress).data.earnedIds.size();
      allow delete: if (self(uid) || owner()) && achievementSettings(uid).rankingEnabled == false;
    }
    // Authors can count their own comments without reading other authors' private content.
    match /{path=**}/comments/{comment} { allow read: if verified() && resource.data.authorId == request.auth.uid; }
    function completionMember(invite) { return verified() && request.auth.uid in invite.members; }
    function validSharedCompletion(invite,uid,id) {
      let p=/databases/$(database)/documents/users/$(uid)/sessions/$('invite_' + id);
      let s=get(p).data;
      return exists(p) && s.status == 'completed' && s.invitationId == id && s.date == invite.date
        && s.gymBroId == (invite.from == uid ? invite.to : invite.from)
        && (s.logs.size() > 0 || s.get('simpleCompleted',[]).size() > 0 || (s.items.size() == 0 && s.get('description','').size() > 0 && s.get('endedEarly',false) == false));
    }
    match /trainingInvites/{id}/completions/{uid} {
      allow get: if completionMember(get(/databases/$(database)/documents/trainingInvites/$(id)).data)
        && (!exists(/databases/$(database)/documents/trainingInvites/$(id)/completions/$(uid))
          || validSharedCompletion(get(/databases/$(database)/documents/trainingInvites/$(id)).data,uid,id));
      allow list, update, delete: if false;
      allow create: if self(uid) && completionMember(get(/databases/$(database)/documents/trainingInvites/$(id)).data)
        && get(/databases/$(database)/documents/trainingInvites/$(id)).data.status == 'accepted'
        && request.resource.data.keys().hasAll(['completed','updatedAt']) && request.resource.data.keys().hasOnly(['completed','updatedAt'])
        && request.resource.data.completed == true && request.resource.data.updatedAt == request.time
        && validSharedCompletion(get(/databases/$(database)/documents/trainingInvites/$(id)).data,uid,id);
    }
    // GymB ACHIEVEMENT END`;
const path=process.argv[2]||'firestore.rules';
const source=readFileSync(path,'utf8'),start=source.indexOf('    // GymB ACHIEVEMENT BEGIN'),end=source.indexOf('    // GymB ACHIEVEMENT END',start);
if(start<0||end<0)throw Error('Achievement rules block is missing.');
writeFileSync(path,source.slice(0,start)+block+source.slice(end+'    // GymB ACHIEVEMENT END'.length));
console.log('Updated Spark achievement rules.');
