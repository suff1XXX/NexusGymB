const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).filter(key=>key!=='updatedAt').sort().map(key=>[key,canonical(value[key])])):value;
export const undoSignature=value=>JSON.stringify(canonical(value));
export function createActionUndo(storage) {
  const memory=new Map(),key=uid=>`nexus:last-action:${uid}`;
  return {
    read(uid){try{return JSON.parse(storage.getItem(key(uid))||'null')||memory.get(uid)||null;}catch{return memory.get(uid)||null;}},
    remember(uid,{before,after=null,label,type='session',profiles=[],id=before?.id||after?.id}){
      const entry=structuredClone({before,id,afterSignature:undoSignature(after),label,type,profiles,at:Date.now()});
      memory.set(uid,entry);try{storage.setItem(key(uid),JSON.stringify(entry));}catch{}return entry;
    },
    clear(uid){memory.delete(uid);try{storage.removeItem(key(uid));}catch{}},
    matches(entry,current){return !!entry&&Date.now()-entry.at<86400000&&entry.afterSignature===undoSignature(current||null);},
  };
}
