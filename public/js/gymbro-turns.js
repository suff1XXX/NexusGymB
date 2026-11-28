export function nextTurnState(invite,uid,action,previous=null,token='') {
  if(invite?.status!=='accepted'||![invite.from,invite.to].includes(uid)||invite.from===invite.to)throw Error('Чергування доступне учасникам прийнятого запрошення.');
  const members=[invite.from,invite.to],other=members.find(id=>id!==uid);
  const state=previous?structuredClone(previous):{joined:[],turnUid:'',revision:0,lastSets:Object.fromEntries(members.map(id=>[id,'']))};
  if(action==='join') {
    if(state.joined.includes(uid))return null;
    state.joined.push(uid);if(!state.turnUid)state.turnUid=uid;
  } else if(action==='leave') {
    if(!state.joined.includes(uid))return null;
    state.joined=state.joined.filter(id=>id!==uid);if(state.turnUid===uid)state.turnUid=state.joined[0]||'';
  } else if(action==='pass'||action==='set') {
    if(state.joined.length!==2||state.turnUid!==uid)return null;
    if(action==='set') {
      if(typeof token!=='string'||!token||token.length>200)throw Error('Некоректний запис черги.');
      if(state.lastSets[uid]===token)return null;
      state.lastSets[uid]=token;
    }
    state.turnUid=other;
  } else throw Error('Невідома дія чергування.');
  return {...state,revision:state.revision+1,lastActor:uid,lastAction:action};
}
export function workoutSetToken(session,log) {
  return `${session.id}:${session.logs.indexOf(log)}:${log.index}:${log.at||0}`;
}
export function turnActionApplied(state,uid,action,token='') {
  if(!state)return false;
  if(action==='set')return state.lastSets?.[uid]===token;
  if(action==='join')return state.joined?.includes(uid)===true;
  if(action==='leave')return !state.joined?.includes(uid);
  return action==='pass'&&state.lastActor===uid&&state.lastAction==='pass'&&state.turnUid!==uid;
}
