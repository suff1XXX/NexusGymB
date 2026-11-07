import { exerciseData } from './import.js';

export const catalogJsonLimit = 15000000;
const fields = ['name','primary','equipment','secondary','purpose','setup','position','technique','breathing','mistakes','caution','image','video'];
const normalize = name => String(name || '').trim().toLocaleLowerCase('uk').replace(/\s+/g, ' ');

export function exportCatalog(exercises) {
  return { exercises: exercises.filter(e => !e.personal).map(e => ({ id:e.id, ...exerciseData(e), archived:!!e.archived })) };
}

export function catalogImportPlan(text, exercises, targetId = '') {
  if (text.length > catalogJsonLimit) throw Error('Файл завеликий. Максимум 15 МБ.');
  let value;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw Error('Некоректний JSON. Перевір коми, лапки та дужки.'); }
  const rows = Array.isArray(value) ? value : value?.exercises ?? (value?.name || targetId ? [value] : null);
  if (!Array.isArray(rows) || !rows.length || rows.length > 5000) throw Error('Додай від 1 до 5000 вправ у полі exercises або масиві.');
  if (targetId && rows.length !== 1) throw Error('Для оновлення однієї вправи завантаж один запис.');
  const catalog = exercises.filter(e => !e.personal), seen = new Set();
  return rows.map((row, index) => {
    const fail = message => { throw Error(`Вправа №${index + 1}: ${message}`); };
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('очікується об’єкт.');
    if (Object.keys(row).some(key => ![...fields,'id','archived'].includes(key))) fail('є невідомі поля. Використай формат експорту каталогу.');
    if (row.id !== undefined && (typeof row.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(row.id))) fail('некоректний ID.');
    if (row.archived !== undefined && typeof row.archived !== 'boolean') fail('archived має бути true або false.');
    if (targetId && row.id && row.id !== targetId) fail('ID не відповідає вибраній вправі.');
    let current;
    const id = targetId || row.id;
    if (id) {
      current = catalog.find(e => e.id === id);
      if (!current) fail('вправу з цим ID не знайдено. Для нової вправи прибери id.');
    } else {
      const matches = catalog.filter(e => normalize(e.name) === normalize(row.name));
      if (matches.length > 1) fail('знайдено кілька вправ із такою назвою. Вкажи id з експорту.');
      current = matches[0];
    }
    const key = current ? `id:${current.id}` : `name:${normalize(row.name)}`;
    if (seen.has(key)) fail('ця вправа повторюється у файлі.');
    seen.add(key);
    const merged = Object.fromEntries(fields.filter(key => current?.[key] !== undefined).map(key => [key,current[key]]));
    for (const key of fields) if (Object.hasOwn(row,key)) merged[key] = row[key];
    let data;
    try { data = exerciseData(merged); } catch (error) { fail(error.message); }
    data.archived = row.archived ?? current?.archived ?? false;
    const changed = current ? [...fields,'archived'].filter(key => (current[key] ?? (key === 'archived' ? false : '')) !== data[key]) : fields.filter(key=>data[key]);
    return { id:current?.id || '', action:current ? changed.length ? 'update' : 'unchanged' : 'create', data, changed };
  });
}
