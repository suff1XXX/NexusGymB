import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile,mkdir } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import assert from 'node:assert/strict';
await mkdir('.sites-runtime',{recursive:true});
const root=resolve('public');
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(/^\/u\/[1-9][0-9]*$/.test(path)?'/profile.html':path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,joinedAt=Date.now()-20*86400000;
const item={name:'Жим',sets:2,reps:'10',weight:40,seconds:0,rest:60,metrics:[]};
const data={
  'users/alice':{name:'Аліса',email:'alice@example.test',customId:1,createdAt:joinedAt,photo:'',activeProgramId:'p'},
  'users/bob':{name:'Богдан',email:'bob@example.test',customId:2,createdAt:joinedAt,photo:''},
  'publicProfiles/alice':{name:'Аліса',customId:1,joinedAt,photo:''},
  'publicProfiles/bob':{name:'Богдан',customId:2,joinedAt,photo:''},
  'userNumbers/1':{uid:'alice'},'userNumbers/2':{uid:'bob'},
  'users/alice/programs/p':{name:'Моя програма',type:'Власна програма',days:[{weekday:0,name:'Верх',groups:'Груди',items:[item]}]},
};
const mock=`
import {profileSnapshots} from './profile-data.js';
const uid=localStorage.getItem('test-user')||'alice';window.__requests=[];
const read=()=>JSON.parse(localStorage.getItem('test-db'));
const write=(data)=>localStorage.setItem('test-db',JSON.stringify(data));
const get=(path)=>{window.__requests.push(path);return read()[path]||null;};
const list=(path)=>{window.__requests.push(path);return Object.entries(read()).filter(([p])=>p.startsWith(path+'/')&&p.split('/').length===path.split('/').length+1).map(([p,v])=>({...v,id:p.split('/').at(-1)}));};
const user={uid,emailVerified:true,displayName:uid==='alice'?'Аліса':'Богдан',email:uid+'@example.test',metadata:{creationTime:new Date(${joinedAt}).toISOString()}};
export async function connect(){return {
 auth:{currentUser:user},watch:fn=>{queueMicrotask(()=>fn(user));return ()=>{};},isOwner:async()=>localStorage.getItem('test-admin')==='1',
 profile:async()=>get('users/'+uid),pending:()=>0,sync:async()=>{},markActive:async()=>true,timestamp:()=>({seconds:Date.now()/1000}),
 get:async p=>get(p),getLive:async p=>get(p),list:async p=>list(p),
 save:async(p,v)=>{const data=read();data[p]=v;write(data);},patch:async(p,v)=>{const data=read();data[p]={...data[p],...v};write(data);},remove:async p=>{const data=read();delete data[p];write(data);},
 saveMany:async entries=>{const data=read();for(const [p,v]of entries)data[p]=v;write(data);},
 ensurePublicProfile:async()=>{},gymBros:async()=>[],publicGymBros:async()=>[],profileComments:async()=>[],blockedUsers:async()=>[],blockStatus:async()=>({iBlocked:false,blockedMe:false}),
 publishProfileStats:async sessions=>{const data=read();for(const [key,value]of Object.entries(profileSnapshots(sessions)))data['publicProfiles/'+uid+'/stats/'+key]=value;write(data);},
 watchNotifications:fn=>{queueMicrotask(()=>fn([]));return ()=>{};},trainingInvites:async()=>[],
};}
`;
const browser=await chromium.launch({...(process.platform==='win32'?{channel:'chrome'}:{}),headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
await context.addInitScript(fixture=>{if(!localStorage.getItem('test-db'))localStorage.setItem('test-db',JSON.stringify(fixture));},data);
await context.route('**/js/firebase.js',route=>route.fulfill({contentType:'text/javascript',body:mock}));
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
const click=name=>page.getByRole('button',{name,exact:true}).click();
try{
  await page.goto(origin+'/program.html');await click('Почати тренування');await click('Почати зараз');
  await page.waitForURL('**/workout.html');await page.locator('#set-form').waitFor();
  await page.locator('#set-form [name=weight]').fill('20');await page.locator('#set-form [name=reps]').fill('12');await click('＋ Записати розминочний підхід');
  await page.locator('#set-form [name=weight]').fill('40');await page.locator('#set-form [name=reps]').fill('10');await click('✓ Завершити підхід');
  await page.locator('#set-form [name=weight]').fill('45');await page.locator('#set-form [name=reps]').fill('8');await click('✓ Завершити підхід');
  await click('Завершити тренування');await page.locator('.workout-summary').waitFor();
  assert.match(page.url(),/summary=/);await page.getByRole('heading',{name:'🏆 Нові рекорди',exact:true}).waitFor();
  assert.match(await page.locator('.summary-hero').textContent(),/1 розминочних/);
  assert.equal(await page.locator('.summary-metrics > div').nth(1).locator('strong').textContent(),'2');
  assert.equal(await page.locator('.summary-metrics > div').nth(2).locator('strong').textContent(),'760');
  await page.reload();await page.locator('.workout-summary').waitFor();
  await page.screenshot({path:'.sites-runtime/workout-summary.png',fullPage:true});
  await page.goto(origin+'/profile.html');await page.locator('.body-measurements').waitFor();
  const dates=await page.evaluate(()=>{const format=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const now=new Date(),before=new Date();before.setDate(before.getDate()-1);return [format(before),format(now)];});
  await click('Додати заміри');await page.locator('#measurement-date').fill(dates[0]);
  await page.locator('#measurement-form [name=weight]').fill('72.4');await page.locator('#measurement-form [name=waist]').fill('80');await click('Зберегти заміри');
  await page.locator('.measurement-overview').waitFor();await click('Додати заміри');
  await page.locator('#measurement-form [name=weight]').fill('71.8');await click('Зберегти заміри');
  assert.equal(await page.locator('.body-measurements .chart-point').count(),2);
  await page.locator('.measurement-history').evaluate(el=>el.open=true);
  await page.locator('[data-action=edit-measurement]').last().click();
  assert.equal(await page.locator('#measurement-date').getAttribute('readonly'),'');
  await page.locator('#measurement-form [name=waist]').fill('79.5');await click('Зберегти заміри');
  await page.locator('#measurement-metric').selectOption('waist');
  assert.equal(await page.locator('.measurement-overview strong').textContent(),'79.5 см');
  await page.locator('.measurement-history').evaluate(el=>el.open=true);
  await page.locator(`[data-action=delete-measurement][data-id="${dates[1]}"]`).click();
  await page.locator('.body-measurements').waitFor();
  assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('test-db'))).filter(p=>p.startsWith('users/alice/measurements/')).length),1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.sites-runtime/body-measurements-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>localStorage.setItem('test-user','bob'));
  await page.goto(origin+'/u/1');await page.getByRole('heading',{name:'Аліса',exact:true}).waitFor();
  assert.equal(await page.locator('.body-measurements').count(),0);
  assert.equal(await page.evaluate(()=>window.__requests.includes('users/alice/measurements')),false);
  await page.evaluate(()=>localStorage.setItem('test-admin','1'));await page.reload();await page.locator('.profile-hero').waitFor();
  assert.equal(await page.locator('.body-measurements').count(),0);
  await page.evaluate(()=>{localStorage.setItem('test-user','alice');localStorage.removeItem('test-admin');});
  await page.goto(origin+'/settings.html');await click('Безпека');
  const downloadPromise=page.waitForEvent('download');await click('Завантажити JSON');const download=await downloadPromise;
  const backup=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(backup.measurements.length,1);assert.equal(backup.measurements[0].waist,79.5);
  await page.goto(origin+'/program.html');await click('Почати тренування');await click('Почати зараз');await page.locator('#set-form').waitFor();
  await click('✓ Завершити підхід');await click('Завершити достроково');await page.locator('.workout-summary').waitFor();
  await page.getByText('Завершено достроково',{exact:true}).waitFor();
  assert.equal(await page.locator('.summary-metrics > div').nth(1).locator('strong').textContent(),'1');
  assert.deepEqual(errors,[]);
  console.log('PASS: summaries (complete, early, reload), measurement CRUD/chart/export, mobile layout and visitor/admin isolation');
}catch(error){console.log('UI errors',errors,await page.locator('.form-error').allTextContents());await page.screenshot({path:'.sites-runtime/browser-failure.png',fullPage:true});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
