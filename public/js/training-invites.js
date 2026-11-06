import { localDate, plannedSession } from './model.js';
import { shareableProgram } from './sharing.js';
export function invitePlan(program, dayId, date, time = '', note = '', now = new Date()) {
  const day = program?.days.find((d) => d.weekday === Number(dayId));
  if (!day || program.scope === 'home') throw Error('Обери день основної програми.');
  const snapshot = shareableProgram({ name: program.name, type: program.type, days: [day] });
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error('Перевір час тренування.');
  if (typeof note !== 'string' || note.length > 300) throw Error('Примітка має містити до 300 символів.');
  plannedSession(snapshot, date, now);
  return { program: snapshot, date, time, note: note.trim() };
}
export function inviteSession(invite, id, uid, now = new Date()) {
  if (![invite.from, invite.to].includes(uid)) throw Error('Немає доступу до запрошення.');
  if (invite.date < localDate(now)) throw Error('Дата запрошення вже минула.');
  return { ...plannedSession(shareableProgram(invite.program), invite.date, now), id: `invite_${id}`,
    invitationId: id, gymBroId: invite.from === uid ? invite.to : invite.from, scheduledTime: invite.time || '',
    invitationNote: invite.note || '' };
}
