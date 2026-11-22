import {readFileSync,writeFileSync} from 'node:fs';
const slots=Array.from({length:6},(_,i)=>`(n <= ${i} || validMeetingSlot(options[${i}],minimum,maximum))`).join('\n        && ');
const keys=Array.from({length:6},(_,i)=>`(n > ${i} ? options[${i}].date + 'T' + options[${i}].time : '_${i}')`).join(',');
const block=`    // MEETING POLLS BEGIN
    function meetingMember(id) { return verified() && request.auth.uid in get(/databases/$(database)/documents/meetingPolls/$(id)).data.members; }
    function validMeetingSlot(o,minimum,maximum) {
      return o is map && o.keys().hasOnly(['date','time'])
        && o.date is string && o.date.matches('[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])')
        && o.time is string && o.time.matches('([01][0-9]|2[0-3]):[0-5][0-9]')
        && o.date >= minimum && o.date <= maximum;
    }
    function validMeetingPoll() {
      let d=request.resource.data;
      let options=d.options;
      let n=options.size();
      let minimum=challengeDate(request.time);
      let maximum=challengeDate(request.time + duration.value(91,'d'));
      let keys=[${keys}];
      return d.keys().hasOnly(['title','options','creatorId','partnerId','members','status','createdAt'])
        && d.creatorId == request.auth.uid && d.partnerId is string && d.partnerId != request.auth.uid
        && d.members == [request.auth.uid,d.partnerId] && profileFriend(d.partnerId) && notBlocked(request.auth.uid,d.partnerId)
        && d.title is string && d.title.size() > 0 && d.title.size() <= 100 && d.status == 'open' && d.createdAt == request.time
        && options is list && n >= 2 && n <= 6
        && ${slots}
        && keys.toSet().size() == 6;
    }
    function meetingClose(id) {
      let a=/databases/$(database)/documents/meetingPolls/$(id)/votes/$(resource.data.creatorId);
      let b=/databases/$(database)/documents/meetingPolls/$(id)/votes/$(resource.data.partnerId);
      let index=request.resource.data.selectedIndex;
      return exists(a) && exists(b) && index is int && index >= 0 && index < resource.data.options.size()
        && (index in get(a).data.choices || index in get(b).data.choices);
    }
    function meetingLink() {
      let id=request.resource.data.invitationId;
      let invite=getAfter(/databases/$(database)/documents/trainingInvites/$(id)).data;
      let chosen=resource.data.options[resource.data.selectedIndex];
      return id is string && id.size() <= 128 && invite.from == resource.data.creatorId && invite.to == resource.data.partnerId
        && invite.date == chosen.date && invite.time == chosen.time;
    }
    match /meetingPolls/{id} {
      allow get: if verified() && request.auth.uid in resource.data.members;
      allow list: if verified() && request.auth.uid in resource.data.members && request.query.limit != null && request.query.limit <= 50;
      allow create: if verified() && validMeetingPoll();
      allow delete: if false;
      allow update: if verified() && request.auth.uid == resource.data.creatorId && (
        (resource.data.status == 'open' && request.resource.data.status == 'cancelled' && request.resource.data.cancelledAt == request.time
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','cancelledAt']))
        || (resource.data.status == 'open' && request.resource.data.status == 'closed' && request.resource.data.closedAt == request.time
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','selectedIndex','closedAt']) && meetingClose(id))
        || (resource.data.status == 'closed' && resource.data.get('invitationId','') == ''
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['invitationId']) && meetingLink())
      );
      match /votes/{uid} {
        allow get: if meetingMember(id);
        allow list, delete: if false;
        allow create, update: if self(uid) && request.auth.uid in getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.members
          && getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.status == 'open'
          && request.resource.data.keys().hasAll(['choices','updatedAt']) && request.resource.data.keys().hasOnly(['choices','updatedAt'])
          && request.resource.data.choices is list && request.resource.data.choices.toSet().size() == request.resource.data.choices.size()
          && request.resource.data.choices.hasOnly(getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.options.size() == 2 ? [0,1] : getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.options.size() == 3 ? [0,1,2] : getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.options.size() == 4 ? [0,1,2,3] : getAfter(/databases/$(database)/documents/meetingPolls/$(id)).data.options.size() == 5 ? [0,1,2,3,4] : [0,1,2,3,4,5])
          && request.resource.data.updatedAt == request.time;
      }
    }
    // MEETING POLLS END`;
const path=process.argv[2]||'firestore.rules';let source=readFileSync(path,'utf8');
const start=source.indexOf('    // MEETING POLLS BEGIN'),end=source.indexOf('    // MEETING POLLS END',start);
if(start>=0&&end>=0)source=source.slice(0,start)+block+source.slice(end+'    // MEETING POLLS END'.length);
else {const close=source.lastIndexOf('  }');if(close<0)throw Error('Firestore root not found.');source=source.slice(0,close)+block+'\n'+source.slice(close);}
writeFileSync(path,source);console.log('Updated meeting poll rules.');
