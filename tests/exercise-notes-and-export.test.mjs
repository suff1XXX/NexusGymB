import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exerciseNoteId,exerciseNoteData} from '../public/js/exercise-notes.js';
import {resultCardData,resultPDF} from '../public/js/result-card.js';

test('exercise notes follow exercise identity, including custom and personal exercises',()=>{
  assert.equal(exerciseNoteId({exerciseId:'press',name:'Стара назва'}),exerciseNoteId({exerciseId:'press',name:'Нова назва'}));
  assert.notEqual(exerciseNoteId({exerciseId:'personal:press'}),exerciseNoteId({exerciseId:'press'}));
  assert.equal(exerciseNoteId({name:'  Жим / сидячи '}),exerciseNoteId({name:'жим / сидячи'}));
  assert.ok(!exerciseNoteId({name:'Жим / сидячи'}).includes('/'));
  assert.throws(()=>exerciseNoteData({exerciseId:'press'},'a'.repeat(2001)));
});
test('result card excludes private notes, skipped exercises and warmups; counts quick results separately',()=>{
  const s={id:'one',name:'День сили',date:'2026-11-22',status:'completed',startedAt:0,endedAt:600000,
    items:[{exerciseId:'press',name:'Жим',sets:3,note:'PRIVATE'},{name:'Пропущено',sets:1},{name:'Планка',sets:1}],
    logs:[{index:0,weight:20,reps:10,warmup:true},{index:0,weight:50,reps:8},{index:0,weight:50,reps:8},{index:0,weight:60,reps:5,quickResult:true}],simpleCompleted:[2],note:'PRIVATE'};
  const data=resultCardData(s);
  assert.equal(data.stats.sets,2);assert.equal(data.stats.volume,800);
  assert.equal(data.exercises.length,2);assert.match(data.exercises[0].results,/2 підх/);
  assert.match(data.exercises[0].results,/Найкращий/);
  assert.ok(!JSON.stringify(data).includes('PRIVATE'));
  assert.throws(()=>resultCardData({...s,status:'active'}));
});
test('PDF has correct byte offsets and multiple A4 page objects',async()=>{
  const image={width:1000,height:1414,toDataURL:()=>`data:image/jpeg;base64,${Buffer.from([255,216,255,217]).toString('base64')}`};
  const bytes=Buffer.from(await resultPDF([image,image]).arrayBuffer()),text=bytes.toString('latin1');
  assert.match(text,/\/Count 2/);assert.match(text,/\/MediaBox \[0 0 595.28 841.89\]/);
  const start=Number(/startxref\n(\d+)/.exec(text)[1]);assert.equal(text.slice(start,start+4),'xref');
  const entries=text.slice(start).split('\n').slice(3,11);
  for(const [index,line]of entries.entries())assert.equal(text.slice(Number(line.slice(0,10))).startsWith(`${index+1} 0 obj`),true);
});
