import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appearanceDefaults,profileAppearance,profileHeaderAppearance,applyProfileHeaderAppearance} from '../public/js/profile-appearance.js';
test('legacy profiles keep the standard header; custom header data is bounded and validated',()=>{
  assert.equal(profileHeaderAppearance({}),null);
  assert.equal(profileAppearance({...appearanceDefaults,headerTitle:' GymB club '}).headerTitle,'GymB club');
  for(const bad of [{headerTitle:'x'.repeat(33)},{headerTitle:''},{headerTitle:'\nTest'},{headerMode:'hidden'},{headerBackground:'url(https://example.test)'},{headerShape:'100px'}])assert.throws(()=>profileAppearance(bad));
  const palette=profileHeaderAppearance({headerMode:'profile',blocks:'#111827',accent:'#ffffff'});
  assert.equal(palette.variables['--panel'],'#111827');assert.equal(palette.variables['--text'],'#ffffff');
  const lowContrast=profileHeaderAppearance({headerMode:'custom',headerBackground:'#ffffff',headerAccent:'#ffffff'});
  assert.equal(lowContrast.variables['--blue'],'#101820');
});
test('profile header applies only on profile pages and resets title, styling and attributes',()=>{
  const properties=new Map(),brand={textContent:'Nexus GymB',setAttribute(key,value){this[key]=value;}},header={dataset:{},style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},querySelector:()=>brand};
  const doc={body:{dataset:{page:'profile'}},querySelector:()=>header};
  applyProfileHeaderAppearance({headerMode:'custom',headerTitle:'Мій GymB',headerBackground:'#122131',headerShape:'pill'},doc);
  assert.equal(brand.textContent,'Мій GymB');assert.equal(properties.get('--panel'),'#122131');assert.equal(header.dataset.headerShape,'pill');
  assert.equal(brand['aria-label'],'Мій GymB — головна');
  doc.body.dataset.page='home';applyProfileHeaderAppearance({headerMode:'custom',headerTitle:'Мій GymB'},doc);
  assert.equal(brand.textContent,'Nexus GymB');assert.equal(properties.size,0);assert.deepEqual(header.dataset,{});
  doc.body.dataset.page='profile';applyProfileHeaderAppearance({headerMode:'custom'},doc);applyProfileHeaderAppearance(null,doc);
  assert.equal(properties.size,0);assert.equal(brand.textContent,'Nexus GymB');
});
