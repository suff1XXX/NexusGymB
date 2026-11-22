import test from 'node:test';
import assert from 'node:assert/strict';
import {sparkProgress,sparkDisplay,sameSparkProgress} from '../public/js/achievement-spark.js';
test('Spark scoring uses fixed catalogue points and protects manual-only medals',()=>{
  assert.deepEqual(sparkProgress({workouts:1},['unknown']).earnedIds,['first-workout']);
  const value=sparkProgress({workouts:1},['first-workout','first-workout','ceo-praise','bad-gymbro']);
  assert.equal(value.score,325);assert.equal(value.earnedIds.length,3);
  assert.equal(sparkProgress({workouts:0}).earnedIds.includes('ceo-praise'),false);
  assert.equal(sameSparkProgress(value,{...value,updatedAt:123}),true);
  assert.equal(sameSparkProgress(value,sparkProgress({workouts:2},value.manualIds)),false);
});
test('display removes revoked and duplicate medals while preserving ranking consent',()=>{
  assert.deepEqual(sparkDisplay({selectedIds:['ceo-praise','first-workout','first-workout'],rankingEnabled:true},['first-workout']),{selectedIds:['first-workout'],rankingEnabled:true});
  assert.equal(sparkDisplay(null,[]).rankingEnabled,false);
});
