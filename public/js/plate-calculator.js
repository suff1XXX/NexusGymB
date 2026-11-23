export const defaultPlates=()=>[25,20,15,10,5,2.5,1.25,0.5,0.25].map(weight=>({weight,pairs:weight === 20?4:2}));
const number=value=>Number(String(value).trim().replace(',','.'));
function cents(value,label,maximum=1000) {
  const n=number(value);
  if (!Number.isFinite(n) || n < 0 || n > maximum || Math.abs(n*100-Math.round(n*100)) > 0.00001) throw Error(`${label}: число від 0 до ${maximum} кг, до 2 знаків після коми.`);
  return Math.round(n*100);
}
export function plateInventory(value) {
  if (!Array.isArray(value) || value.length > 12) throw Error('Додай до 12 розмірів дисків.');
  const result=value.map(row=>{
    const weight=cents(row.weight,'Вага диска',50),pairs=number(row.pairs);
    if (weight < 1 || !Number.isInteger(pairs) || pairs < 0 || pairs > 20) throw Error('Вкажи додатну вагу диска та від 0 до 20 пар.');
    return {weight:weight/100,pairs};
  });
  if (new Set(result.map(row=>row.weight)).size !== result.length) throw Error('Кожен розмір диска має бути вказаний один раз.');
  return result.sort((a,b)=>b.weight-a.weight);
}
// Bounded change-making: minimize discs per side using the available pairs.
// Work in integer hundredths of a kilogram, so fractional plates stay exact.
export function calculatePlates({target,barWeight=20,mode='total',plates=defaultPlates()}) {
  const inventory=plateInventory(plates),bar=cents(barWeight,'Вага грифа / основи',100),requested=cents(target,'Цільова вага');
  if (!['total','perSide'].includes(mode)) throw Error('Обери загальну вагу або вагу дисків на сторону.');
  const targetTotal=mode === 'perSide'?bar+requested*2:requested;
  if (targetTotal > 100000) throw Error('Сумарна вага має бути до 1000 кг.');
  if (targetTotal < bar) throw Error('Загальна вага не може бути меншою за вагу грифа / основи.');
  const needed=(targetTotal-bar)/2,active=inventory.filter(row=>row.pairs>0);
  const units=active.map(row=>Math.round(row.weight*100)),available=active.reduce((sum,row,k)=>sum+units[k]*row.pairs,0);
  const maximum=Math.min(available,Math.floor(needed)+(units[0]||0));
  const infinity=65535,choices=[];
  let costs=new Uint16Array(maximum+1);costs.fill(infinity);costs[0]=0;
  for (let k=0;k<active.length;k++) {
    const next=new Uint16Array(maximum+1);next.fill(infinity);
    const used=new Uint8Array(maximum+1),unit=units[k];
    for (let sum=0;sum<=maximum;sum++) {
      if (costs[sum] === infinity) continue;
      for (let count=0;count<=active[k].pairs && sum+count*unit<=maximum;count++) {
        const at=sum+count*unit,total=costs[sum]+count;
        if (total < next[at]) {next[at]=total;used[at]=count;}
      }
    }
    choices.push(used);costs=next;
  }
  let lower=Math.min(Math.floor(needed),maximum);
  while (lower>0 && costs[lower] === infinity) lower--;
  let higher=Math.ceil(needed);
  while (higher<=maximum && costs[higher] === infinity) higher++;
  let remaining=lower;
  const perSide=[];
  for (let k=active.length-1;k>=0;k--) {
    const count=choices[k][remaining];
    if (count) perSide.push({weight:active[k].weight,count});
    remaining-=count*units[k];
  }
  return {exact:lower === needed,targetTotal:targetTotal/100,barWeight:bar/100,total:(bar+lower*2)/100,perSideWeight:lower/100,
    perSide:perSide.reverse(),plateCount:costs[lower]*2,higherTotal:higher<=maximum?(bar+higher*2)/100:null};
}
