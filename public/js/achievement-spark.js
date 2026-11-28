import {achievementCatalog,evaluateAchievements} from './achievement-catalog.js';

export const achievementMetricLimits={workouts:1000000,sets:20000000,volume:1000000000000,bestStreak:100000,variety:100000,sharedWorkouts:1000000,programs:100000,planned:1000000,exercises:100000,friends:100000,profileComplete:1,comments:1000000,activeDays:90,challenges:100000};
export function sparkProgress(source={},manualIds=[]) {
  const facts=Object.fromEntries(Object.entries(achievementMetricLimits).map(([key,max])=>[key,Math.min(max,Math.max(0,Math.floor(Number(source[key])||0)))]));
  const ids=achievementCatalog.filter(medal=>manualIds.includes(medal.id)).map(medal=>medal.id);
  return {...evaluateAchievements(facts,ids),manualIds:ids,facts,catalogVersion:3,eventsVersion:1};
}
export function sparkDisplay(display,earnedIds) {
  return {selectedIds:[...new Set(display?.selectedIds||[])].filter(id=>earnedIds.includes(id)).slice(0,3),rankingEnabled:display?.rankingEnabled===true};
}
export function sameSparkProgress(previous,next) {
  return previous?.catalogVersion===3&&previous.eventsVersion===1&&previous.score===next.score&&JSON.stringify(previous.earnedIds)===JSON.stringify(next.earnedIds)&&JSON.stringify(previous.manualIds)===JSON.stringify(next.manualIds)&&Object.keys(achievementMetricLimits).every(key=>previous.facts?.[key]===next.facts[key]);
}
