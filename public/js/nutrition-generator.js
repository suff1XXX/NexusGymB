// Estimates, not a clinical prescription. REE: Mifflin–St Jeor (PMID 2305711).
// Activity multipliers are a conservative product heuristic; food values are rounded
// reference estimates per 100 g, not brand-specific labels (USDA FoodData Central).
export const generatorDefaults = {goal:'maintain',sex:'male',age:28,height:175,weight:75,steps:7000,workouts:3,adjustment:0,occupation:'seated',diet:'regular',basket:'standard',needsCare:false};
export function generatorInput(raw) {
  const result = {};
  for (const [key, choices] of Object.entries({goal:['lose','maintain','gain'],sex:['male','female'],occupation:['seated','standing','physical'],diet:['regular','noFish','noDairy','vegetarian'],basket:['economy','standard','varied']})) {
    if (!choices.includes(raw[key])) throw Error('Перевір ціль, активність і харчові вподобання.');
    result[key]=raw[key];
  }
  for (const [key,min,max] of [['age',18,80],['height',130,220],['weight',40,200],['steps',0,30000],['workouts',0,7],['adjustment',0,20]]) {
    if (raw[key] === '' || raw[key] == null) throw Error('Заповни всі дані для розрахунку.');
    const number=Number(raw[key]);
    if (!Number.isFinite(number) || number<min || number>max) throw Error('Розрахунок доступний для дорослих 18–80 років. Перевір діапазони введених даних.');
    if (['age','steps','workouts','adjustment'].includes(key) && !Number.isInteger(number)) throw Error('Вкажи ціле значення віку, кроків, тренувань і відсотка.');
    result[key]=number;
  }
  result.needsCare=raw.needsCare===true || raw.needsCare==='on';
  if (result.needsCare) throw Error('За вагітності, грудного вигодовування, РХП або потреби в лікувальному харчуванні потрібен індивідуальний раціон із фахівцем. Автоматичне меню для цих випадків не створюється.');
  if (result.goal==='maintain') result.adjustment=0;
  if (result.goal==='gain' && result.adjustment>15) throw Error('Для набору обери профіцит до 15%.');
  const bmi=result.weight/(result.height/100)**2;
  if (bmi<18.5 && result.goal==='lose') throw Error('За вказаними даними меню зі зниженням калорійності не створюється. Обери іншу ціль та обговори її з фахівцем.');
  return result;
}
export function estimateNutrition(raw) {
  const input=generatorInput(raw);
  const bmr=10*input.weight+6.25*input.height-5*input.age+(input.sex==='male'?5:-161);
  // Steps include the entire day. Occupational adjustment covers extra effort beyond walking.
  const factor=Math.min(1.9,1.2+Math.min(input.steps,20000)/1000*0.025+input.workouts*0.025+({seated:0,standing:0.05,physical:0.15})[input.occupation]);
  const maintenance=bmr*factor;
  const kcal=Math.round(maintenance*(1+(input.goal==='lose'?-1:input.goal==='gain'?1:0)*input.adjustment/100));
  // Product limits avoid silently generating unusually low or high calorie plans.
  if (kcal<(input.sex==='male'?1500:1200) || kcal>4500) throw Error('Розрахунок виходить за межі автоматичного меню. Зміни ціль або звернися по індивідуальний підбір.');
  const protein=Math.round(Math.min(input.weight*(input.workouts?1.6:1.2),kcal*0.3/4));
  const fat=Math.round(kcal*0.3/9);
  const carbs=Math.round((kcal-protein*4-fat*9)/4);
  return {kcal,protein,fat,carbs,bmr:Math.round(bmr),maintenance:Math.round(maintenance),factor:Math.round(factor*100)/100};
}
// name, preparation state, kcal, protein, fat, carbohydrates (per 100 g).
export const foodTable = {
 oats:['Вівсяні пластівці','сухі',379,13.2,6.5,67.7], rice:['Рис','сухий',365,7.1,0.7,80], buckwheat:['Гречка','суха',343,13.3,3.4,71.5], pasta:['Цільнозернові макарони','сухі',350,13,2.5,67], potato:['Картопля','сира',77,2,0.1,17.5], bread:['Цільнозерновий хліб','готовий',247,13,4.2,41],
 chicken:['Куряче філе','сире',120,22.5,2.6,0], turkey:['Філе індички','сире',114,23.7,1.5,0], whitefish:['Біла риба','сира',82,18,0.7,0], salmon:['Лосось','сирий',208,20,13,0], eggs:['Яйця без шкаралупи','сирі',143,12.6,9.5,0.7], tofu:['Тофу','готовий',144,17.3,8.7,2.8], lentils:['Сочевиця','варена',116,9,0.4,20.1], chickpeas:['Нут','варений',164,8.9,2.6,27.4],
 yogurt:['Грецький йогурт 2%','готовий',73,10,2,3.9], cottage:['Кисломолочний сир 5%','готовий',121,17,5,1.8], milk:['Молоко 2.5%','готове',52,3,2.5,4.7], soy:['Соєвий напій без цукру','готовий',33,3.3,1.8,0.7],
 apple:['Яблуко','їстівна частина',52,0.3,0.2,13.8], banana:['Банан','без шкірки',89,1.1,0.3,22.8], berries:['Ягоди','їстівна частина',50,0.8,0.4,11], orange:['Апельсин','без шкірки',47,0.9,0.1,11.8],
 broccoli:['Броколі','сирі',34,2.8,0.4,6.6], carrot:['Морква','сира',41,0.9,0.2,9.6], tomato:['Помідори','сирі',18,0.9,0.2,3.9], cucumber:['Огірок','сирий',15,0.7,0.1,3.6], pepper:['Солодкий перець','сирий',31,1,0.3,6], oil:['Оливкова олія','готова',884,0,100,0], walnuts:['Волоські горіхи','ядра',654,15.2,65.2,13.7],
};
const portion=(id,grams,min=grams*0.45,max=grams*2.5)=>({id,grams,min,max});
function recipes(input,day,seed) {
  const n=(day+seed)%7, vegetarian=input.diet==='vegetarian', dairy=input.diet!=='noDairy';
  const fruits=['apple','banana','berries','orange'];
  const fruit=fruits[(n+seed+(input.basket==='economy'?0:1))%fruits.length];
  const grains=input.basket==='economy'?['rice','buckwheat','potato']:['rice','buckwheat','pasta','potato'];
  const grain=grains[(n+seed)%grains.length], grain2=grains[(n+1+seed*2)%grains.length];
  const proteins=vegetarian?['tofu','lentils','chickpeas']:input.diet==='noFish'?['chicken','turkey','eggs']:input.basket==='economy'?['chicken','eggs','lentils']:input.basket==='varied'?['chicken','salmon','turkey','whitefish']:['chicken','whitefish','turkey'];
  const protein=proteins[(n+seed*2)%proteins.length], protein2=proteins[(n+1+seed*3)%proteins.length];
  const grainPortion=id=>portion(id,id==='potato'?250:75,id==='potato'?100:25,id==='potato'?500:180);
  const proteinPortion=id=>portion(id,['lentils','chickpeas'].includes(id)?220:150,['lentils','chickpeas'].includes(id)?100:60,['lentils','chickpeas'].includes(id)?400:id==='eggs'?200:300);
  const veg=['broccoli','carrot','tomato','pepper'][n%4];
  const breakfast=n%2===0?{name:'Вівсяна каша з фруктами',items:[portion('oats',65,30,140),portion(dairy?'milk':'soy',180,100,300),portion(fruit,150,100,220),portion('walnuts',10,5,25)]}:{name:'Тост з омлетом та овочами',items:[portion('eggs',120,80,180),portion('bread',70,30,160),portion('tomato',150,100,220),portion('oil',5,2,10)]};
  const snack=dairy?{name:n%2?'Сир із фруктами':'Йогурт із фруктами',items:[portion(n%2?'cottage':'yogurt',180,100,320),portion(fruit,170,100,250),portion('walnuts',15,5,30)]}:{name:'Тофу, фрукти та горіхи',items:[portion('tofu',100,60,200),portion(fruit,170,100,250),portion('walnuts',15,5,30)]};
  const title=(p,g)=>`${foodTable[p][0]} + ${foodTable[g][0].toLocaleLowerCase('uk')}`;
  return [breakfast,{name:title(protein,grain),items:[proteinPortion(protein),grainPortion(grain),portion(veg,200,150,300),portion('oil',10,3,25)]},snack,{name:title(protein2,grain2),items:[proteinPortion(protein2),grainPortion(grain2),portion('cucumber',150,100,250),portion('tomato',100,80,200),portion('oil',10,3,25)]}];
}
function totals(items) {
  const result={kcal:0,protein:0,fat:0,carbs:0};
  for(const item of items) ['kcal','protein','fat','carbs'].forEach((key,i)=>{result[key]+=foodTable[item.id][i+2]*item.grams/100;});
  return result;
}
function fitPortions(meals,target) {
  const items=meals.flatMap(meal=>meal.items);
  const largePortionScale=Math.max(1,target.kcal/2500);
  for(const item of items)item.max*=largePortionScale;
  const score=()=>{const sum=totals(items);return ['kcal','protein','fat','carbs'].reduce((value,key)=>value+((sum[key]-target[key])/target[key])**2*(key==='kcal'?8:1),0);};
  // Bounded coordinate descent changes real portions; displayed totals always come from foods.
  for(const step of [30,10,5,1]) for(let pass=0;pass<12;pass++) {
    let changed=false;
    for(const item of items) {
      const before=item.grams;let best=score(),grams=before;
      for(const sign of [-1,1]) {item.grams=Math.max(item.min,Math.min(item.max,before+sign*step));const value=score();if(value<best){best=value;grams=item.grams;}}
      item.grams=grams;if(grams!==before)changed=true;
    }
    if(!changed)break;
  }
  for(const item of items)item.grams=Math.max(1,Math.round(item.grams));
  return meals.map(meal=>({...meal,...Object.fromEntries(Object.entries(totals(meal.items)).map(([k,v])=>[k,Math.round(v*10)/10])),ingredients:meal.items.map(item=>`${foodTable[item.id][0]} — ${item.grams} г (${foodTable[item.id][1]})`)}));
}
export function generateNutrition(raw,seed=0) {
  const input=generatorInput(raw),targets=estimateNutrition(input);
  if(!Number.isInteger(seed)||seed<0||seed>1000000)throw Error('Не вдалося створити меню. Спробуй ще раз.');
  const days=Array.from({length:7},(_,day)=>({meals:fitPortions(recipes(input,day,seed),targets)}));
  for(const day of days){const energy=day.meals.reduce((sum,meal)=>sum+meal.kcal,0);if(Math.abs(energy-targets.kcal)/targets.kcal>.08)throw Error('Для цих параметрів не вдалося підібрати відповідні порції. Зміни продуктовий кошик або звернися по індивідуальне меню.');}
  const groceries=new Map();
  for(const day of days)for(const meal of day.meals)for(const item of meal.items){groceries.set(item.id,(groceries.get(item.id)||0)+item.grams);}
  return {input,targets,seed,plan:{name:'Твій раціон на 7 днів',description:'Орієнтовне меню з порціями, підібраними за твоєю анкетою.',days},groceries:[...groceries].map(([id,grams])=>({id,name:foodTable[id][0],state:foodTable[id][1],grams})).sort((a,b)=>a.name.localeCompare(b.name,'uk'))};
}
