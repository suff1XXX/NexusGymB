import test from 'node:test';
import assert from 'node:assert/strict';
import {repetitionRecords,activityDays,sessionScope,replaceForToday,restoreForToday,pollData} from '../public/js/workout-additions.js';
import {newSession,plannedSession} from '../public/js/model.js';
import {saveSetDraft,loadSetDraft} from '../public/js/workout-recovery.js';
const item={exerciseId:'press',name:'Жим',primary:'Груди',sets:3,reps:'8',weight:50,seconds:0,rest:60,metrics:[],setPlans:Array.from({length:3},()=>({reps:'8',weight:50,seconds:0,rest:60}))};
const source={id:'p',name:'Програма',type:'Власна програма',scope:'home',days:[{weekday:0,name:'Дім',groups:'Груди',items:[item]}]};
const session=(id,date,logs,extra={})=>({id,status:'completed',date,items:[item],logs:logs.map(log=>({index:0,reps:8,weight:50,...log})),...extra});
test('exact-repetition records exclude warmups, unknown loads, future dates and other rep counts',()=>{
  const records=repetitionRecords([session('a','2026-11-20',[{reps:5,weight:60},{reps:8,weight:55},{reps:8,weight:100,warmup:true},{reps:8,weightUnknown:true,weight:0}]),session('b','2026-11-21',[{reps:8,weight:60}]),session('future','2026-11-23',[{reps:8,weight:120}])],8,'2026-11-22');
  assert.equal(records.length,1);assert.equal(records[0].weight,60);assert.equal(records[0].sessionId,'b');assert.equal(records[0].reps,8);
});
test('activity separates home and main training, preserves saved type and excludes incomplete workouts',()=>{
  const sessions=[session('home','2026-11-21',[{}],{programId:'p'}),session('main','2026-11-21',[{}],{scope:'main'}),session('old-home','2026-11-20',[{}],{scope:'home',programId:'deleted'}),session('active','2026-11-22',[{}],{status:'active'}),session('empty','2026-11-22',[])];
  const all=activityDays(sessions,[source],2026,'all','2026-11-22');assert.equal(all.workouts,3);assert.equal(all.days,2);
  assert.equal(all.dates.find(day=>day.date==='2026-11-21').home,1);assert.equal(all.dates.find(day=>day.date==='2026-11-21').main,1);
  assert.equal(activityDays(sessions,[source],2026,'home','2026-11-22').workouts,2);
  assert.equal(sessionScope(sessions[2],[]),'home');assert.equal(sessionScope({programId:'deleted'},[]),'unknown');
  assert.equal(newSession(source,source.days[0]).scope,'home');assert.equal(plannedSession(source,'2026-11-23',new Date('2026-11-22T12:00Z')).scope,'home');
});
test('today-only replacement leaves the program intact, resets load, restores original and protects logged sets',()=>{
  const active={...newSession(source,source.days[0]),id:'active'},replacement={id:'push-up',name:'Віджимання',primary:'Груди'};
  const changed=replaceForToday(active,0,replacement,'busy');assert.equal(changed.items[0].exerciseId,'push-up');assert.equal(changed.items[0].weight,0);assert.equal(changed.items[0].setPlans[0].weight,0);
  assert.equal(source.days[0].items[0].exerciseId,'press');assert.equal(active.items[0].exerciseId,'press');assert.deepEqual(restoreForToday(changed,0).items,active.items);
  const again=replaceForToday(changed,0,{id:'fly',name:'Розведення'},'variation');assert.equal(again.replacements[0].original.exerciseId,'press');
  assert.throws(()=>restoreForToday({...changed,logs:[{index:0,reps:5,weight:20}]},0));
  const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  saveSetDraft(storage,'alice',active,{weight:'55',reps:'8'});
  assert.equal(loadSetDraft(storage,'alice',active).weight,'55');assert.equal(loadSetDraft(storage,'alice',changed),null);
});
test('meeting polls require distinct future slots, bounded count and valid Kyiv times',()=>{
  const now=new Date('2026-11-22T12:00Z'),value={title:' Коли? ',options:[{date:'2026-11-23',time:'18:00'},{date:'2026-11-24',time:'19:30'}]};
  assert.equal(pollData(value,now).title,'Коли?');assert.throws(()=>pollData({...value,options:[value.options[0],value.options[0]]},now));
  assert.throws(()=>pollData({...value,options:[{date:'2026-11-22',time:'10:00'},value.options[1]]},now));
  assert.throws(()=>pollData({...value,options:[{date:'2026-11-23',time:'24:00'},value.options[1]]},now));
});
