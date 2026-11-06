export function tagData(input) {
  if (!Array.isArray(input) || input.length > 5) throw Error('Можна видати до 5 тегів користувачу.');
  return input.map((tag) => {
    const text = typeof tag?.text === 'string' ? tag.text.trim() : '';
    if (!text || text.length > 40 || !/^#[0-9a-fA-F]{6}$/.test(tag.color) || !/^#[0-9a-fA-F]{6}$/.test(tag.textColor))
      throw Error('Вкажи текст тегу до 40 символів та кольори фону й тексту.');
    return { text, color: tag.color.toLowerCase(), textColor: tag.textColor.toLowerCase() };
  });
}
