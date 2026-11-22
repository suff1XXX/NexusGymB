import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

export async function checkSparkBrowser(owner) {
  const root=resolve('public'),server=createServer(async(req,res)=>{
    const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    try {res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}
    catch {res.writeHead(404).end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH});
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],functions=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',req=>{if(req.url().includes('cloudfunctions.net'))functions.push(req.url());});
  await context.addInitScript(()=>{localStorage.setItem('qa-auth',localStorage.getItem('qa-auth')||'alice');localStorage.setItem('nexus:theme','Темна');});
  await context.route('**/firebase-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`
    const uid=localStorage.getItem('qa-auth');
    const user={uid,emailVerified:true,email:uid+'@example.test',displayName:uid,photoURL:'',metadata:{creationTime:new Date(1).toISOString(),lastSignInTime:new Date(1).toISOString()}};
    const auth={currentUser:user};
    export const getAuth=()=>auth,browserLocalPersistence={},setPersistence=async()=>{},onAuthStateChanged=(_,fn)=>{queueMicrotask(()=>fn(user));return ()=>{};};
  `}));
  await context.route('**/js/config.js',route=>route.fulfill({contentType:'text/javascript',body:`export const OWNER_UID=${JSON.stringify(owner)};export const firebaseConfig={apiKey:'demo-key',projectId:'demo-nexus-gymb',authDomain:'demo-nexus-gymb.firebaseapp.com',appId:'demo'};`}));
  await context.route('**/js/firebase.js',async route=>{
    const source=(await readFile('public/js/firebase.js','utf8')).replace('db = C.getFirestore(app);',`db = C.getFirestore(app);\n  C.connectFirestoreEmulator(db,'127.0.0.1',8085,{mockUserToken:{sub:localStorage.getItem('qa-auth'),user_id:localStorage.getItem('qa-auth'),email_verified:true,email:localStorage.getItem('qa-auth')+'@example.test'}});`);
    await route.fulfill({contentType:'text/javascript',body:source});
  });
  try {
    await page.goto(origin+'/achievements.html');
    await page.locator('.achievement-card.is-earned').first().waitFor();
    await page.waitForFunction(()=>!document.querySelector('.achievements-page>p[role="status"]'));
    assert.equal(await page.locator('.achievements-page .notice.error').count(),0);
    assert.equal(await page.locator('.achievement-card [data-id="ceo-praise"]').count(),0);
    await page.evaluate(uid=>localStorage.setItem('qa-auth',uid),owner);
    await page.goto(origin+'/admin.html');
    await page.locator('[data-admin-section="users"]>summary').click();
    await page.locator('[data-action="load-users"]').click();
    await page.waitForFunction(()=>!!document.querySelector('[data-action="admin-user"][data-id="alice"]'));
    if(!await page.locator('[data-admin-section="users"]').evaluate(e=>e.open))await page.locator('[data-admin-section="users"]>summary').click();
    await page.locator('[data-action="admin-user"][data-id="alice"]:visible').first().click();
    await page.locator('[data-action="admin-member-panel"][data-panel="awards"]').click();
    await page.locator('#admin-award-form').waitFor();
    await page.locator('#admin-award-form [name="medalId"]').selectOption('ceo-praise');
    await page.locator('#admin-award-form button[type="submit"]').click();
    await page.locator('[data-action="admin-revoke-achievement"][data-id="ceo-praise"]').waitFor();
    await page.screenshot({path:'.sites-runtime/spark-admin-achievements.png'});
    await page.evaluate(()=>localStorage.setItem('qa-auth','alice'));
    await page.goto(origin+'/achievements.html');
    await page.locator('.achievement-card [data-id="ceo-praise"]').waitFor();
    await page.locator('.achievement-card [data-id="ceo-praise"]').click();
    await page.locator('#achievement-ranking').check();
    await page.locator('[data-action="save-achievement-display"]').click();
    await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('Вітрину збережено'));
    await page.locator('[data-action="achievement-leaderboard-refresh"]').click();
    await page.locator('.achievement-leaderboard .is-you').waitFor();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'.sites-runtime/spark-achievements-mobile.png'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(functions,[]);assert.deepEqual(errors,[]);
    console.log('Spark browser passed: real Firestore refresh, admin grant, hidden medal, showcase and ranking; no Cloud Functions requests.');
  } catch(error) {await page.screenshot({path:'.sites-runtime/spark-browser-failure.png'});throw error;}
  finally {await browser.close();await new Promise(done=>server.close(done));}
}
