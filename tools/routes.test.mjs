import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync('public/404.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function redirect(path){const url=new URL(path,'https://example.test');let target=null;runInNewContext(script,{URLSearchParams,location:{pathname:url.pathname,search:url.search,hash:url.hash,replace:v=>target=v}});return target;}
test('legacy page links retain project prefix, search and fragment',()=>{
 assert.equal(redirect('/NexusGymB/public/home.html?date=2026-11-06#today'),'/NexusGymB/home.html?date=2026-11-06#today');
 assert.equal(redirect('/public/settings.html'),'/settings.html');
 assert.equal(redirect('/NexusGymB/public/'),'/NexusGymB/index.html');
});
test('numeric profile links redirect and unknown paths stay 404',()=>{
 assert.equal(redirect('/NexusGymB/public/u/1?number=2#comment-a'),'/NexusGymB/profile.html?number=1#comment-a');
 assert.equal(redirect('/NexusGymB/u/12'),'/NexusGymB/profile.html?number=12');
 for(const path of ['/NexusGymB/public/missing.html','/NexusGymB/u/0','/unknown'])assert.equal(redirect(path),null);
});
