import {Editor,Mark,Node,mergeAttributes} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TextStyleKit} from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import {TableKit} from '@tiptap/extension-table';
import DOMPurify from 'dompurify';
import {commentText} from './social.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fonts=['Arial, sans-serif','Georgia, serif','Verdana, sans-serif','monospace'];
const sizes=['12px','14px','16px','18px','20px','24px'];
const tags=['p','br','strong','b','em','i','u','s','strike','span','h2','h3','blockquote','pre','code','ul','ol','li','div','table','tbody','thead','tr','th','td','a','hr'];
const attrs=['href','title','style','colspan','rowspan','start','data-spoiler','data-youtube'];
export function safeCommentLink(value) {
  try {const url=new URL(String(value).trim());return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function youtubeId(value) {
  const text=String(value||'').trim();if(/^[\w-]{11}$/.test(text))return text;
  try {
    const url=new URL(text);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return '';
    const host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
    let id='';
    if(['youtu.be','www.youtu.be'].includes(host))id=parts[0];
    else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))id=parts[0]==='watch'?url.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:'';
    return /^[\w-]{11}$/.test(id||'')?id:'';
  }catch{return '';}
}
function colorHex(value) {
  const text=String(value).trim();
  if(/^#[0-9a-f]{6}$/i.test(text))return text.toLowerCase();
  if(/^#[0-9a-f]{3}$/i.test(text))return '#'+text.slice(1).split('').map(c=>c+c).join('').toLowerCase();
  const match=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(text);
  return match&&match.slice(1).every(n=>Number(n)<=255)?'#'+match.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):'';
}
export function sanitizeCommentHTML(value) {
  if(typeof value!=='string'||value.length>64000)return '';
  const fragment=DOMPurify.sanitize(value.replace(/\u200b/g,''),{ALLOWED_TAGS:tags,ALLOWED_ATTR:attrs,ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,RETURN_DOM_FRAGMENT:true});
  for(const element of fragment.querySelectorAll('*')) {
    const style=element.style, safeStyle={};
    const color=colorHex(style.color);if(color)safeStyle.color=color;
    const font=style.fontFamily.replace(/["']/g,'').replace(/\s*,\s*/g,', ');if(fonts.includes(font))safeStyle.fontFamily=font;
    if(sizes.includes(style.fontSize))safeStyle.fontSize=style.fontSize;
    if(['left','center','right','justify'].includes(style.textAlign))safeStyle.textAlign=style.textAlign;
    element.removeAttribute('style');
    for(const attribute of [...element.attributes]) {
      const name=attribute.name;
      const allowed=element.tagName==='A'&&['href','title'].includes(name)||['TD','TH'].includes(element.tagName)&&['colspan','rowspan'].includes(name)||element.tagName==='OL'&&name==='start'||element.tagName==='SPAN'&&name==='data-spoiler'&&attribute.value==='true'||element.tagName==='DIV'&&name==='data-youtube'&&/^[\w-]{11}$/.test(attribute.value);
      if(!allowed)element.removeAttribute(name);
      else if(['colspan','rowspan','start'].includes(name)&&(!/^\d{1,3}$/.test(attribute.value)||Number(attribute.value)<1||Number(attribute.value)>(name==='start'?999:10)))element.removeAttribute(name);
    }
    if(element.tagName==='A') {
      const href=safeCommentLink(element.getAttribute('href'));
      if(href){element.setAttribute('href',href);element.setAttribute('target','_blank');element.setAttribute('rel','noopener noreferrer');}
      else element.removeAttribute('href');
    }
    for(const [key,val] of Object.entries(safeStyle))element.style[key]=val;
    if(element.matches('div[data-youtube]'))element.textContent='Відео YouTube';
  }
  const container=document.createElement('div');container.append(fragment);return container.innerHTML;
}
export function plainCommentHTML(value) {
  const container=document.createElement('div');container.innerHTML=sanitizeCommentHTML(value);
  for(const video of container.querySelectorAll('[data-youtube]'))video.replaceWith(document.createTextNode('\n[Відео YouTube]\n'));
  for(const br of container.querySelectorAll('br'))br.replaceWith(document.createTextNode('\n'));
  for(const cell of container.querySelectorAll('td,th'))cell.append(document.createTextNode('\t'));
  for(const block of container.querySelectorAll('p,div,h2,h3,blockquote,pre,li,tr'))block.append(document.createTextNode('\n'));
  return container.textContent.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function renderComment(comment) {
  if(!comment?.richText)return `<div class="rich-comment">${esc(comment?.text||'').replace(/\n/g,'<br>')}</div>`;
  const clean=sanitizeCommentHTML(comment.richText);if(!clean)return `<div class="rich-comment">${esc(comment.text||'').replace(/\n/g,'<br>')}</div>`;
  const container=document.createElement('div');container.innerHTML=clean;
  for(const spoiler of container.querySelectorAll('span[data-spoiler]')){
    spoiler.setAttribute('role','button');spoiler.setAttribute('tabindex','0');spoiler.setAttribute('aria-expanded','false');spoiler.setAttribute('aria-label','Показати спойлер');
  }
  for(const video of container.querySelectorAll('div[data-youtube]')) {
    const button=document.createElement('button');button.type='button';button.className='rich-youtube-play';button.dataset.richView='youtube';button.dataset.video=video.dataset.youtube;
    const symbol=document.createElement('span');symbol.textContent='▶';symbol.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent='Відтворити відео з YouTube';button.append(symbol,label);
    video.replaceChildren(button);video.className='rich-video';
  }
  for(const table of container.querySelectorAll('table')){const wrap=document.createElement('div');wrap.className='rich-table-scroll';table.before(wrap);wrap.append(table);}
  return `<div class="rich-comment">${container.innerHTML}</div>`;
}
const Spoiler=Mark.create({name:'spoiler',parseHTML(){return [{tag:'span[data-spoiler="true"]'}];},renderHTML(){return ['span',{'data-spoiler':'true'},0];}});
const Video=Node.create({name:'commentVideo',group:'block',atom:true,addAttributes(){return {video:{default:'',parseHTML:element=>youtubeId(element.getAttribute('data-youtube')),renderHTML:attributes=>({'data-youtube':youtubeId(attributes.video)})}};},parseHTML(){return [{tag:'div[data-youtube]',getAttrs:element=>youtubeId(element.getAttribute('data-youtube'))?{}:false}];},renderHTML({HTMLAttributes}){return ['div',mergeAttributes(HTMLAttributes,{contenteditable:'false',class:'rich-editor-video'}),['span',{},'▶ YouTube'],['small',{},'Відео буде доступне після публікації']];}});
const instances=new Map();
const tool=(name,label,icon)=>`<button type="button" class="rich-tool" data-rich-command="${name}" aria-label="${label}" title="${label}">${icon}</button>`;
export function richComposer({photos=false,draft='',placeholder='Написати коментар…',name='comment',maxLength=2000,htmlLimit=16000}={}) {
  const saved=typeof draft==='object'&&draft?draft:{text:String(draft),html:''};
  return `<div class="rich-composer" data-photos="${photos}" data-limit="${maxLength}" data-html-limit="${htmlLimit}"><div class="rich-toolbar" role="toolbar" aria-label="Форматування коментаря"><div class="rich-tool-group">${tool('clear','Очистити форматування','◇')}${tool('bold','Жирний (Ctrl+B)','<b>B</b>')}${tool('italic','Курсив (Ctrl+I)','<i>I</i>')}${tool('underline','Підкреслення (Ctrl+U)','<u>U</u>')}${tool('strike','Закреслення','<s>S</s>')}</div><div class="rich-tool-group"><select class="rich-font" data-rich-select="font" aria-label="Шрифт"><option value="">Шрифт</option>${fonts.map((font,i)=>`<option value="${font}">${['Arial','Georgia','Verdana','Моноширинний'][i]}</option>`).join('')}</select><select data-rich-select="size" aria-label="Розмір шрифту"><option value="">Розмір</option>${sizes.map(size=>`<option>${size}</option>`).join('')}</select><label class="rich-color" title="Колір тексту"><span aria-hidden="true">A</span><input type="color" value="#0071e3" data-rich-select="color" aria-label="Колір тексту"/></label></div><div class="rich-tool-group">${tool('bulletList','Маркований список','☷')}${tool('orderedList','Нумерований список','≡')}<select data-rich-select="align" aria-label="Вирівнювання"><option value="left">Ліворуч</option><option value="center">По центру</option><option value="right">Праворуч</option><option value="justify">По ширині</option></select><select data-rich-select="block" aria-label="Стиль абзацу"><option value="paragraph">Абзац</option><option value="h2">Заголовок</option><option value="h3">Підзаголовок</option><option value="code">Код</option></select></div><div class="rich-tool-group">${tool('link','Гіперпосилання','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/></svg>')}${photos?tool('photo','Додати фото','▧'):''}${tool('youtube','Відео з YouTube','▶')}${tool('table','Таблиця','▦')}${tool('blockquote','Цитата','❝')}${tool('spoiler','Спойлер','◩')}${tool('emoji','Емодзі','☺')}</div><div class="rich-tool-group">${tool('undo','Скасувати (Ctrl+Z)','↶')}${tool('redo','Повторити (Ctrl+Shift+Z)','↷')}</div></div><div class="rich-insert-panel" hidden></div><div class="rich-editor" data-placeholder="${esc(placeholder)}"></div><textarea name="${esc(name)}" class="rich-source" hidden>${esc(saved.text||'')}</textarea><textarea class="rich-initial" hidden>${esc(saved.html||'')}</textarea><div class="rich-table-tools" role="group" aria-label="Редагування таблиці" hidden>${tool('addRowAfter','Додати рядок','+ рядок')}${tool('addColumnAfter','Додати стовпець','+ стовпець')}${tool('deleteRow','Видалити рядок','− рядок')}${tool('deleteColumn','Видалити стовпець','− стовпець')}${tool('deleteTable','Видалити таблицю','Прибрати таблицю')}</div><div class="rich-editor-footer"><span class="rich-counter">0 / ${maxLength}</span><button type="button" class="rich-preview-toggle" data-rich-command="preview" aria-pressed="false">Переглянути</button></div><div class="rich-preview" hidden></div>${photos?'<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" hidden/><div class="rich-photo-preview" hidden></div>':''}<div class="rich-status" role="status"></div></div>`;
}
function instance(element){return instances.get(element.closest('.rich-composer'));}
function sync(entry) {
  const html=entry.editor.getHTML(),plain=plainCommentHTML(html),root=entry.root;
  root.querySelector('.rich-source').value=plain;
  root.querySelector('.rich-counter').textContent=`${plain.length} / ${root.dataset.limit}`;
  root.querySelector('.rich-counter').classList.toggle('is-over-limit',plain.length>Number(root.dataset.limit)||html.length>Number(root.dataset.htmlLimit));
  for(const button of root.querySelectorAll('[data-rich-command]')){
    const command=button.dataset.richCommand;
    if(['bold','italic','underline','strike','bulletList','orderedList','blockquote','spoiler'].includes(command))button.setAttribute('aria-pressed',String(entry.editor.isActive(command)));
    if(command==='undo'||command==='redo')button.disabled=!entry.editor.can()[command]();
  }
  root.querySelector('.rich-table-tools').hidden=!entry.editor.isActive('table');
  const font=entry.editor.getAttributes('textStyle').fontFamily||'',size=entry.editor.getAttributes('textStyle').fontSize||'';
  root.querySelector('[data-rich-select="font"]').value=fonts.includes(font)?font:'';
  root.querySelector('[data-rich-select="size"]').value=sizes.includes(size)?size:'';
  const color=colorHex(entry.editor.getAttributes('textStyle').color||'');if(color)root.querySelector('[data-rich-select="color"]').value=color;
  root.querySelector('[data-rich-select="align"]').value=entry.editor.getAttributes('paragraph').textAlign||entry.editor.getAttributes('heading').textAlign||'left';
  root.querySelector('[data-rich-select="block"]').value=entry.editor.isActive('codeBlock')?'code':entry.editor.isActive('heading',{level:2})?'h2':entry.editor.isActive('heading',{level:3})?'h3':'paragraph';
}
export function mountRichEditors(container=document) {
  for(const root of container.querySelectorAll('.rich-composer')) {
    if(instances.has(root))continue;
    const source=root.querySelector('.rich-source').value,initial=root.querySelector('.rich-initial').value;
    const entry={root,editor:null,url:'',selection:null};
    const editor=new Editor({element:root.querySelector('.rich-editor'),extensions:[StarterKit.configure({heading:{levels:[2,3]},link:{openOnClick:false,autolink:false,isAllowedUri:url=>!!safeCommentLink(url)}}),TextStyleKit.configure({backgroundColor:false,lineHeight:false}),TextAlign.configure({types:['heading','paragraph']}),TableKit.configure({table:{resizable:false}}),Spoiler,Video],content:sanitizeCommentHTML(initial||`<p>${esc(source).replace(/\n/g,'<br>')}</p>`),editorProps:{attributes:{class:'rich-document',role:'textbox','aria-multiline':'true','aria-label':root.querySelector('.rich-editor').dataset.placeholder,'data-placeholder':root.querySelector('.rich-editor').dataset.placeholder},transformPastedHTML:html=>sanitizeCommentHTML(html),handlePaste:(_view,event)=>{
      const photo=[...(event.clipboardData?.files||[])].find(file=>file.type.startsWith('image/'));
      if(photo&&root.dataset.photos==='true'){event.preventDefault();setPhoto(entry,photo);return true;}return false;
    }},onUpdate:()=>sync(entry),onSelectionUpdate:()=>sync(entry)});
    entry.editor=editor;instances.set(root,entry);sync(entry);
  }
}
export function disposeRichEditors(container) {
  for(const [root,entry] of instances)if(root===container||container.contains(root)){if(entry.url)URL.revokeObjectURL(entry.url);entry.editor.destroy();instances.delete(root);}
}
export function collectRichComment(form,{allowEmpty=false}={}) {
  const entry=instances.get(form.querySelector('.rich-composer'));
  const raw=entry?entry.editor.getHTML():'';
  if(raw.length>64000)throw Error('Забагато форматування. Скороти текст або прибери частину стилів.');
  const richText=sanitizeCommentHTML(raw),plain=entry?plainCommentHTML(richText):form.querySelector('.rich-source')?.value||'',limit=Number(entry?.root.dataset.limit||2000);
  if(plain.trim().length>limit)throw Error(`Текст має містити до ${limit} символів.`);
  if(allowEmpty&&!plain.trim())return {text:'',richText:''};
  const text=commentText(plain);
  if(richText.length>Number(entry?.root.dataset.htmlLimit||16000))throw Error('Забагато форматування. Скороти текст або прибери частину стилів.');
  return {text,...(richText?{richText}:{})};
}
export function captureCommentDraft(form) {
  if(!form)return null;
  const entry=instances.get(form.querySelector('.rich-composer'));
  return {html:entry?sanitizeCommentHTML(entry.editor.getHTML()):'',text:form.querySelector('.rich-source')?.value||'',photo:form.elements.photo?.files?.[0]||null,score:form.querySelector('[name="score"]:checked')?.value||''};
}
export function restoreCommentDraft(form,draft,focus=false) {
  if(!form||!draft)return;
  const entry=instances.get(form.querySelector('.rich-composer'));if(!entry)return;
  entry.editor.commands.setContent(sanitizeCommentHTML(draft.html||`<p>${esc(draft.text).replace(/\n/g,'<br>')}</p>`));
  if(draft.photo&&form.elements.photo)setPhoto(entry,draft.photo);
  if(focus)entry.editor.commands.focus('end');sync(entry);
}
export function clearRichComment(form) {
  const entry=instances.get(form.querySelector('.rich-composer'));if(!entry)return;
  entry.editor.commands.clearContent();removePhoto(entry);sync(entry);
}
function removePhoto(entry){if(entry.url)URL.revokeObjectURL(entry.url);entry.url='';const input=entry.root.querySelector('[name=photo]');if(input)input.value='';const preview=entry.root.querySelector('.rich-photo-preview');if(preview){preview.hidden=true;preview.replaceChildren();}}
function setPhoto(entry,file) {
  const status=entry.root.querySelector('.rich-status');status.textContent='';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000){status.textContent='Обери JPG, PNG або WebP до 10 МБ.';return;}
  removePhoto(entry);const transfer=new DataTransfer();transfer.items.add(file);entry.root.querySelector('[name=photo]').files=transfer.files;
  entry.url=URL.createObjectURL(file);const preview=entry.root.querySelector('.rich-photo-preview'),image=document.createElement('img');image.src=entry.url;image.alt='Фото до коментаря';
  const button=document.createElement('button');button.type='button';button.dataset.richCommand='removePhoto';button.textContent='Прибрати фото';preview.append(image,button);preview.hidden=false;
}
function panel(entry,kind) {
  const root=entry.root.querySelector('.rich-insert-panel');entry.selection={from:entry.editor.state.selection.from,to:entry.editor.state.selection.to};root.dataset.kind=kind;
  const urlField=(label,placeholder)=>`<label>${label}<input type="text" inputmode="url" data-rich-field="url" placeholder="${placeholder}" maxlength="2048" /></label>`;
  root.innerHTML=kind==='link'?`${urlField('Посилання','https://example.com')}<label>Текст посилання<input data-rich-field="label" maxlength="2000" value="${esc(entry.editor.state.doc.textBetween(entry.selection.from,entry.selection.to,' '))}"/></label>`:kind==='youtube'?urlField('Посилання на відео YouTube','https://www.youtube.com/watch?v=…'):kind==='table'?'<label>Рядків<input type="number" data-rich-field="rows" value="2" min="1" max="8"/></label><label>Стовпців<input type="number" data-rich-field="cols" value="2" min="1" max="6"/></label>':'';
  if(kind==='emoji')root.innerHTML=`<div class="rich-emoji-list">${['😀','😊','😂','🥰','😮','🤔','💪','🔥','👍','👎','❤️','🎉','🏆','✅','🙏','🙌'].map(emoji=>`<button type="button" data-rich-emoji="${emoji}" aria-label="Вставити ${emoji}">${emoji}</button>`).join('')}</div>`;
  else root.insertAdjacentHTML('beforeend','<div class="rich-panel-actions"><button type="button" data-rich-command="insert">Вставити</button><button type="button" data-rich-command="cancel">Скасувати</button></div>');
  root.hidden=false;root.querySelector('input,button')?.focus();
}
function insertPanel(entry) {
  const root=entry.root.querySelector('.rich-insert-panel'),kind=root.dataset.kind,status=entry.root.querySelector('.rich-status'),get=name=>root.querySelector(`[data-rich-field="${name}"]`)?.value||'';
  status.textContent='';let chain=entry.editor.chain().focus();if(entry.selection)chain=chain.setTextSelection(entry.selection);
  if(kind==='link') {
    const href=safeCommentLink(get('url'));if(!href){status.textContent='Вкажи повне посилання з https:// або http://.';return;}
    const label=get('label').trim()||href;
    const selected=entry.editor.state.doc.textBetween(entry.selection.from,entry.selection.to,' ');
    if(entry.selection.to>entry.selection.from&&label===selected)chain.setLink({href,target:'_blank',rel:'noopener noreferrer'}).run();
    else {const marks=(entry.editor.state.storedMarks||entry.editor.state.selection.$from.marks()).filter(mark=>mark.type.name!=='link').map(mark=>mark.toJSON());chain.insertContent({type:'text',text:label,marks:[...marks,{type:'link',attrs:{href,target:'_blank',rel:'noopener noreferrer'}}]}).run();}
  }else if(kind==='youtube') {
    const id=youtubeId(get('url'));if(!id){status.textContent='Вкажи коректне посилання на відео YouTube.';return;}
    chain.insertContent([{type:'commentVideo',attrs:{video:id}},{type:'paragraph'}]).run();
  }else if(kind==='table') {
    const rows=Number(get('rows')),cols=Number(get('cols'));if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||rows>8||cols<1||cols>6){status.textContent='Обери 1–8 рядків і 1–6 стовпців.';return;}
    chain.insertTable({rows,cols,withHeaderRow:true}).run();
  }
  root.hidden=true;sync(entry);
}
function command(entry,name) {
  const editor=entry.editor,root=entry.root;root.querySelector('.rich-status').textContent='';
  if(['link','youtube','table','emoji'].includes(name)){panel(entry,name);return;}
  if(name==='insert'){insertPanel(entry);return;}
  if(name==='cancel'){const panel=root.querySelector('.rich-insert-panel');panel.hidden=true;panel.replaceChildren();editor.commands.focus();return;}
  if(name==='photo'){root.querySelector('[name=photo]')?.click();return;}
  if(name==='removePhoto'){removePhoto(entry);return;}
  if(name==='preview'){
    const preview=root.querySelector('.rich-preview'),button=root.querySelector('[data-rich-command="preview"]');preview.hidden=!preview.hidden;button.setAttribute('aria-pressed',String(!preview.hidden));
    if(!preview.hidden)preview.innerHTML=renderComment({text:root.querySelector('.rich-source').value,richText:sanitizeCommentHTML(editor.getHTML())});return;
  }
  const chain=editor.chain().focus();
  const commands={bold:'toggleBold',italic:'toggleItalic',underline:'toggleUnderline',strike:'toggleStrike',bulletList:'toggleBulletList',orderedList:'toggleOrderedList',blockquote:'toggleBlockquote',undo:'undo',redo:'redo',addRowAfter:'addRowAfter',addColumnAfter:'addColumnAfter',deleteRow:'deleteRow',deleteColumn:'deleteColumn',deleteTable:'deleteTable'};
  if(name==='spoiler')chain.toggleMark('spoiler').run();
  else if(name==='clear')chain.unsetAllMarks().clearNodes().run();
  else if(commands[name])chain[commands[name]]().run();
  sync(entry);
}
document.addEventListener('pointerdown',event=>{if(event.target.closest('[data-rich-command]')&&!event.target.closest('.rich-insert-panel'))event.preventDefault();});
document.addEventListener('click',event=>{
  const spoiler=event.target.closest('.rich-comment [data-spoiler]');
  if(spoiler&&spoiler.getAttribute('aria-expanded')==='true'&&event.target.closest('a[href]'))return;
  if(spoiler){event.preventDefault();spoiler.setAttribute('aria-expanded',String(spoiler.getAttribute('aria-expanded')!=='true'));spoiler.setAttribute('aria-label',spoiler.getAttribute('aria-expanded')==='true'?'Сховати спойлер':'Показати спойлер');return;}
  const video=event.target.closest('[data-rich-view="youtube"]');
  if(video){const id=youtubeId(video.dataset.video);if(!id)return;const iframe=document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${id}`;iframe.title='Відео з YouTube';iframe.allow='encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');video.replaceWith(iframe);return;}
  const button=event.target.closest('[data-rich-command],[data-rich-emoji]');if(!button)return;
  const entry=instance(button);if(!entry)return;event.preventDefault();
  if(button.dataset.richEmoji){entry.editor.chain().focus().setTextSelection(entry.selection||entry.editor.state.selection).insertContent(button.dataset.richEmoji).run();entry.root.querySelector('.rich-insert-panel').hidden=true;return;}
  command(entry,button.dataset.richCommand);
});
document.addEventListener('change',event=>{
  const target=event.target,entry=instance(target);if(!entry)return;
  if(target.name==='photo'&&target.files[0]){setPhoto(entry,target.files[0]);return;}
  const kind=target.dataset.richSelect;if(!kind)return;
  const chain=entry.editor.chain().focus();
  if(kind==='font')target.value?chain.setFontFamily(target.value).run():chain.unsetFontFamily().run();
  if(kind==='size')target.value?chain.setFontSize(target.value).run():chain.unsetFontSize().run();
  if(kind==='color')chain.setColor(target.value).run();
  if(kind==='align')chain.setTextAlign(target.value).run();
  if(kind==='block')target.value==='code'?chain.toggleCodeBlock().run():target.value==='paragraph'?chain.setParagraph().run():chain.setHeading({level:Number(target.value.slice(1))}).run();
  sync(entry);
});
document.addEventListener('keydown',event=>{
  const spoiler=event.target.closest('.rich-comment [data-spoiler]');if(spoiler&&spoiler.getAttribute('aria-expanded')==='true'&&event.target.closest('a[href]'))return;if(spoiler&&['Enter',' '].includes(event.key)){event.preventDefault();spoiler.click();return;}
  const insert=event.target.closest('.rich-insert-panel'),entry=insert?instance(insert):null;
  if(entry&&event.key==='Enter'&&!event.target.closest('button')){event.preventDefault();insertPanel(entry);}
  if(entry&&event.key==='Escape'){event.preventDefault();event.stopPropagation();insert.hidden=true;insert.replaceChildren();entry.editor.commands.focus();}
});
