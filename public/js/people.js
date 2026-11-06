import { cropRectangle } from './profile-image-editor.js';
export function avatarSource(value) {
  if (typeof value !== 'string') return '';
  if (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 180000) return value;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
export function publicProfileData(profile) {
  return { name: String(profile.name || 'Спортсмен').slice(0, 100),
    photo: avatarSource(profile.photo), customId: profile.customId, joinedAt: profile.createdAt };
}
export function contactURL(network, input) {
  let handle = String(input || '').trim();
  if (!handle) return '';
  const instagram = network === 'instagram';
  if (!instagram && network !== 'telegram') throw Error('Невідома мережа.');
  if (/^(?:https?:\/\/|www\.|instagram\.com\/|t\.me\/|telegram\.me\/)/i.test(handle)) {
    let url;
    try { url = new URL(/^https?:\/\//i.test(handle) ? handle : `https://${handle}`); } catch { throw Error('Перевір посилання на профіль.'); }
    const hosts = instagram ? ['instagram.com', 'www.instagram.com'] : ['t.me', 'telegram.me'];
    if (!hosts.includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || !['http:', 'https:'].includes(url.protocol))
      throw Error('Вкажи посилання саме на Instagram або Telegram.');
    handle = url.pathname.replace(/^\//, '').replace(/\/$/, '');
  } else handle = handle.replace(/^@/, '');
  if (!(instagram ? /^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/ : /^[A-Za-z][A-Za-z0-9_]{4,31}$/).test(handle))
    throw Error(instagram ? 'Перевір Instagram: до 30 латинських літер, цифр, крапок або _.' : 'Перевір Telegram: username із 5–32 латинських літер, цифр або _, починається з літери.');
  return `https://${instagram ? 'instagram.com' : 't.me'}/${handle}`;
}
export function bannerSource(value) {
  return typeof value === 'string' && value.length <= 480000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
}
export const prepareAvatar = (file, crop) => prepareProfileImage(file, 256, 256, 180000, crop);
export const prepareBanner = (file, crop) => prepareProfileImage(file, 1200, 320, 480000, crop);
export const prepareProfileBackground = file => prepareProfileImage(file,1440,1080,300000);
async function prepareProfileImage(file, width, height, maxLength, crop) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10000000)
    throw Error('Обери JPG, PNG або WebP розміром до 10 МБ.');
  const bitmap = await createImageBitmap(file).catch(() => { throw Error('Не вдалося прочитати фото. Обери інший JPG, PNG або WebP.'); });
  try {
    if (!bitmap.width || !bitmap.height) throw Error('Не вдалося прочитати зображення.');
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    const rect = cropRectangle(bitmap.width, bitmap.height, width, height, crop);
    context.drawImage(bitmap, rect.left, rect.top, rect.width, rect.height, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let transparent = false;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] < 255) { transparent = true; break; }
    if (transparent) {
      const png = canvas.toDataURL('image/png');
      if (png.length <= maxLength) return png;
    }
    for (const quality of [0.9, 0.75, 0.55, 0.35]) {
      const photo = canvas.toDataURL(transparent ? 'image/webp' : 'image/jpeg', quality);
      if (photo.length <= maxLength && (!transparent || /^data:image\/(?:png|webp);/.test(photo))) return photo;
    }
    throw Error('Зображення завелике. Обери інше фото.');
  } finally { bitmap.close(); }
}
