export const gymPanels = {
  rest: { label: 'Таймер відпочинку', selector: '.workout-rest' },
  restAdd: { label: 'Кнопка «+30 с»', selector: '[data-action="rest-add"]', button: true },
  exerciseTimer: { label: 'Таймер вправи', selector: '.workout-exercise-timer' },
  previous: { label: 'Попередня вага', selector: '.previous-weight' },
  suggestions: { label: 'Підказки наступної ваги', selector: '.weight-suggestion' },
  notes: { label: 'Особисті нотатки', selector: '.exercise-personal-note' },
  technique: { label: 'Техніка та історія вправи', selector: '.workout-exercise-info' },
  description: { label: 'Опис і план тренування', selector: '.workout-description' },
  outline: { label: 'Список вправ збоку', selector: '.workout-outline' },
  warmup: { label: 'Запис розминочних підходів', selector: '.workout-warmup' },
  tracking: { label: 'Вибір способу запису підходів', selector: '.set-tracking-controls' },
  calculator: { label: 'Калькулятор дисків', selector: '[data-action="plate-calculator"]', button: true },
  formats: { label: 'Підказки введення ваги', selector: '.workout-reuse' },
};
const modes = ['show', 'fold', 'off'];
export function gymPreferences(value = {}) {
  return {
    enabled: value?.enabled === true,
    keepAwake: value?.keepAwake !== false,
    panels: Object.fromEntries(Object.entries(gymPanels).map(([key, panel]) => [key,
      modes.includes(value?.panels?.[key]) && !(panel.button && value.panels[key] === 'fold') ? value.panels[key] : 'show'])),
  };
}
export function readGymPreferences(storage, uid) {
  try { return gymPreferences(JSON.parse(storage.getItem(`nexus:gym-mode:${uid}`) || '{}')); }
  catch { return gymPreferences(); }
}
export function saveGymPreferences(storage, uid, value) {
  const prefs = gymPreferences(value);
  storage.setItem(`nexus:gym-mode:${uid}`, JSON.stringify(prefs));
  return prefs;
}
export function gymTimerSession(session, preferences) {
  if (!session || !preferences.enabled) return session;
  return { ...session, ...(preferences.panels.rest === 'off' ? { restEnd: 0 } : {}),
    ...(preferences.panels.exerciseTimer === 'off' ? { timerEnd: 0 } : {}) };
}
export function mountGymMode(root, preferences, translate = text => text) {
  const studio = root.querySelector('.workout-studio');
  if (!studio || !preferences.enabled) return;
  studio.classList.add('gym-mode');
  for (const [key, panel] of Object.entries(gymPanels)) {
    const mode = preferences.panels[key];
    if (mode === 'show') continue;
    for (const node of studio.querySelectorAll(panel.selector)) {
      if (mode === 'off') { node.hidden = true; continue; }
      if (node.tagName === 'DETAILS') { node.open = false; continue; }
      const fold = document.createElement('details'), summary = document.createElement('summary');
      fold.className = `gym-fold gym-fold-${key}`;
      summary.textContent = translate(panel.label);
      node.before(fold); fold.append(summary, node);
    }
  }
}

// A pending request may resolve after navigation; release that lock immediately.
export function createGymWakeLock(environment = globalThis, onStatus = () => {}) {
  let desired = false, lock = null, pending = false;
  const status = value => onStatus(value);
  async function acquire() {
    if (!desired || environment.document.visibilityState !== 'visible' || lock || pending) return;
    if (!environment.navigator.wakeLock?.request) { status('unsupported'); return; }
    pending = true;
    try {
      const next = await environment.navigator.wakeLock.request('screen');
      if (!desired || environment.document.visibilityState !== 'visible') { await next.release(); return; }
      lock = next;
      next.addEventListener('release', () => { if (lock === next) { lock = null; status('released'); } });
      status('active');
    } catch { status('unavailable'); }
    finally { pending = false; }
  }
  function sync(enabled) {
    desired = enabled;
    if (!desired) { const previous = lock; lock = null; previous?.release().catch(() => {}); status('off'); }
    else void acquire();
  }
  const visibility = () => {
    if (environment.document.visibilityState === 'visible') void acquire();
    else {
      const previous = lock; lock = null;
      previous?.release().catch(() => {});
      if (desired) status('released');
    }
  };
  environment.document.addEventListener('visibilitychange', visibility);
  return { sync, dispose() { sync(false); environment.document.removeEventListener('visibilitychange', visibility); } };
}
