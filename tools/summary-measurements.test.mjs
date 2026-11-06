import test from 'node:test';
import assert from 'node:assert/strict';
import { workoutSummary } from '../public/js/workout-summary.js';
import { measurementData,measurementSeries } from '../public/js/body-measurements.js';
import { exportData } from '../public/js/training-data.js';
import { parseBackup,backupEntries } from '../public/js/backup.js';
import { profileSnapshots } from '../public/js/profile-data.js';
import { publicProfileData } from '../public/js/people.js';
import { createOfflineStore } from '../public/js/offline.js';
const item={name:'Жим',sets:3,reps:'10',weight:40,seconds:0,rest:60};
const session={id:'s',programId:'p',name:'Верх',date:'2026-11-06',status:'completed',startedAt:1000,endedAt:1801000,
  index:1,items:[item],skipped:[],restEnd:0,timerEnd:0,logs:[{index:0,weight:10,reps:12,warmup:true},{index:0,weight:40,reps:10}]};
test('summary separates warmups and computes duration, work volume and first records',()=>{
  const data=workoutSummary(session,[]);
  assert.equal(data.minutes,30);assert.equal(data.sets,1);assert.equal(data.warmupSets,1);
  assert.equal(data.volume,400);assert.equal(data.reps,10);assert.equal(data.exercises,1);
  assert.equal(data.records.length,1);assert.equal(data.records[0].first,true);
});
test('records compare against earlier workouts and ignore later ones',()=>{
  const before={...session,id:'before',date:'2026-11-05',logs:[{index:0,weight:30,reps:10}]};
  const after={...session,id:'after',date:'2026-11-07',logs:[{index:0,weight:100,reps:10}]};
  assert.equal(workoutSummary(session,[before,session,after]).records.length,1);
  assert.equal(workoutSummary(session,[{...before,logs:[{index:0,weight:40,reps:12}]}]).records.length,0);
  assert.throws(()=>workoutSummary({...session,status:'active'}));
});
test('early and text-only workouts have accurate partial/empty summaries',()=>{
  assert.equal(workoutSummary({...session,endedEarly:true}).plannedSets,3);
  assert.equal(workoutSummary({...session,items:[],logs:[],description:'Прогулянка'}).volume,0);
});
const today=new Date('2026-11-06T12:00:00');
test('measurements validate optional fields, units, decimals and dates',()=>{
  assert.deepEqual(measurementData({date:'2026-11-06',weight:'70,25',waist:'',note:' Запис '},today),{date:'2026-11-06',weight:70.25,note:'Запис'});
  for(const input of [{date:'2026-11-07',weight:70},{date:'2026-02-30',weight:70},{date:'2026-11-06'},
    {date:'2026-11-06',weight:NaN},{date:'2026-11-06',waist:0},{date:'2026-11-06',biceps:true}]) assert.throws(()=>measurementData(input,today));
});
test('measurement charts sort dates and skip missing fields',()=>{
  assert.deepEqual(measurementSeries([{date:'2026-11-06',weight:71},{date:'2026-11-04',waist:80},{date:'2026-11-01',weight:70}],'weight'),[{date:'2026-11-01',value:70},{date:'2026-11-06',value:71}]);
});
test('measurements round-trip in backups and are omitted from public profile snapshots',()=>{
  const record={id:'2026-11-06',date:'2026-11-06',weight:70,note:''};
  const state={programs:[],sessions:[],exercises:[],exercisePreferences:{},measurements:[record]};
  const data=parseBackup(JSON.stringify(exportData(state)));
  assert.equal(data.measurements[0].weight,70);
  assert.equal(backupEntries(data,{...state,measurements:[]},'alice').entries[0][0],'users/alice/measurements/2026-11-06');
  assert.deepEqual(parseBackup(JSON.stringify({...exportData(state),measurements:undefined})).measurements,[]);
  assert.equal('measurements' in publicProfileData({name:'A',customId:1,createdAt:1,measurements:[record]}),false);
  assert.equal('measurements' in profileSnapshots([]),false);
});
test('private measurement writes can be queued offline for the current account only',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const store=createOfflineStore(storage,'alice');store.cache('users/alice/measurements',[]);
  store.enqueue([{kind:'save',path:'users/alice/measurements/2026-11-06',data:{date:'2026-11-06',weight:70}}]);
  assert.equal(store.cached('users/alice/measurements')[0].weight,70);
  assert.throws(()=>store.enqueue([{kind:'save',path:'users/bob/measurements/x',data:{}}]));
});
