export const musicServices = {
  spotify: { name: 'Spotify', example: 'https://open.spotify.com/playlist/…' },
  appleMusic: { name: 'Apple Music', example: 'https://music.apple.com/ua/playlist/…/pl.…' },
  soundcloud: { name: 'SoundCloud', example: 'https://soundcloud.com/username/sets/playlist' },
};
export function playlistURL(service, value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length > 500) throw Error('Посилання на плейліст має бути до 500 символів.');
  let url;
  try { url = new URL(text); } catch { throw Error('Встав повне HTTPS-посилання на плейліст.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || /[\u0000-\u0020\\]/.test(text)) throw Error('Встав звичайне HTTPS-посилання на плейліст.');
  let path = url.pathname.replace(/\/$/, ''), host = url.hostname;
  if (service === 'spotify' && host === 'open.spotify.com') {
    path = path.replace(/^\/(?:intl-[a-z]{2}|embed)\//, '/');
    if (/^\/playlist\/[A-Za-z0-9]{22}$/.test(path)) return `https://open.spotify.com${path}`;
  }
  if (service === 'appleMusic' && ['music.apple.com', 'embed.music.apple.com'].includes(host) &&
      /^\/[a-z]{2}\/playlist\/(?:[A-Za-z0-9_%~.-]+\/)?pl\.[A-Za-z0-9.-]+$/.test(path)) return `https://music.apple.com${path}`;
  if (service === 'soundcloud' && ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com'].includes(host) &&
      /^\/[A-Za-z0-9_-]+\/sets\/[A-Za-z0-9_-]+$/.test(path)) return `https://soundcloud.com${path}`;
  throw Error(`Потрібне посилання на плейліст ${musicServices[service]?.name || ''}. ${service === 'soundcloud' ? 'Відкрий плейліст у браузері й скопіюй повну адресу з /sets/; коротке on.soundcloud.com не підходить.' : ''}`);
}
export function playlistEntry(value) {
  const raw=typeof value==='string'?value:value?.url;
  if(!String(raw||'').trim())return null;
  let service=value?.service;
  if(!service) {
    try { const host=new URL(String(raw).trim()).hostname;service=host==='open.spotify.com'?'spotify':host.endsWith('music.apple.com')?'appleMusic':host.endsWith('soundcloud.com')?'soundcloud':''; } catch {}
  }
  if(!Object.hasOwn(musicServices,service||''))throw Error('Встав посилання на плейліст Spotify, Apple Music або SoundCloud.');
  const url=playlistURL(service,raw),title=String(value?.title||'').trim();
  if(url.length>500||title.length>60)throw Error('Назва — до 60 символів, посилання — до 500.');
  return {service,url,title};
}
const playlistValues=value=>Array.isArray(value?.playlists)?value.playlists:Object.keys(musicServices).flatMap(service=>value?.[service]?[{service,url:value[service]}]:[]);
export function profileMusicData(value = {}) {
  const values=playlistValues(value);
  if(values.length>3)throw Error('Можна додати до трьох плейлістів.');
  return {visible:value.visible!==false,playlists:values.map(playlistEntry).filter(Boolean)};
}
export function profilePlaylists(value = {}) {
  return playlistValues(value).slice(0,3).flatMap(entry=>{
    try {const playlist=playlistEntry(entry);return playlist?[{...playlist,name:musicServices[playlist.service].name}]:[];}catch{return [];}
  });
}
export function playlistEmbedURL(service, value) {
  const url = playlistURL(service, value);
  if (!url) return '';
  if (service === 'spotify') return url.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');
  if (service === 'appleMusic') return url.replace('music.apple.com/', 'embed.music.apple.com/');
  return `https://w.soundcloud.com/player/?${new URLSearchParams({ url, auto_play: 'false', hide_related: 'true', show_comments: 'false', visual: 'false' })}`;
}
