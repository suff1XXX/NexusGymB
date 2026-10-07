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
