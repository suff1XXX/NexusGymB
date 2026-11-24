import {ui,uiText,uiLocale} from './i18n.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const num=value=>Number(value||0).toLocaleString(uiLocale(),{maximumFractionDigits:1});
export function monthLabel(month) {
  return new Intl.DateTimeFormat(uiLocale(),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-15T12:00:00Z`));
}
export function monthlySummaryCard(summary,{published=false,own=false,controls=''}={}) {
  if(!summary||summary.version!==1||!/^\d{4}-(0[1-9]|1[0-2])$/.test(summary.month||''))return '';
  const metrics=[[summary.workouts,'Тренувань'],[summary.sets,'Робочих підходів'],[summary.activeDays,'Активних днів'],[summary.recordCount,'Особистих рекордів']];
  return ui`<section class="monthly-summary-card ${published?'is-published':''}" aria-label="Підсумок місяця"><div class="monthly-summary-top"><div><span class="monthly-summary-eyebrow">${published?uiText('Мій місяць у GymB'):uiText('Підсумок місяця')}</span><h2 class="monthly-summary-month">${esc(monthLabel(summary.month))}</h2><p>${esc(summary.profileName)} · ${uiText('Станом на')} ${esc(summary.throughDate)}</p></div><span class="monthly-summary-emblem" aria-hidden="true">✦</span></div><div class="monthly-summary-metrics">${metrics.map(([value,label])=>ui`<div><strong>${num(value)}</strong><span>${uiText(label)}</span></div>`).join('')}</div><div class="monthly-summary-bottom"><span><strong>${num(summary.volume)}</strong> ${uiText('кг × повторення')}</span><span><strong>${summary.minutesKnown?num(summary.minutes):'—'}</strong> ${uiText('Хвилин тренувань')}</span><span><strong>${num(summary.reps)}</strong> ${uiText('Повторень')}</span></div>${!published?ui`<p class="monthly-summary-note">Обсяг рахується за відомою вагою без розминки й дублювання найкращих результатів.</p>`:''}${published&&own?ui`<div class="monthly-summary-owner"><span>Показується іншим за твоїм вибором</span><button type="button" class="btn ghost" data-action="unpublish-monthly-summary">Прибрати з профілю</button></div>`:''}${controls}</section>`;
}
