import {exerciseKey} from './training-data.js';
export function exerciseNoteId(item) {
  const key=exerciseKey(item);
  if(!key||key==='name:'||key.length>200)throw Error('Не вдалося визначити вправу.');
  return encodeURIComponent(key);
}
export function exerciseNoteData(item,text,now=Date.now()) {
  const note=String(text??'').trim();
  if(note.length>2000)throw Error('Нотатка може містити до 2000 символів.');
  exerciseNoteId(item);
  return {exerciseKey:exerciseKey(item),note,updatedAt:now};
}
