export function ratingValue(value) {
  if (value === "" || value === null) return null;
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 5) throw Error("Оцінка має бути від 0 до 5.");
  return score;
}
export function ratingSummary(ratings) {
  const scores = ratings.map((r) => r.score).filter((s) => Number.isInteger(s) && s >= 0 && s <= 5);
  return { count: scores.length, average: scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null };
}
export function commentText(value) {
  const text = String(value ?? "").trim();
  if (!text || text.length > 2000) throw Error("Коментар має містити від 1 до 2000 символів.");
  return text;
}

export const reactions = { like: '👍', love: '❤️', fire: '🔥', strong: '💪', laugh: '😂', dislike: '👎', wow: '😮', adore: '🥰', giggle: '🤭', angry: '😡', thinking: '🤔' };
export const reactionLabels = { like:'Подобається', love:'Любов', fire:'Вогонь', strong:'Сила', laugh:'Сміх', dislike:'Дизлайк', wow:'Вау', adore:'Люблю', giggle:'Хіхі', angry:'Злий', thinking:'Задумливий' };
export function reviewScore(value) {
  const score = ratingValue(value);
  if (score === null || score < 1) throw Error('Обери оцінку від 1 до 5 зірок перед публікацією коментаря.');
  return score;
}
export function reactionSummary(entries, uid) {
  const counts = Object.fromEntries(Object.keys(reactions).map(key => [key, 0]));
  for (const entry of entries) if (Object.hasOwn(counts, entry.kind)) counts[entry.kind]++;
  return { counts, mine: entries.find(entry => entry.id === uid)?.kind || '', entries: entries.filter(entry=>Object.hasOwn(reactions,entry.kind)).sort((a,b)=>timestampMillis(b.createdAt)-timestampMillis(a.createdAt)) };
}
function timestampMillis(value){
  return typeof value?.toMillis==='function'?value.toMillis():typeof value?.seconds==='number'?value.seconds*1000:typeof value==='number'?value:Date.parse(value)||0;
}
export async function commentPhoto(file) {
  if (!file?.size) return '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10000000)
    throw Error('Обери JPG, PNG або WebP розміром до 10 МБ.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.65, 0.45, 0.25]) {
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.length <= 480000) return data;
    }
    throw Error('Фото завелике. Обери менше зображення.');
  } finally { bitmap.close(); }
}
