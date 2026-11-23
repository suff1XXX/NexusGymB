const storageKey='nexus:auth-language';
const copy={
  uk:{
    pageTitle:'Вхід та реєстрація',login:'Вхід',register:'Реєстрація',welcome:'З поверненням.',create:'Почнемо твою історію.',
    loginDescription:'Твій наступний крок починається тут.',registerDescription:'Створи акаунт і збери всі тренування в одному місці.',
    name:'Ім’я',namePlaceholder:'Як до тебе звертатися?',email:'Електронна пошта',password:'Пароль',confirm:'Повтори пароль',
    passwordPlaceholder:'Введи пароль',newPasswordPlaceholder:'Створи пароль',confirmPlaceholder:'Ще раз, для впевненості',
    show:'Показати пароль',hide:'Приховати пароль',signIn:'Увійти',signUp:'Створити акаунт',forgot:'Забули пароль?',
    passwordHint:'Щонайменше 8 символів. Після реєстрації підтвердь пошту.',language:'Вибрати мову',authLabel:'Вхід або реєстрація',
    eyebrow:'ТВІЙ ПРОСТІР ДЛЯ ТРЕНУВАНЬ',heroTop:'Твій ритм.',heroBottom:'Твій прогрес.',
    heroDescription:'Плануй тренування, записуй кожен підхід і помічай, як далеко ти вже зайшов.',
    featurePlan:'План під тебе',featureProgress:'Прогрес у деталях',featureFriends:'GymBro поруч',
    preview:'ТВІЙ ПРОГРЕС, НАОЧНО',previewTitle:'Кожен підхід має значення.',chartLabel:'Приклад щоденника тренувань',
    journal:'ЩОДЕННИК ТРЕНУВАНЬ',consistency:'Крок за кроком',workout:'Тренування',workoutName:'Твій наступний крок',
    sets:'Підходи',reps:'Повторення',ready:'Усе починається з тебе',footer:'Менше хаосу. Більше прогресу.',
    footerNote:'Твій особистий тренувальний простір.',verifyTitle:'Підтвердь пошту',verifyBefore:'Відкрий лист на',
    verifyAfter:'і натисни посилання. Потім повернися сюди.',yourEmail:'своїй пошті',verified:'Я підтвердив пошту',
    resend:'Надіслати лист повторно',logout:'Вийти',spam:'Якщо листа немає, перевір папку «Спам».',
    sent:'Лист надіслано. Перевір пошту та папку «Спам».',created:'Акаунт створено. Лист підтвердження надіслано.',
    connectionError:'Не вдалося підключитися. Перевір інтернет і спробуй ще раз.',retry:'Спробувати знову',connecting:'Зачекай на підключення.',
    enterName:'Вкажи своє ім’я.',passwordMismatch:'Паролі не збігаються.',notVerified:'Пошта ще не підтверджена. Відкрий посилання з листа.',
    resetTitle:'Перевір пошту',resetBefore:'Якщо для',resetAfter:'є обліковий запис, інструкцію для відновлення пароля надіслано на цю адресу.',
    resetHint:'Лист може надійти за кілька хвилин. Перевір також папку «Спам».',gotIt:'Зрозуміло',loading:'Завантаження Nexus GymB…',
    genericError:'Не вдалося виконати дію. Спробуй ще раз.',invalidEmail:'Перевір правильність email.',invalidCredential:'Неправильний email або пароль.',
    emailInUse:'Ця пошта вже зареєстрована. Увійди або віднови пароль.',weakPassword:'Використай довший пароль із великими й малими літерами, цифрою та символом.',
    tooMany:'Забагато спроб. Зачекай трохи та повтори.',disabled:'Цей обліковий запис вимкнений.',unavailable:'Вхід тимчасово недоступний. Спробуй пізніше.',
  },
  en:{
    pageTitle:'Sign in & create an account',login:'Sign in',register:'Sign up',welcome:'Welcome back.',create:'Start your story.',
    loginDescription:'Your next step starts right here.',registerDescription:'Create an account and keep every workout in one place.',
    name:'Your name',namePlaceholder:'What should we call you?',email:'Email address',password:'Password',confirm:'Confirm password',
    passwordPlaceholder:'Enter your password',newPasswordPlaceholder:'Create a password',confirmPlaceholder:'One more time, just to be sure',
    show:'Show password',hide:'Hide password',signIn:'Sign in',signUp:'Create account',forgot:'Forgot password?',
    passwordHint:'At least 8 characters. Verify your email after signing up.',language:'Choose language',authLabel:'Sign in or create an account',
    eyebrow:'YOUR SPACE TO TRAIN',heroTop:'Your rhythm.',heroBottom:'Your progress.',
    heroDescription:'Plan your workouts, log every set, and see just how far you’ve come.',
    featurePlan:'A plan for you',featureProgress:'Every detail counts',featureFriends:'Your GymBro, closer',
    preview:'YOUR PROGRESS, AT A GLANCE',previewTitle:'Every set tells a story.',chartLabel:'Example workout journal',
    journal:'WORKOUT JOURNAL',consistency:'One step at a time',workout:'Workout',workoutName:'Your next step',
    sets:'Sets',reps:'Reps',ready:'It starts with you',footer:'Less chaos. More progress.',
    footerNote:'Your personal training space.',verifyTitle:'Verify your email',verifyBefore:'Open the email sent to',
    verifyAfter:'and follow the link. Then come back here.',yourEmail:'your inbox',verified:'I’ve verified my email',
    resend:'Resend verification email',logout:'Sign out',spam:'Can’t find the email? Check your spam folder.',
    sent:'Email sent. Check your inbox and spam folder.',created:'Account created. Your verification email is on its way.',
    connectionError:'Couldn’t connect. Check your internet connection and try again.',retry:'Try again',connecting:'Please wait while we connect.',
    enterName:'Enter your name.',passwordMismatch:'Passwords don’t match.',notVerified:'Your email isn’t verified yet. Follow the link in your inbox.',
    resetTitle:'Check your inbox',resetBefore:'If an account exists for',resetAfter:'password reset instructions have been sent to that address.',
    resetHint:'The email may take a few minutes. Check your spam folder too.',gotIt:'Got it',loading:'Loading Nexus GymB…',
    genericError:'Something went wrong. Please try again.',invalidEmail:'Enter a valid email address.',invalidCredential:'Incorrect email or password.',
    emailInUse:'This email is already registered. Sign in or reset your password.',weakPassword:'Use a longer password with uppercase and lowercase letters, a number, and a symbol.',
    tooMany:'Too many attempts. Wait a little and try again.',disabled:'This account has been disabled.',unavailable:'Sign-in is temporarily unavailable. Please try again later.',
  },
};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function getAuthLanguage() {
  if (typeof document !== 'undefined' && document.body?.dataset.page !== 'login') return 'uk';
  if (memoryLanguage) return memoryLanguage;
  try { return localStorage.getItem(storageKey) === 'en' ? 'en' : 'uk'; } catch { return 'uk'; }
}
export function setAuthLanguage(language) {
  if (!['uk','en'].includes(language)) return;
  try { localStorage.setItem(storageKey,language); } catch {}
  // An in-memory fallback also supports browsers where storage is disabled.
  memoryLanguage=language;
}
let memoryLanguage=null;
export const authText=key=>copy[(typeof document === 'undefined' || document.body?.dataset.page === 'login') ? memoryLanguage || getAuthLanguage() : 'uk'][key] || copy.uk[key] || key;
export function authError(error) {
  const keys={
    'auth/invalid-email':'invalidEmail','auth/invalid-credential':'invalidCredential','auth/wrong-password':'invalidCredential','auth/user-not-found':'invalidCredential',
    'auth/email-already-in-use':'emailInUse','auth/weak-password':'weakPassword','auth/password-does-not-meet-requirements':'weakPassword',
    'auth/too-many-requests':'tooMany','auth/user-disabled':'disabled','auth/network-request-failed':'connectionError',
    'auth/operation-not-allowed':'unavailable','auth/unauthorized-continue-uri':'unavailable',
  };
  return error.authKey ? authText(error.authKey) : authText(keys[error.code] || 'genericError');
}
export function authFailure(key) { return Object.assign(Error(authText(key)),{authKey:key}); }

const globe='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>';
const flagUk='<svg viewBox="0 0 30 20" aria-hidden="true"><path fill="#063b87" d="M0 0h30v20H0z"/><path stroke="#fff" stroke-width="5" d="m0 0 30 20m0-20L0 20"/><path stroke="#e52b40" stroke-width="2" d="m0 0 30 20m0-20L0 20"/><path fill="#fff" d="M12 0h6v20h-6zM0 6h30v8H0z"/><path fill="#e52b40" d="M13 0h4v20h-4zM0 8h30v4H0z"/></svg>';
const flagUa='<svg viewBox="0 0 30 20" aria-hidden="true"><path fill="#0879df" d="M0 0h30v10H0z"/><path fill="#ffd51d" d="M0 10h30v10H0z"/></svg>';
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const eye='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
function languageMenu() {
  const language=memoryLanguage || getAuthLanguage();
  return `<details class="auth-language"><summary aria-label="${authText('language')}" aria-expanded="false" aria-controls="auth-language-menu" aria-haspopup="menu">${globe}<span data-auth-language-code>${language === 'en'?'EN':'UK'}</span></summary><div id="auth-language-menu" role="menu" aria-label="${authText('language')}">${[['uk','Українська',flagUa],['en','English',flagUk]].map(([code,label,flag])=>`<button type="button" role="menuitemradio" aria-checked="${language === code}" data-auth-language="${code}"><span class="auth-flag">${flag}</span><span>${label}</span><span class="auth-language-check" aria-hidden="true">${language === code?'✓':''}</span></button>`).join('')}</div></details>`;
}
export function renderAuthPanel({mode='login',draft={},notice='',user=null,connected=false}) {
  const t=authText;
  const message=notice?`<div class="notice" role="status">${escape(t(notice))}</div>`:'';
  if (user && !user.emailVerified) return `<section class="auth-panel"><div class="auth-verification-icon" aria-hidden="true">${globe}</div><h1 tabindex="-1">${t('verifyTitle')}</h1><p class="auth-description">${t('verifyBefore')} <strong>${escape(user.email || t('yourEmail'))}</strong> ${t('verifyAfter')}</p>${message}<div class="stack"><button class="btn wide" data-action="check-email">${t('verified')}</button><button class="btn secondary wide" data-action="resend-email">${t('resend')}</button><button class="btn ghost wide" data-action="logout">${t('logout')}</button></div><p class="auth-footnote">${t('spam')}</p></section>`;
  const register=mode === 'register';
  const passwordField=(name,label,placeholder)=>`<label class="auth-field auth-password-field"><span>${label}</span><span class="auth-input-wrap"><input type="password" name="${name}" placeholder="${placeholder}" autocomplete="${register?'new-password':'current-password'}" ${register?'minlength="8"':''} maxlength="4096" value="${escape(draft[name] || '')}" required /><button type="button" class="auth-password-toggle" data-action="toggle-auth-password" aria-label="${t('show')}" aria-pressed="false">${eye}</button></span></label>`;
  return `<section class="auth-panel"><div class="auth-tabs" aria-label="${t('authLabel')}"><span class="auth-tab-indicator" aria-hidden="true" style="transform:translateX(${register?'100%':'0'})"></span>${[['login',t('login')],['register',t('register')]].map(([value,label])=>`<button type="button" class="btn ghost" data-action="auth-mode" data-id="${value}" aria-pressed="${value === mode}">${label}</button>`).join('')}</div><div class="auth-heading"><span class="auth-card-eyebrow">NEXUS GYMB / ${t('journal')}</span><h1 tabindex="-1">${register?t('create'):t('welcome')}</h1><p class="auth-description">${register?t('registerDescription'):t('loginDescription')}</p></div>${message}<form id="auth-form">${register?`<label class="auth-field"><span>${t('name')}</span><input name="name" autocomplete="name" value="${escape(draft.name)}" maxlength="100" placeholder="${t('namePlaceholder')}" required /></label>`:''}<label class="auth-field"><span>${t('email')}</span><input type="email" name="email" autocomplete="email" value="${escape(draft.email)}" maxlength="320" placeholder="you@example.com" required /></label>${passwordField('password',t('password'),register?t('newPasswordPlaceholder'):t('passwordPlaceholder'))}${register?passwordField('confirm',t('confirm'),t('confirmPlaceholder')):''}${register?`<p class="auth-password-hint">${t('passwordHint')}</p>`:`<button type="button" class="auth-link" data-action="reset-password" ${connected?'':'disabled'}>${t('forgot')}</button>`}<button type="submit" class="btn wide auth-submit" ${connected?'':'disabled'}><span>${register?t('signUp'):t('signIn')}</span>${arrow}</button><div class="form-error" role="alert"></div></form><p class="auth-footnote"><span aria-hidden="true">✦</span> ${t('ready')}</p></section>`;
}
function renderShell(brand) {
  const t=authText;
  return `<main class="login"><div class="auth-atmosphere" aria-hidden="true"><i></i><i></i><div class="auth-grid"></div></div><header class="auth-header"><a class="brand auth-brand" href="index.html" aria-label="Nexus GymB">${brand}</a>${languageMenu()}</header><div class="auth-layout"><aside class="auth-intro"><span class="auth-eyebrow"><i aria-hidden="true"></i>${t('eyebrow')}</span><h2>${t('heroTop')}<br><em>${t('heroBottom')}</em></h2><p>${t('heroDescription')}</p><div class="auth-features"><span>${t('featurePlan')}</span><span>${t('featureProgress')}</span><span>${t('featureFriends')}</span></div><div class="auth-visual" role="img" aria-label="${t('chartLabel')}"><div class="auth-visual-top"><span><i class="auth-live-dot"></i>${t('preview')}</span><span class="auth-chart-icon" aria-hidden="true">↗</span></div><h3>${t('previewTitle')}</h3><div class="auth-chart" aria-hidden="true">${[24,38,32,51,60,54,78,100].map((height,k)=>`<i style="--bar-height:${height}%;--bar-delay:${k*45}ms"></i>`).join('')}</div><div class="auth-visual-bottom"><span>${t('consistency')}</span><span>Nexus GymB</span></div><div class="auth-floating-note"><span class="auth-note-icon" aria-hidden="true">✓</span><span><strong>${t('workoutName')}</strong><small>${t('sets')} · ${t('reps')} · ${t('workout')}</small></span></div></div></aside><section class="auth-card is-entering" aria-label="${t('authLabel')}"><div id="auth-content"></div><div id="login-error" role="alert"></div></section></div><footer class="auth-footer"><span>${t('footer')}</span><span>${t('footerNote')}</span></footer></main>`;
}
function captureDraft(root,draft) {
  const form=root.querySelector('#auth-form');
  if (form) for (const key of ['name','email','password','confirm']) if (form.elements[key]) draft[key]=form.elements[key].value;
}
export function mountAuthPage(root,state,{brand='',animate=false,onLanguage=()=>{}}={}) {
  captureDraft(root,state.draft);
  const focus=root.contains(document.activeElement)?document.activeElement:null;
  const focusName=focus?.getAttribute('name');
  const selection=focusName && typeof focus.selectionStart === 'number'?[focus.selectionStart,focus.selectionEnd]:null;
  const old=root.querySelector('#auth-content'),oldMode=old?.dataset.mode,oldHeight=old?.getBoundingClientRect().height || 0;
  // Keep the page shell on mode changes; language changes also replace translated copy.
  const language=memoryLanguage || getAuthLanguage();
  if (!old || root.dataset.authLocale !== language) {
    root.innerHTML=renderShell(brand);root.dataset.authLocale=language;
  }
  if (old) root.querySelector('.auth-card').classList.remove('is-entering');
  const content=root.querySelector('#auth-content');
  content.getAnimations().forEach(animation=>animation.cancel());
  content.innerHTML=`<div class="auth-content-inner">${renderAuthPanel(state)}</div>`;
  content.dataset.mode=state.mode;
  root.querySelector('.auth-card').setAttribute('aria-label',authText('authLabel'));
  root.querySelector('#login-error').innerHTML=state.bootError?`<div class="error">${authText('connectionError')}<button class="btn secondary" data-action="retry">${authText('retry')}</button></div>`:'';
  if (document.body.dataset.page === 'login') {
    document.documentElement.lang=language;
    document.querySelector('meta[name="description"]')?.setAttribute('content',authText('heroDescription'));
    document.title=`${state.user && !state.user.emailVerified?authText('verifyTitle'):state.mode === 'register'?authText('register'):authText('login')} — Nexus GymB`;
  }
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduced && typeof content.animate === 'function') {
    const height=content.getBoundingClientRect().height;
    content.style.overflow='clip';
    const size=content.animate([{height:`${oldHeight}px`},{height:`${height}px`}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
    size.finished.catch(()=>{}).then(()=>{if(!content.getAnimations().length)content.style.overflow='';});
    content.firstElementChild.animate([{opacity:0,transform:`translateX(${state.mode === 'register'?12:-12}px)`},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'ease-out'});
    const indicator=content.querySelector('.auth-tab-indicator');
    if (indicator && oldMode !== state.mode) indicator.animate([{transform:`translateX(${oldMode === 'register'?'100%':'0'})`},{transform:`translateX(${state.mode === 'register'?'100%':'0'})`}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  if (focusName) {
    const input=content.querySelector(`[name="${focusName}"]`);input?.focus({preventScroll:true});
    if (selection && input && input.type !== 'email') input.setSelectionRange(...selection);
  }
  if (!root.dataset.authEvents) {
    root.dataset.authEvents='true';
    root.addEventListener('click',event=>{
      const option=event.target.closest('button[data-auth-language]');
      if (!option) return;
      setAuthLanguage(option.dataset.authLanguage);onLanguage();
      root.querySelector('.auth-language').open=false;root.querySelector('.auth-language summary').focus();
    });
    root.addEventListener('toggle',event=>{if(event.target.matches('.auth-language'))event.target.querySelector('summary').setAttribute('aria-expanded',String(event.target.open));},true);
    document.addEventListener('click',event=>{const menu=root.querySelector('.auth-language');if(menu?.open && !menu.contains(event.target))menu.open=false;});
    root.addEventListener('keydown',event=>{
      const menu=event.target.closest('.auth-language');if(!menu)return;
      const options=[...menu.querySelectorAll('[role="menuitemradio"]')],index=options.indexOf(document.activeElement);
      if(event.key==='Escape'){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();menu.open=true;
        const next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?(index+1)%options.length:(index<0?options.length-1:(index-1+options.length)%options.length);
        options[next].focus();
      }
    });
  }
}
