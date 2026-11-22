import {readFileSync,writeFileSync} from 'node:fs';
const path=process.argv[2]||'firestore.rules';let source=readFileSync(path,'utf8');
const pattern=/      match \/notifications\/\{id\} \{[\s\S]*?\n      \}/;
if(!pattern.test(source))throw Error('Notification rules not found.');
source=source.replace(pattern,`      match /notifications/{id} {
        allow read, delete: if self(uid);
        allow create: if validNotice(uid, id);
        allow update: if self(uid) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read'])
          && request.resource.data.read is bool;
      }`);
const original="&& id == data.type + '_' + data.targetId";
const expanded="&& (id == data.type + '_' + data.targetId || id.matches('event_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'))";
if(source.includes(original))source=source.replace(original,expanded);
else if(!source.includes(expanded))throw Error('Notification identity validation not found.');
writeFileSync(path,source);console.log('Updated persistent notification history rules.');
