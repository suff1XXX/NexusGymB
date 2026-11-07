import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWeight, weightLabel, simpleDone, saveQuickResult, finishChecklist, alternatives} from '../public/js/workout-modes.js';
import {newSession, completeSet, workingSetCount} from '../public/js/model.js';
import {validSession} from '../public/js/history.js';
import {personalRecords, countsAsWorkout} from '../public/js/fitness.js';
import {progressSeries, exportCsv} from '../public/js/training-data.js';
import {parseBackup} from '../public/js/backup.js';
import {workoutSummary} from '../public/js/workout-summary.js';
const item={exerciseId:'leg',name:'Жим ногами',primary:'Ноги',sets:3,reps:'10',weight:0,seconds:0,rest:60,metrics:[]};
const day={weekday:0,name:'Ноги',groups:'Ноги',items:[item,{...item,exerciseId:'squat',name:'Присідання'}]};
const session=(mode='simple')=>({...newSession({id:'p',builderMode:mode},day),id:'session'});
test('weight expressions preserve plates and distinguish unknown kg',()=>{
  assert.deepEqual(parseWeight('6х10'),{weight:60,weightText:'6x10',weightUnknown:false});
  assert.equal(parseWeight(' 6 × 2,5 ').weight,15);
  assert.equal(parseWeight('6x?').weightUnknown,true);
  assert.match(weightLabel(parseWeight('6x?')),/невідома/);
  assert.equal(parseWeight('0').weight,0);
  for(const value of ['', '-1', 'NaN','Infinity','0x10','2e3','3x-1','1001x?','100x20','?','6x','<script>'])assert.throws(()=>parseWeight(value));
});
test('simple checklist completes without invented sets and counts as a workout',()=>{
  let s=session(); s=simpleDone(s,0); s=simpleDone(s,1); s=finishChecklist(s);
  assert.equal(s.logs.length,0); assert.equal(s.skipped.length,0);
  assert.equal(validSession(s),true); assert.equal(countsAsWorkout(s),true);
  assert.equal(workoutSummary(s).exercises,2); assert.equal(workoutSummary(s).sets,0);
  assert.equal(simpleDone(session(),0).simpleCompleted.length,1);
  assert.equal(simpleDone(simpleDone(session(),0),0).simpleCompleted.length,0);
});
test('quick result updates once, unknown weight does not become a kg record',()=>{
  let s=saveQuickResult(session(),0,8,'6x10');
  assert.equal(workingSetCount(s),0);
  s=saveQuickResult(s,0,12,'6x?');
  assert.equal(s.logs.length,1); assert.equal(validSession(s),true);
  s=finishChecklist(simpleDone(s,0));
  assert.deepEqual(s.skipped,[1]); assert.deepEqual(personalRecords([s]),[]);
  assert.deepEqual(progressSeries([s],{key:'leg'}),[]);
  assert.equal(workoutSummary(s).volume,0);
  assert.match(exportCsv({programs:[],sessions:[s]}),/6x\?/);
});
test('mixed mode records detailed sets alongside one best result',()=>{
  let s=session('cross'); assert.equal(s.executionMode,'mixed');
  s=saveQuickResult(s,0,8,'6x10');
  for(let k=0;k<3;k++)s=completeSet(s,10,50);
  assert.equal(workingSetCount(s),3);assert.equal(validSession(s),true);
  s=finishChecklist(s); assert.equal(s.skipped.includes(0),false);
  assert.equal(personalRecords([s])[0].weight,60);
  assert.equal(workoutSummary(s).volume,1500);
  assert.equal(workoutSummary(s).reps,30);
  assert.equal(progressSeries([s],{metric:'volume',key:'leg'})[0].value,1500);
  const backup={version:1,programs:[],sessions:[s],exercises:[],exercisePreferences:{}};
  assert.equal(parseBackup(JSON.stringify(backup)).sessions[0].logs[0].weightText,'6x10');
});
test('backup rejects inconsistent weight metadata and invalid checklist indexes',()=>{
  const s=saveQuickResult(session(),0,8,'6x10');
  s.logs[0].weight=999; assert.equal(validSession(s),false);
  assert.equal(validSession({...session(),simpleCompleted:[99]}),false);
});
test('alternatives exclude source and archived exercises, prioritize equipment',()=>{
  const source={id:'a',primary:'Ноги',equipment:'Тренажер'};
  const list=alternatives([{...source},{...source,id:'b',name:'Жим'},{id:'c',name:'Присідання',primary:'Ноги',equipment:'Гантелі'},{...source,id:'d',archived:true,name:'Архів'},{id:'e',name:'Тяга',primary:'Спина'}],source);
  assert.deepEqual(list.map(e=>e.id),['b','c']);
});
