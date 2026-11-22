export const appearanceDefaults = {
  mode:'solid', background:'#edf2ff', backgroundEnd:'#e3f5ed', blocks:'#ffffff', text:'#202534', angle:135, image:'',
  accent:'#2563eb', buttonText:'#ffffff', buttonStyle:'solid', buttonShape:'rounded', buttonSize:'normal',
  cardShape:'rounded', cardShadow:'soft', cardBorder:'subtle', font:'system', textSize:'normal',
  avatarShape:'rounded', avatarRing:'none', coverSize:'normal', heroAlign:'left', layout:'right', density:'normal',
  pattern:'none', surface:'solid', coverStyle:'classic', avatarSize:'normal', nameStyle:'normal',
  imagePosition:'center', hoverEffect:'none', motion:'full',
  headerMode:'default',headerBackground:'#ffffff',headerAccent:'#2563eb',headerSurface:'solid',headerShape:'rounded',headerTitle:'Nexus GymB',
};
export const appearanceColors = ['background','backgroundEnd','blocks','text','accent','buttonText','headerBackground','headerAccent'];
export const appearanceChoices = {
  headerMode:[['default','Стандартний'],['profile','Палітра профілю'],['custom','Власні кольори']],
  headerSurface:[['solid','Суцільний'],['glass','Скло'],['gradient','М’який градієнт']],
  headerShape:[['rounded','Заокруглений'],['pill','Капсула'],['square','Майже прямі кути']],
  mode:[['solid','Статичний колір'],['gradient','Градієнт'],['dynamic','Рухомий градієнт'],['image','Зображення']],
  buttonStyle:[['solid','Заливка'],['outline','Контур'],['soft','М’який фон']],
  buttonShape:[['rounded','Заокруглені'],['pill','Капсули'],['square','Майже прямі']],
  buttonSize:[['normal','Звичайні'],['large','Збільшені']],
  cardShape:[['rounded','Заокруглені'],['soft','Злегка округлені'],['square','Майже прямі']],
  cardShadow:[['none','Без тіні'],['soft','Легка тінь'],['deep','Виразна тінь']],
  cardBorder:[['subtle','Тонкий контур'],['accent','Акцентний контур'],['none','Без контуру']],
  font:[['system','Системний'],['rounded','М’який'],['serif','Класичний'],['mono','Моноширинний']],
  textSize:[['normal','Звичайний'],['large','Збільшений']],
  avatarShape:[['rounded','Заокруглений квадрат'],['circle','Коло'],['square','Квадрат']],
  avatarRing:[['none','Без обрамлення'],['accent','Кольорове кільце'],['double','Подвійне кільце']],
  coverSize:[['compact','Низький'],['normal','Звичайний'],['tall','Високий']],
  heroAlign:[['left','Ліворуч'],['center','По центру']],
  layout:[['right','Бічна колонка праворуч'],['left','Бічна колонка ліворуч'],['single','Одна колонка']],
  density:[['normal','Більше простору'],['compact','Компактніше']],
  pattern:[['none','Без візерунка'],['dots','Крапки'],['grid','Сітка'],['diagonal','Діагональні лінії']],
  surface:[['solid','Суцільні'],['tinted','З акцентним відтінком'],['glass','Напівпрозоре скло']],
  coverStyle:[['classic','Класичний'],['gradient','Градієнт'],['aurora','Сяйво'],['lines','Геометрія'],['solid','Один колір']],
  avatarSize:[['small','Компактний'],['normal','Звичайний'],['large','Великий']],
  nameStyle:[['normal','Звичайне'],['accent','Акцентний колір'],['gradient','Градієнтне']],
  imagePosition:[['top','Верх'],['center','Центр'],['bottom','Низ']],
  hoverEffect:[['none','Без ефекту'],['lift','Легке підняття'],['glow','Світіння']],
  motion:[['full','Звичайна'],['gentle','Повільна'],['none','Без анімації']],
};
export const appearancePresets = [
  {id:'blue',name:'Блакитний',values:{...appearanceDefaults,mode:'gradient'}},
  {id:'forest',name:'Лісовий',values:{...appearanceDefaults,mode:'gradient',background:'#e4f0e8',backgroundEnd:'#c9e7d7',blocks:'#fbfefb',text:'#183b30',accent:'#237458',buttonShape:'pill',font:'rounded'}},
  {id:'night',name:'Нічний',values:{...appearanceDefaults,mode:'gradient',background:'#101827',backgroundEnd:'#203454',blocks:'#192438',text:'#e7eefb',accent:'#8ab4ff',buttonText:'#14233d',cardShadow:'deep'}},
  {id:'violet',name:'Фіолетовий',values:{...appearanceDefaults,mode:'gradient',background:'#eee9ff',backgroundEnd:'#f7e3f0',blocks:'#fffaff',text:'#392653',accent:'#7949cb',buttonShape:'pill',avatarShape:'circle'}},
  {id:'ember',name:'Теплий',values:{...appearanceDefaults,mode:'gradient',background:'#fff0e7',backgroundEnd:'#fce0da',blocks:'#fffaf5',text:'#4b2a23',accent:'#b94b2f',cardShape:'soft',font:'serif'}},
  {id:'mono',name:'Мінімал',values:{...appearanceDefaults,background:'#eeeeef',blocks:'#ffffff',text:'#252527',accent:'#333338',buttonStyle:'outline',buttonShape:'square',cardShape:'square',cardShadow:'none',avatarShape:'square'}},
  {id:'aurora',name:'Сяйво',values:{...appearanceDefaults,mode:'dynamic',background:'#111c32',backgroundEnd:'#263d50',blocks:'#192b40',text:'#ecf6ff',accent:'#76e0c2',buttonText:'#112c29',surface:'glass',coverStyle:'aurora',nameStyle:'gradient',avatarShape:'circle',avatarRing:'accent',hoverEffect:'glow',motion:'gentle'}},
  {id:'studio',name:'Студія',values:{...appearanceDefaults,background:'#f0f1f8',blocks:'#ffffff',text:'#292943',accent:'#6255c4',pattern:'dots',coverStyle:'lines',surface:'tinted',avatarSize:'large',nameStyle:'accent',buttonShape:'pill',hoverEffect:'lift'}},
];
export function profileAppearance(value = {}) {
  const data = {...appearanceDefaults,...value};
  if (!appearanceColors.every(key=>/^#[0-9a-fA-F]{6}$/.test(data[key])) ||
      !Object.entries(appearanceChoices).every(([key,choices])=>choices.some(([id])=>data[key] === id)) ||
      typeof data.headerTitle!=='string' || !data.headerTitle.trim() || data.headerTitle.trim().length>32 || /[\u0000-\u001f\u007f]/.test(data.headerTitle) ||
      !Number.isInteger(data.angle) || data.angle < 0 || data.angle > 360 || typeof data.image !== 'string' ||
      data.image.length > 300000 || data.image && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image))
    throw Error('Перевір кольори, параметри оформлення та фонове зображення.');
  return Object.fromEntries(Object.keys(appearanceDefaults).map(key=>[key,key==='headerTitle'?data[key].trim():data[key]]));
}
const fonts = {system:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',rounded:'"Trebuchet MS","Segoe UI",sans-serif',serif:'Georgia,"Times New Roman",serif',mono:'ui-monospace,Consolas,monospace'};
function appearanceVariables(value) {
  const a = profileAppearance(value), mix = `color-mix(in srgb,${a.accent} 12%,${a.blocks})`;
  return {
    '--profile-background':a.mode === 'image' && a.image ? `url('${a.image}')` : ['gradient','dynamic'].includes(a.mode) ? `linear-gradient(${a.angle}deg,${a.background},${a.backgroundEnd},${a.background})` : a.background,
    '--panel':a.surface === 'glass' ? `color-mix(in srgb,${a.blocks} 88%,transparent)` : a.surface === 'tinted' ? `color-mix(in srgb,${a.blocks} 94%,${a.accent})` : a.blocks,'--text':a.text,'--muted':`color-mix(in srgb,${a.text} 68%,${a.blocks})`,
    '--bg':a.blocks,'--line':`color-mix(in srgb,${a.text} 18%,${a.blocks})`,'--blue':a.accent,'--soft':mix,
    '--profile-accent':a.accent,'--profile-button-text':a.buttonText,
    '--profile-button-bg':a.buttonStyle === 'solid' ? a.accent : a.buttonStyle === 'soft' ? mix : 'transparent',
    '--profile-button-fg':a.buttonStyle === 'solid' ? a.buttonText : a.accent,
    '--profile-button-border':a.buttonStyle === 'outline' ? a.accent : 'transparent',
    '--profile-button-radius':{rounded:'14px',pill:'999px',square:'5px'}[a.buttonShape],
    '--profile-button-height':a.buttonSize === 'large' ? '52px' : '44px',
    '--profile-card-radius':{rounded:'24px',soft:'14px',square:'5px'}[a.cardShape],
    '--profile-card-shadow':{none:'none',soft:'0 6px 26px #00000009',deep:'0 14px 38px #00000020'}[a.cardShadow],
    '--profile-card-border':a.cardBorder === 'none' ? 'transparent' : a.cardBorder === 'accent' ? a.accent : `color-mix(in srgb,${a.text} 18%,${a.blocks})`,
    '--profile-font':fonts[a.font],'--profile-body-size':a.textSize === 'large' ? '18px' : '16px',
    '--profile-avatar-radius':{rounded:'26%',circle:'50%',square:'5px'}[a.avatarShape],
    '--profile-avatar-ring':{none:'0 8px 24px #152b4920',accent:`0 0 0 3px ${a.accent}`,double:`0 0 0 3px ${a.blocks},0 0 0 6px ${a.accent}`}[a.avatarRing],
    '--profile-cover-height':{compact:'120px',normal:'200px',tall:'280px'}[a.coverSize],
    '--profile-card-padding':a.density === 'compact' ? '18px' : '28px',
    '--profile-section-gap':a.density === 'compact' ? '14px' : '24px',
    '--profile-avatar-size':{small:'104px',normal:'136px',large:'164px'}[a.avatarSize],
    '--profile-avatar-mobile':{small:'78px',normal:'90px',large:'112px'}[a.avatarSize],
    '--profile-avatar-preview':{small:'54px',normal:'64px',large:'80px'}[a.avatarSize],
    '--profile-image-position':a.imagePosition,
    '--profile-motion-duration':a.motion === 'gentle' ? '36s' : '18s',
    '--profile-pattern':{none:'none',dots:`radial-gradient(color-mix(in srgb,${a.accent} 22%,transparent) 1px,transparent 1.5px)`,grid:`linear-gradient(color-mix(in srgb,${a.accent} 10%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,${a.accent} 10%,transparent) 1px,transparent 1px)`,diagonal:`repeating-linear-gradient(135deg,transparent 0 16px,color-mix(in srgb,${a.accent} 9%,transparent) 16px 17px,transparent 17px 32px)`}[a.pattern],
    '--profile-cover-gradient':`linear-gradient(${a.angle}deg,${a.accent},${a.backgroundEnd})`,
  };
}
export function appearanceStyle(value) { return Object.entries(appearanceVariables(value)).map(([key,value])=>`${key}:${value};`).join(''); }
export function appearanceData(value) {
  const a = profileAppearance(value);
  return {'background':a.mode,'layout':a.layout,'hero-align':a.heroAlign,'density':a.density,'pattern':a.pattern,'surface':a.surface,'cover-style':a.coverStyle,'name-style':a.nameStyle,'hover-effect':a.hoverEffect,'motion':a.motion};
}
export function readableText(color) {
  const rgb = color.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
  const luminance = .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  return (luminance+.05)/.05 >= 1.05/(luminance+.05) ? '#101820' : '#ffffff';
}
export function profileHeaderAppearance(value) {
  const a=profileAppearance(value);
  if(a.headerMode==='default')return null;
  const bg=a.headerMode==='profile'?a.blocks:a.headerBackground,accent=a.headerMode==='profile'?a.accent:a.headerAccent;
  const fg=readableText(bg),linear=color=>color.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const l1=linear(bg),l2=linear(accent),contrast=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  const ink=contrast>=4.5?accent:fg;
  return {title:a.headerTitle,surface:a.headerSurface,shape:a.headerShape,variables:{
    '--panel':bg,'--text':fg,'--blue':ink,'--muted':`color-mix(in srgb,${fg} 72%,${bg})`,
    '--bg':`color-mix(in srgb,${fg} 5%,${bg})`,'--soft':`color-mix(in srgb,${fg} 9%,${bg})`,'--line':`color-mix(in srgb,${fg} 20%,${bg})`,
    '--profile-header-background':a.headerSurface==='gradient'?`linear-gradient(115deg,${bg},color-mix(in srgb,${accent} 12%,${bg}))`:a.headerSurface==='glass'?`color-mix(in srgb,${bg} 96%,transparent)`:bg,
    '--profile-header-radius':{rounded:'22px',pill:'36px',square:'7px'}[a.headerShape],
  }};
}
export function applyProfileHeaderAppearance(value,doc=document) {
  const header=doc.querySelector('#site-header');if(!header)return;
  const keys=Object.keys(profileHeaderAppearance({...appearanceDefaults,headerMode:'custom'}).variables);
  for(const key of keys)header.style.removeProperty(key);
  delete header.dataset.profileHeader;delete header.dataset.headerSurface;delete header.dataset.headerShape;
  const brand=header.querySelector('.header-inner>.brand');if(brand){brand.textContent='Nexus GymB';brand.setAttribute('aria-label','Nexus GymB — головна');}
  if(doc.body.dataset.page!=='profile'||!value)return;
  let appearance;try{appearance=profileHeaderAppearance(value);}catch{return;}
  if(!appearance)return;
  header.dataset.profileHeader='';header.dataset.headerSurface=appearance.surface;header.dataset.headerShape=appearance.shape;
  for(const [key,value]of Object.entries(appearance.variables))header.style.setProperty(key,value);
  if(brand){brand.textContent=appearance.title;brand.setAttribute('aria-label',`${appearance.title} — головна`);}
}
export function applyProfilePageAppearance(value, doc = document) {
  applyProfileHeaderAppearance(value,doc);
  const main = doc.querySelector('main.main'), keys = Object.keys(appearanceVariables(appearanceDefaults));
  main?.classList.remove('profile-page-custom');
  if (main) for (const key of keys) main.style.removeProperty(key);
  doc.body.style.removeProperty('--profile-page-background');
  doc.body.style.removeProperty('--profile-motion-duration');
  doc.body.style.removeProperty('--profile-image-position');
  delete doc.body.dataset.background;
  delete doc.body.dataset.profileMotion;
  if (doc.body.dataset.page !== 'profile' || !value) return;
  let a;try{a=profileAppearance(value);}catch{return;}
  const variables = appearanceVariables(a);
  doc.body.style.setProperty('--profile-page-background',variables['--profile-background']);
  doc.body.dataset.background = a.mode;
  doc.body.dataset.profileMotion = a.motion;
  doc.body.style.setProperty('--profile-motion-duration',variables['--profile-motion-duration']);
  doc.body.style.setProperty('--profile-image-position',a.imagePosition);
  if (main) {
    main.classList.add('profile-page-custom');
    for (const [key,value] of Object.entries(variables)) main.style.setProperty(key,value);
  }
}
