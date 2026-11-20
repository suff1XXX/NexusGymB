import {avatarSource} from './people.js';
export const avatarPalette=['#2563eb','#d5363e','#dfb52a','#e77928','#d7466c','#d96ca5','#2c9258','#7c4acb','#36a9d6','#8a5b43','#F0DC82','#157f85','#4767b2','#a55b98','#83934b','#e27261'];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function avatarColor(person={}) {
  const key=person.uid||person.id?`uid:${person.uid||person.id}`:Number.isInteger(person.customId)?`number:${person.customId}`:String(person.email||person.name||'GymB');
  let hash=2166136261;
  for(const char of key){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)>>>0;}
  return hash%101===0?'#151517':avatarPalette[(hash>>>8)%avatarPalette.length];
}
export function renderAvatar(person={}) {
  const photo=avatarSource(person.photo);
  if(photo)return `<img class="avatar" src="${esc(photo)}" alt="Аватар" loading="lazy"/>`;
  const letter=String(person.name||'G').match(/\p{L}/u)?.[0]?.toLocaleUpperCase('uk')||'G';
  return `<span class="avatar avatar-fallback" style="background-color:${avatarColor(person)};color:#ffffff">${esc(letter)}</span>`;
}
