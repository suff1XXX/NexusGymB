// Keep cache updates and a visible startup error independent of app.js parsing.
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('../sw.js',import.meta.url)).catch(error=>console.warn('Service worker:',error));
}
import('./app.js').catch(error=>{
  console.error('Nexus GymB startup failed:',error);
  let english=false;
  try {english=localStorage.getItem('nexus:language')==='en';}catch{}
  const root=document.getElementById('app');
  if(!root)return;
  const main=document.createElement('main');main.className='main';
  const card=document.createElement('section');card.className='card';card.setAttribute('role','alert');
  const title=document.createElement('h1');title.textContent=english?'Could not start Nexus GymB':'Не вдалося запустити Nexus GymB';
  const message=document.createElement('p');message.textContent=english?'Refresh the page to load the latest version.':'Онови сторінку, щоб завантажити актуальну версію.';
  const reload=document.createElement('button');reload.type='button';reload.className='btn';reload.textContent=english?'Refresh page':'Оновити сторінку';reload.addEventListener('click',()=>location.reload());
  card.append(title,message,reload);main.append(card);root.replaceChildren(main);
});
