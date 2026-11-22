import {readFileSync,writeFileSync} from 'node:fs';
const block=`    // EXERCISE NOTES BEGIN
    match /users/{uid}/exerciseNotes/{id} {
      allow read, delete: if self(uid);
      allow create, update: if self(uid)
        && request.resource.data.keys().hasAll(['exerciseKey','note','updatedAt'])
        && request.resource.data.keys().hasOnly(['exerciseKey','note','updatedAt'])
        && request.resource.data.exerciseKey is string && request.resource.data.exerciseKey.size() > 0 && request.resource.data.exerciseKey.size() <= 200
        && request.resource.data.note is string && request.resource.data.note.size() > 0 && request.resource.data.note.size() <= 2000
        && request.resource.data.updatedAt is number && request.resource.data.updatedAt >= 0;
    }
    // EXERCISE NOTES END`;
const path=process.argv[2]||'firestore.rules';let source=readFileSync(path,'utf8');
const start=source.indexOf('    // EXERCISE NOTES BEGIN'),end=source.indexOf('    // EXERCISE NOTES END',start);
if(start>=0&&end>=0)source=source.slice(0,start)+block+source.slice(end+'    // EXERCISE NOTES END'.length);
else {const close=source.lastIndexOf('  }');if(close<0)throw Error('Firestore root not found.');source=source.slice(0,close)+block+'\n'+source.slice(close);}
writeFileSync(path,source);console.log('Updated private exercise note rules.');
