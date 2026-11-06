export const appearanceDefaults={mode:'solid',background:'#edf2ff',backgroundEnd:'#e3f5ed',blocks:'#ffffff',text:'#202534',angle:135,image:''};
export function profileAppearance(value={}) {
  const data={...appearanceDefaults,...value};
  if(!['solid','gradient','dynamic','image'].includes(data.mode)||!['background','backgroundEnd','blocks','text'].every(key=>/^#[0-9a-fA-F]{6}$/.test(data[key]))||!Number.isInteger(data.angle)||data.angle<0||data.angle>360||typeof data.image!=='string'||data.image.length>300000||(data.image&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)))throw Error('Перевір кольори та фонове зображення.');
  return Object.fromEntries(Object.keys(appearanceDefaults).map(key=>[key,data[key]]));
}
export function appearanceStyle(value) {
  const a=profileAppearance(value);
  const bg=a.mode==='image'&&a.image?`url('${a.image}')`:['gradient','dynamic'].includes(a.mode)?`linear-gradient(${a.angle}deg,${a.background},${a.backgroundEnd},${a.background})`:a.background;
  return `--profile-background:${bg};--panel:${a.blocks};--text:${a.text};--muted:color-mix(in srgb,${a.text} 68%,${a.blocks});--bg:${a.blocks};--line:color-mix(in srgb,${a.text} 18%,${a.blocks});`;
}

export function applyProfilePageAppearance(value, doc = document) {
  const main = doc.querySelector('main.main');
  const keys = ['--profile-background','--panel','--text','--muted','--bg','--line'];
  main?.classList.remove('profile-page-custom');
  if (main) for (const key of keys) main.style.removeProperty(key);
  doc.body.style.removeProperty('--profile-page-background');
  delete doc.body.dataset.background;
  if (doc.body.dataset.page !== 'profile' || !value) return;
  const appearance = profileAppearance(value);
  const style = doc.createElement('div').style;
  style.cssText = appearanceStyle(appearance);
  doc.body.style.setProperty('--profile-page-background', style.getPropertyValue('--profile-background'));
  doc.body.dataset.background = appearance.mode;
  if (main) {
    main.classList.add('profile-page-custom');
    for (const key of keys) main.style.setProperty(key, style.getPropertyValue(key));
  }
}
