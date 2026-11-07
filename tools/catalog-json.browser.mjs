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
  'exercises/archived': {name:'Архівна вправа',primary:'Ноги',equipment:'Штанга',archived:true},
  'users/alice/exercises/mine': {name:'Особиста вправа',primary:'Ноги',equipment:'Гантелі'},
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
 saveMany: async (entries) => { if(entries.length>100)throw Error('Batch too large'); if(localStorage.getItem('test-fail-batch')==='1' && entries.length===1){localStorage.removeItem('test-fail-batch');throw Error('Temporary failure');} const data=read();for(const [path,value] of entries)data[path]=value;write(data); },
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
await context.addInitScript((fixture) => { if (!localStorage.getItem('test-db')) localStorage.setItem('test-admin','1'); if (!localStorage.getItem('test-db')) localStorage.setItem('test-db', JSON.stringify(fixture)); }, data);
await context.route('**/js/firebase.js', (route) => route.fulfill({ contentType: 'text/javascript', body: mock }));
const page = await context.newPage(), errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('dialog', (dialog) => dialog.accept());
const click = (text) => page.getByRole('button', { name: text, exact: true }).click();


try {
 await page.goto(origin+'/admin.html');
 await page.locator('[data-admin-section="catalog"] > summary').click();
 // Export ignores current filters and excludes personal exercise records.
 await page.locator('#admin-catalog-search').fill('Жим ногами');
 const downloaded=page.waitForEvent('download');
 await click('Експорт усіх вправ JSON');
 const file=await downloaded, exported=JSON.parse(await readFile(await file.path(),'utf8'));
 assert.equal(exported.exercises.length,4);assert.equal(exported.exercises.some(e=>e.archived),true);assert.equal(exported.exercises.some(e=>e.personal),false);
 exported.exercises.find(e=>e.id==='leg').technique='Оновлена техніка з файлу';
 exported.exercises.push({name:'Нова тяга',primary:'Спина',equipment:'Блок'});
 await click('Додати / оновити з JSON');
 await page.locator('#catalog-json-file').setInputFiles({name:'catalog.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
 await page.getByText('Завантажено: catalog.json. Натисни «Перевірити зміни».',{exact:true}).waitFor();
 await click('Перевірити зміни');
 await page.getByText('Нових: 1. Оновлень: 1. Без змін: 3.',{exact:true}).waitFor();
 // Review is read-only until Save.
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-db'))['exercises/leg'].technique),undefined);
 await click('Зберегти зміни');
 await page.locator('#modal').waitFor({state:'hidden'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-db')));
 assert.equal(saved['exercises/leg'].technique,'Оновлена техніка з файлу');assert.equal(saved['exercises/archived'].archived,true);
 assert.equal(Object.keys(saved).filter(k=>k.startsWith('exercises/')).length,5);
 // An individual exercise accepts a partial patch with no ID.
 await page.locator('.admin-record-row').filter({has:page.getByRole('heading',{name:'Жим ногами',exact:true})}).locator('.admin-desktop-actions').getByRole('button',{name:'Оновити JSON',exact:true}).click();
 await page.locator('#catalog-json-form [name=json]').fill(JSON.stringify({technique:'Часткове оновлення'}));
 await click('Перевірити зміни');await click('Зберегти зміни');await page.locator('#modal').waitFor({state:'hidden'});
 const patched=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-db'))['exercises/leg']);
 assert.equal(patched.technique,'Часткове оновлення');assert.equal(patched.equipment,'Тренажер');assert.equal(patched.name,'Жим ногами');

 // More than 100 writes run in batches; retry resumes after a failed batch.
 await page.evaluate(()=>localStorage.setItem('test-fail-batch','1'));
 await click('Додати / оновити з JSON');
 await page.locator('#catalog-json-form [name=json]').fill(JSON.stringify({exercises:Array.from({length:101},(_,i)=>({name:`Пакетна вправа ${i}`,primary:'Ноги'}))}));
 await click('Перевірити зміни');await click('Зберегти зміни');
 await page.locator('#toast').filter({hasText:'Збережено 100 із 101'}).waitFor();
 await click('Зберегти зміни');await page.locator('#modal').waitFor({state:'hidden'});
 const batchCount=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('test-db'))).filter(e=>e.name?.startsWith('Пакетна вправа ')).length);
 assert.equal(batchCount,101);
 // Unknown ID is rejected and creates no records.
 await click('Додати / оновити з JSON');
 await page.locator('#catalog-json-form [name=json]').fill(JSON.stringify({exercises:[{id:'missing',technique:'Помилка'}]}));
 await click('Перевірити зміни');await page.locator('#catalog-json-form .form-error').filter({hasText:'не знайдено'}).waitFor();
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});
 await click('Додати / оновити з JSON');
 assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 await page.evaluate(()=>localStorage.removeItem('test-admin'));
 await page.goto(origin+'/admin.html');
 await page.waitForURL('**/home.html');
 assert.equal(await page.locator('.admin-studio').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: global/archived export, filtered catalog export, file import preview, create/update, single partial patch, unknown ID rejection, mobile dialog.');
} catch(error) {console.log('UI errors',errors,'toast',await page.locator('#toast').textContent(),'form',await page.locator('.form-error').allTextContents());throw error;}
finally {await browser.close();await new Promise(r=>server.close(r));}


