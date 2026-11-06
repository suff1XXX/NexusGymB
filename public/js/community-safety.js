export const reportReasons = { abuse: 'Образи або цькування', spam: 'Спам', impersonation: 'Видає себе за іншу людину', other: 'Інше' };
export function reportData(reason, detail) {
  const text = String(detail || '').trim();
  if (!Object.hasOwn(reportReasons, reason) || text.length > 1000) throw Error('Обери причину та опиши її до 1000 символів.');
  return { reason, detail: text };
}
