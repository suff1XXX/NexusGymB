import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('public');
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/home.html' : pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const item = { exerciseId:'leg', name: 'Жим ногами', primary: 'Ноги', sets: 3, reps: '10', weight: 40, seconds: 0, rest: 60, metrics: [] };
const day = { weekday: 2, name: 'Ноги', groups: 'Ноги', warmup: '5 хв ходьби та рухливість суглобів', items: [item] };
const joinedAt = Date.now() - 20 * 86400000;
const data = {
  'exercises/leg': {name:'Жим ногами',primary:'Ноги',equipment:'Тренажер'},
  'exercises/squat': {name:'Присідання',primary:'Ноги',equipment:'Гантелі'},
  'exercises/press': {name:'Жим гантелей',primary:'Груди',equipment:'Гантелі'},
  'users/alice': { name: 'Аліса', email: 'alice@example.test', createdAt: joinedAt, customId: 1, photo: '', activeProgramId: 'p' },
  'users/bob': { name: 'Богдан', email: 'bob@example.test', createdAt: joinedAt, customId: 2, photo: '' },
  'publicProfiles/alice': { name: 'Аліса', joinedAt, customId: 1, photo: '' },
  'publicProfiles/bob': { name: 'Богдан', joinedAt, customId: 2, photo: '' },
  'userNumbers/1': { uid: 'alice' }, 'userNumbers/2': { uid: 'bob' },
  'users/alice/programs/p': { name: 'Мій план', type: 'Верх / Низ', days: [day] },
  'users/alice/sessions/previous': { programId: 'p', name: 'Ноги', dayId: 2, date: '2026-11-04', status: 'completed',
    startedAt: Date.now() - 5000000, endedAt: Date.now() - 4000000, index: 1, items: [item], skipped: [],
    restEnd: 0, timerEnd: 0, logs: [{ index: 0, weight: 55, reps: 8, seconds: 0 }, { index: 0, weight: 60, reps: 6, seconds: 0 }] },
};
const mock = `
const uid = localStorage.getItem('test-user') || 'alice';
const read = () => JSON.parse(localStorage.getItem('test-db'));
const write = (data) => localStorage.setItem('test-db', JSON.stringify(data));
const get = (path) => read()[path] || null;
const list = (path) => Object.entries(read()).filter(([key]) => key.startsWith(path + '/') && key.split('/').length === path.split('/').length + 1).map(([key, value]) => ({ ...value, id: key.split('/').at(-1) }));
const user = { uid, emailVerified: true, displayName: uid === 'alice' ? 'Аліса' : 'Богдан', email: uid + '@example.test', metadata: { creationTime: new Date(${joinedAt}).toISOString() } };
export async function connect() { return {
 auth: { currentUser: user }, watch: (fn) => { queueMicrotask(() => fn(user)); return () => {}; },
 isOwner: async () => localStorage.getItem('test-admin') === '1', profile: async () => get('users/' + uid), pending: () => 0, sync: async () => {}, markActive: async () => true,
 timestamp: () => Date.now(), get: async (p) => get(p), getLive: async (p) => get(p), list: async (p) => list(p),
 save: async (p, value) => { const data=read(); data[p]=value; write(data); },
 patch: async (p, value) => { const data=read(); data[p]={...data[p],...value}; write(data); },
 remove: async (p) => { const data=read(); delete data[p]; write(data); },
 publishProfileStats: async () => {}, ensurePublicProfile: async () => {}, gymBros: async () => list('gymBros').filter((r) => r.members.includes(uid)),
 profileComments: async (id) => list('publicProfiles/' + id + '/comments'),
 changeAvatar: async (photo) => { const data=read(); data['users/'+uid].photo=photo; data['publicProfiles/'+uid].photo=photo; write(data); },
}; }
`;
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE_PATH || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
await context.addInitScript((fixture) => { if (!localStorage.getItem('test-db')) localStorage.setItem('test-db', JSON.stringify(fixture)); }, data);
await context.route('**/js/firebase.js', (route) => route.fulfill({ contentType: 'text/javascript', body: mock }));
const page = await context.newPage(), errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('dialog', (dialog) => dialog.accept());
const click = (text) => page.getByRole('button', { name: text, exact: true }).click();

try {
  await page.goto(origin+'/exercises.html');
  await page.locator('.catalog-entry').first().waitFor();
  await page.locator('.catalog-entry').filter({has:page.getByRole('heading',{name:'Жим ногами',exact:true})}).getByRole('button',{name:'＋ До тренування',exact:true}).click();
  await page.locator('#catalog-add-form button[type=submit]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('test-db'))['users/alice/programs/p'].days[0].items.length===2);
  await page.locator('.catalog-entry').filter({has:page.getByRole('heading',{name:'Жим ногами',exact:true})}).getByRole('button',{name:'Прогрес',exact:true}).click();
  await page.getByRole('heading',{name:'Мій прогрес · Жим ногами'}).waitFor();
  assert.match(await page.locator('#modal').innerText(),/60 кг/);
  await page.keyboard.press('Escape');
  await page.locator('.exercise-card').filter({has:page.getByRole('heading',{name:'Жим ногами',exact:true})}).click();
  await page.locator('.exercise-alternatives summary').click();
  await page.locator('#modal').getByText('Присідання',{exact:true}).waitFor();
  await page.locator('[data-alternative-equipment]').selectOption('Гантелі');
  assert.equal(await page.locator('.alternative-row:visible').count(),1);
  await page.keyboard.press('Escape');
  await page.goto(origin+'/program.html');
  await click('Почати тренування'); await click('Почати зараз');
  await page.waitForURL('**/workout.html'); await click('✓ Розминку виконано');
  await page.locator('#execution-mode').selectOption('simple');
  await page.locator('.checklist-item').first().waitFor();
  await page.locator('.checklist-item').first().getByRole('button',{name:'Записати результат',exact:true}).click();
  await page.locator('#quick-result-form [name=weight]').fill('6x?');
  await page.locator('#quick-result-form [name=reps]').fill('12');
  await page.locator('#quick-result-form button[type=submit]').click();
  await page.locator('#modal').waitFor({state:'hidden'});
  await page.locator('.checklist-item').first().getByRole('button',{name:'Позначити виконаною',exact:true}).click();
  await page.reload();
  assert.equal(await page.locator('#execution-mode').inputValue(),'simple');
  assert.match(await page.locator('.checklist-item').first().innerText(),/6x\?/);
  await page.locator('#execution-mode').selectOption('mixed');
  await page.locator('.checklist-item').nth(1).getByRole('button',{name:'Замінити',exact:true}).click();
  await page.locator('#modal .alternative-row').filter({hasText:'Присідання'}).getByRole('button',{name:'Обрати',exact:true}).click();
  await page.locator('.checklist-item').nth(1).getByRole('heading',{name:'2. Присідання',exact:true}).waitFor();
  await page.locator('.checklist-item').nth(1).getByRole('button',{name:'Облік підходів',exact:true}).click();
  await page.locator('#set-form [name=weight]').fill('6x10');
  await page.locator('#set-form [name=reps]').fill('8');
  await click('✓ Завершити підхід');
  await page.getByText('Робочий підхід 1: 8 повторень · 6x10 = 60 кг',{exact:true}).waitFor();
  await click('← Список вправ');
  await page.locator('.checklist-item').nth(1).getByRole('button',{name:'Позначити виконаною',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'.sites-runtime/workout-modes-mobile.png',fullPage:true});
  await click('✓ Завершити тренування');
  await page.getByRole('heading',{name:'Тренування завершено',exact:true}).waitFor();
  const saved=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('test-db'))).find(s=>s.executionMode==='mixed'));
  assert.equal(saved.status,'completed');assert.equal(saved.logs.length,2);assert.equal(saved.logs[0].weightText,'6x?');assert.equal(saved.logs[1].weight,60);
  // A second simple workout finishes with no logs at all.
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('test-db'));d['users/alice/programs/p'].builderMode='simple';localStorage.setItem('test-db',JSON.stringify(d));});
  await page.goto(origin+'/program.html');
  await click('Почати тренування');await click('Почати зараз');await page.waitForURL('**/workout.html');await click('✓ Розминку виконано');
  assert.equal(await page.locator('#execution-mode').inputValue(),'simple');
  await page.locator('.checklist-item').first().getByRole('button',{name:'Позначити виконаною',exact:true}).click();
  await page.locator('.checklist-item').nth(1).getByRole('button',{name:'Позначити виконаною',exact:true}).click();
  await click('✓ Завершити тренування');await page.getByRole('heading',{name:'Тренування завершено',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: catalog add, exercise progress, alternatives filter, simple/mixed/detailed workflows, plate weights, reload persistence, completion without logs, mobile layout.');
} catch(error) {console.log('UI errors',errors,'toast',await page.locator('#toast').textContent(),'form',await page.locator('.form-error').allTextContents());await page.screenshot({path:'.sites-runtime/workout-modes-failure.png',fullPage:true});throw error;}
finally {await browser.close();await new Promise(r=>server.close(r));}

