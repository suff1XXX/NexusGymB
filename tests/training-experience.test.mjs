import test from 'node:test';
import assert from 'node:assert/strict';
import {weekStart,weeklyProgress,compareWorkouts,reflectionData,profileLayout,defaultBlockOrder,challengeData,challengeCount} from '../public/js/training-experience.js';
import {comparisonCard} from '../public/js/training-experience-view.js';
const item={exerciseId:'squat',name:'Присідання',sets:3};
const session=(id,date,weight=50,extra={})=>({id,date,name:'Ноги',programId:'p',dayId:1,status:'completed',startedAt:0,endedAt:1800000,items:[item],logs:[{index:0,weight,reps:10}],...extra});
test('weekly targets respect Monday boundaries and exclude future, active and empty training',()=>{
  assert.equal(weekStart('2026-11-22'),'2026-11-16');assert.equal(weekStart('2026-11-23'),'2026-11-23');
  const result=weeklyProgress([session('old','2026-11-15'),session('a','2026-11-16'),session('b','2026-11-22'),session('future','2026-11-23'),session('active','2026-11-20',50,{status:'active'}),session('empty','2026-11-21',50,{logs:[]})],[{week:'2026-11-16',target:2}],'2026-11-22');
  assert.equal(result.count,2);assert.equal(result.percent,100);assert.equal(result.previous.count,1);assert.equal(result.previous.volume,500);
});
test('workout comparison chooses an earlier matching day and compares working results',()=>{
  const before=session('before','2026-11-19'),now=session('now','2026-11-22',60,{logs:[{index:0,weight:60,reps:12},{index:0,weight:100,reps:10,warmup:true},{index:0,weight:999,reps:999,quickResult:true}]});
  const result=compareWorkouts(now,[before,now,session('future','2026-11-23',100)]);
  assert.equal(result.before.id,'before');assert.equal(result.deltas.volume,220);assert.equal(result.deltas.reps,2);assert.equal(result.deltas.sets,0);
  assert.equal(result.exercises[0].bestWeight,60);assert.equal(result.exercises[0].before.bestWeight,50);
  assert.equal(compareWorkouts(now,[now]).before,null);
  const unknown=session('unknown','2026-11-23',0,{logs:[{index:0,weight:0,weightUnknown:true,reps:8}]});
  const html=comparisonCard(unknown,[before,unknown]);
  assert.match(html,/Неповні дані/);assert.match(html,/Не вказано/);assert.ok(!html.includes('-500'));
});
test('private reflections and profile layout validate ranges, preserve order and reject unknown blocks',()=>{
  assert.deepEqual(reflectionData({difficulty:'8',energy:'4',note:'  Добре  '}),{difficulty:8,energy:4,note:'Добре'});
  for(const value of [{difficulty:11,energy:3},{difficulty:3,energy:0},{difficulty:3,energy:3,note:'x'.repeat(1001)}])assert.throws(()=>reflectionData(value));
  assert.deepEqual(profileLayout({order:[...defaultBlockOrder].reverse(),visible:['medals','comments']}).visible,['medals','comments']);
  assert.throws(()=>profileLayout({order:defaultBlockOrder,visible:['secrets']}));
  assert.throws(()=>profileLayout({order:defaultBlockOrder,visible:['__proto__']}));
  assert.throws(()=>profileLayout({order:defaultBlockOrder.map(()=>defaultBlockOrder[0]),visible:[]}));
});
test('GymBro challenge validates its window and counts only valid workouts inside it',()=>{
  const challenge=challengeData({title:' Разом ',target:2,startDate:'2026-11-22',endDate:'2026-12-22'},'2026-11-22');
  assert.equal(challenge.title,'Разом');
  assert.equal(challengeCount([session('past','2026-11-21'),session('a','2026-11-22'),session('b','2026-11-23'),session('c','2026-11-24')],challenge,'2026-11-23'),2);
  assert.throws(()=>challengeData({...challenge,target:31},'2026-11-22'));
  assert.throws(()=>challengeData({...challenge,endDate:'2027-12-22'},'2026-11-22'));
});
