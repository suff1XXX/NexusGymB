import test from 'node:test';
import assert from 'node:assert/strict';
import {exportCatalog,catalogImportPlan} from '../public/js/catalog-json.js';
const existing=[{id:'leg',name:'Жим ногами',primary:'Ноги',equipment:'Тренажер',technique:'Стара техніка',image:'https://example.com/leg.png',archived:false},{id:'old',name:'Присідання',primary:'Ноги',archived:true},{id:'personal:mine',name:'Моя вправа',primary:'Груди',personal:true}];
const plan=(value,target='')=>catalogImportPlan(JSON.stringify(value),existing,target);
test('export includes entire global catalog and archive; roundtrip changes nothing',()=>{
 const exported=exportCatalog(existing);assert.equal(exported.exercises.length,2);assert.equal(exported.exercises[1].archived,true);
 assert.deepEqual(plan(exported).map(e=>e.action),['unchanged','unchanged']);
});
test('ID updates can rename and preserve omitted fields and archive',()=>{
 const [entry]=plan({exercises:[{id:'old',name:'Присідання зі штангою',technique:'Нова техніка'}]});
 assert.equal(entry.action,'update');assert.equal(entry.id,'old');assert.equal(entry.data.archived,true);assert.equal(entry.data.primary,'Ноги');
 assert.deepEqual(entry.changed,['name','technique']);
});
test('unique name matching updates without duplicates and empty string clears a field',()=>{
 const [entry]=plan([{name:' жим ногами ',technique:'',archived:true}]);
 assert.equal(entry.id,'leg');assert.equal(entry.data.technique,'');assert.equal(entry.data.image,existing[0].image);assert.equal(entry.data.archived,true);
});
test('new entries are validated and single exercise mode accepts partial JSON',()=>{
 assert.equal(plan({exercises:[{name:'Тяга',primary:'Спина'}]})[0].action,'create');
 const [entry]=plan({technique:'Нова техніка'},'leg');assert.equal(entry.id,'leg');assert.equal(entry.data.name,'Жим ногами');
});
test('invalid IDs, duplicate targets and ambiguous names are rejected',()=>{
 for(const value of [[{id:'missing',name:'Нова',primary:'Ноги'}],[{id:'../leg'}],[{id:'leg'},{name:'Жим ногами'}],[{name:'Тяга',primary:'Спина'},{name:'тяга',primary:'Спина'}]])assert.throws(()=>plan(value));
 assert.throws(()=>catalogImportPlan(JSON.stringify([{name:'Жим ногами',technique:'Нова'}]),[...existing,{...existing[0],id:'another'}]));
 assert.throws(()=>plan([{id:'old'}],'leg'));
 assert.throws(()=>plan([{id:'leg'},{id:'old'}],'leg'));
});
test('malformed files, invalid field types and unsafe URLs are rejected before saving',()=>{
 for(const value of [null,{},[],[{id:'leg',archived:'false'}],[{id:'leg',image:'javascript:alert(1)'}],[{id:'leg',technique:123}],[{id:'leg',personal:true}]])assert.throws(()=>plan(value));
 assert.throws(()=>catalogImportPlan('broken',existing));
 assert.equal(catalogImportPlan('\uFEFF'+JSON.stringify(exportCatalog(existing)),existing).length,2);
});
