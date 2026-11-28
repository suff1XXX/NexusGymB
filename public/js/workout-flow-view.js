import { nextExerciseChoices, pendingExercises, skipReasons } from './workout-queue.js';
import { ui, uiText } from './i18n.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function nextExerciseLabel(session) {
  const next=nextExerciseChoices(session)[0];
  return uiText(session.executionMode==='mixed'?'Закінчити вправу':next===undefined?'Завершити тренування':session.deferred?.includes(next)?'Повернутись до відкладеної':session.setTrackingMode==='free'?'Закінчити вправу':'Наступна вправа');
}
export function deferPicker(session,index) {
  const choices=nextExerciseChoices(session,index,{deferring:true});
  return ui`<div class="sectionhead"><h2 id="defer-title">Що виконати далі?</h2><button type="button" class="btn ghost" data-action="close">Закрити</button></div><p class="muted">Відкласти: <strong>${esc(session.items[index].name)}</strong>${session.items[index].superset?' · разом із парною вправою суперсету':''}. Записані підходи збережуться.</p><div class="next-exercise-choices">${choices.map((next,n)=>`<button type="button" class="next-exercise-choice ${n===0?'is-recommended':''}" data-action="confirm-defer" data-index="${index}" data-next="${next}"><span><strong>${esc(session.items[next].name)}</strong><small>${n===0?uiText('Рекомендовано за порядком плану'):uiText('Інший варіант')}${session.deferred?.includes(next)?' · '+uiText('Відкладена'):''}</small></span><span>${uiText('Обрати')}</span></button>`).join('')||'<p class="muted">Інших невиконаних вправ немає. Можеш продовжити цю вправу або пропустити її з причиною.</p>'}</div>`;
}
export function deferredPanel(session) {
  const pending=new Set(pendingExercises(session)),deferred=(session.deferred||[]).filter(index=>pending.has(index));
  if(!deferred.length)return '';
  return ui`<aside class="card deferred-exercises"><div class="sectionhead"><h2>Відкладені вправи</h2><span class="badge">${deferred.length}</span></div>${deferred.map(index=>`<div class="deferred-exercise-row"><strong>${esc(session.items[index].name)}</strong><button type="button" class="btn secondary" data-action="resume-exercise" data-index="${index}">${uiText('Повернутись')}</button></div>`).join('')}</aside>`;
}
export function skipPicker(session,index) {
  return ui`<div class="sectionhead"><h2 id="skip-title">Пропустити вправу</h2><button type="button" class="btn ghost" data-action="close">Закрити</button></div><p>${esc(session.items[index].name)}</p><form id="skip-exercise-form" data-index="${index}"><label>Причина<select name="reason" required><option value="">Обери причину</option>${Object.entries(skipReasons).filter(([key])=>!['unfinished','postponed'].includes(key)).map(([key,label])=>`<option value="${key}">${uiText(label)}</option>`).join('')}</select></label><label>Примітка — необов’язково<textarea name="note" maxlength="200" rows="3"></textarea></label><p class="small muted">Причина та примітка залишаються в особистій історії.</p><button type="submit" class="btn secondary">Пропустити вправу</button><div class="form-error" role="alert"></div></form>`;
}
export function skipDetail(session,index) {
  if(!session.skipped?.includes(index))return '';
  const detail=session.skipDetails?.[index];
  return `<aside class="workout-skip-detail"><strong>${uiText('Причина пропуску')}: ${uiText(skipReasons[detail?.reason]||skipReasons.unspecified)}</strong>${detail?.note?`<p>${esc(detail.note)}</p>`:''}</aside>`;
}
export function gymBroTurnsPanel(session,uid,state,{loading=false,error='',online=true}={}) {
  if(!session.invitationId||!session.gymBroId)return '';
  const joined=state?.joined?.includes(uid),ready=state?.joined?.length===2,own=state?.turnUid===uid;
  const status=!online?'Чергування недоступне без інтернету':loading?'Завантажуємо чергу…':!joined?'Приєднайся до чергування':!ready?'Очікуємо GymBro':own?'Твій підхід':'Зараз підхід GymBro';
  return ui`<section class="card gymbro-turns ${joined&&ready&&own?'is-your-turn':''}"><div class="sectionhead"><div><span class="private-label">Чергування з GymBro</span><h2 data-turn-status role="status">${uiText(status)}</h2></div><span class="turns-symbol" aria-hidden="true">⇄</span></div>${error?`<p class="error" role="alert">${esc(error)}</p>`:''}<div class="actions">${joined?`${ready&&own?`<button type="button" class="btn secondary" data-action="gymbro-pass" ${!online||loading?'disabled':''}>${uiText('Передати чергу')}</button>`:''}<button type="button" class="btn ghost" data-action="gymbro-leave" ${!online||loading?'disabled':''}>${uiText('Вийти з чергування')}</button>`:`<button type="button" class="btn secondary" data-action="gymbro-join" ${!online||loading?'disabled':''}>${uiText('Чергуватися разом')}</button>`}${error?'<button type="button" class="btn ghost" data-action="gymbro-retry">Оновити</button>':''}</div><p class="small muted">Після запису робочого підходу черга переходить партнеру. Розминка та дропи її не змінюють.</p></section>`;
}
