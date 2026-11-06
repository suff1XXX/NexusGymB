export const nutritionDays = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];
export const mealNames = ['Сніданок', 'Обід', 'Перекус', 'Вечеря'];
export const nutritionGoals = ['Загальне меню', 'Підтримання ваги', 'Зниження ваги', 'Набір маси'];
export const nutritionDiets = ['Звичайний раціон', 'Без риби', 'Без молочних продуктів', 'Вегетаріанський'];
export function nutritionPlan(value) {
  const text = (value, label, maximum) => {
    const result = String(value ?? '').trim();
    if (!result || result.length > maximum) throw Error(`${label}: заповни поле (до ${maximum} символів).`);
    return result;
  };
  if (!nutritionGoals.includes(value.goal) || !nutritionDiets.includes(value.diet)) throw Error('Обери ціль і тип раціону.');
  if (!Array.isArray(value.days) || value.days.length !== 7) throw Error('Меню має містити 7 днів.');
  return { name: text(value.name, 'Назва', 100), description: String(value.description || '').trim().slice(0,1000),
    goal: value.goal, diet: value.diet, days: value.days.map(day => {
      if (!Array.isArray(day.meals) || day.meals.length !== 4) throw Error('Для кожного дня заповни 4 прийоми їжі.');
      return { meals: day.meals.map(meal => {
        const ingredients = (Array.isArray(meal.ingredients) ? meal.ingredients : String(meal.ingredients || '').split('\n')).map(line => String(line).trim()).filter(Boolean);
        if (!ingredients.length || ingredients.length > 30 || ingredients.some(line => line.length > 160)) throw Error('Вкажи від 1 до 30 продуктів, кожен до 160 символів.');
        const result = { name: text(meal.name, 'Назва страви', 100), ingredients };
        for (const key of ['kcal','protein','fat','carbs']) {
          const raw = meal[key];
          if (raw === '' || raw == null) { result[key] = null; continue; }
          const number = Number(raw);
          if (!Number.isFinite(number) || number < 0 || number > (key === 'kcal' ? 5000 : 1000)) throw Error('Перевір калорійність та БЖВ страви.');
          result[key] = number;
        }
        return result;
      }) };
    }), updatedAt: Date.now() };
}
export function dayNutrition(day) {
  return Object.fromEntries(['kcal','protein','fat','carbs'].map(key => [key,
    day.meals.every(meal => Number.isFinite(meal[key])) ? Math.round(day.meals.reduce((sum,meal) => sum + meal[key],0)) : null]));
}
export function shoppingList(plan) {
  const products = new Map();
  for (const day of plan.days) for (const meal of day.meals) for (const line of meal.ingredients) {
    const key = line.trim().replace(/\s+/g,' ').toLocaleLowerCase('uk');
    const item = products.get(key) || { name: line.trim(), count: 0 };
    item.count++; products.set(key,item);
  }
  return [...products.values()].sort((a,b) => a.name.localeCompare(b.name,'uk'));
}
export function menuText(plan) {
  return `${plan.name}\n${plan.description}\n\n` + plan.days.map((day,index) =>
    `${nutritionDays[index]}\n` + day.meals.map((meal,i) => `${mealNames[i]}: ${meal.name}\n${meal.ingredients.join('\n')}`).join('\n\n')).join('\n\n');
}
export function sampleNutritionPlan() {
  const breakfasts = ['Вівсянка з яблуком', 'Омлет із тостом', 'Йогурт з вівсянкою', 'Гречка з яйцем', 'Вівсянка з бананом', 'Сир з ягодами', 'Омлет з овочами'];
  const breakfastProducts = [['Вівсяні пластівці','Яблука','Молоко'],['Яйця','Цільнозерновий хліб','Помідори'],['Натуральний йогурт','Вівсяні пластівці','Ягоди'],['Гречка','Яйця','Огірки'],['Вівсяні пластівці','Банани','Молоко'],['Кисломолочний сир','Ягоди'],['Яйця','Помідори','Болгарський перець']];
  return nutritionPlan({name:'Меню на тиждень',description:'Приклад меню зі звичних продуктів. Порції та склад можна відредагувати перед публікацією.',goal:nutritionGoals[0],diet:nutritionDiets[0],days:nutritionDays.map((_,i) => ({meals:[
    {name:breakfasts[i],ingredients:breakfastProducts[i]},
    {name:i%2 ? 'Індичка з гречкою та салатом' : 'Курка з рисом та овочами',ingredients:i%2 ? ['Індичка','Гречка','Огірки','Помідори','Оливкова олія'] : ['Куряче філе','Рис','Морква','Броколі','Оливкова олія']},
    {name:i%2 ? 'Йогурт з фруктами' : 'Фрукти та горіхи',ingredients:i%2 ? ['Натуральний йогурт','Банани'] : ['Яблука','Волоські горіхи']},
    {name:i%2 ? 'Сочевиця з овочами' : 'Запечена риба з картоплею',ingredients:i%2 ? ['Сочевиця','Морква','Помідори','Оливкова олія'] : ['Риба','Картопля','Огірки','Оливкова олія']},
  ]}))});
}
