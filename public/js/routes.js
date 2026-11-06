export const appBase = new URL('../', import.meta.url);
export function profileNumber(path) {
  return /\/(?:public\/)?u\/([1-9][0-9]{0,11})\/?$/.exec(path)?.[1] || '';
}
export function profileURL(number, base = appBase) {
  if (!/^[1-9][0-9]{0,11}$/.test(String(number))) throw Error('Некоректний ID профілю.');
  return new URL(`u/${number}`, base).href;
}
