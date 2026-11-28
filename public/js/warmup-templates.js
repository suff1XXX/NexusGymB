export function warmupTemplateData(value,previous=null,now=Date.now()) {
  const name=String(value.name||'').trim(),text=String(value.text||'').trim();
  if(!name||name.length>60||!text||text.length>2000)throw Error('Вкажи назву до 60 символів і розминку до 2000 символів.');
  return {name,text,createdAt:previous?.createdAt??now,updatedAt:now};
}
export function applyWarmupTemplate(session,template) {
  if(session?.status!=='active')throw Error('Спочатку відкрий активне тренування.');
  const {text}=warmupTemplateData(template);
  return {...structuredClone(session),warmup:text,warmupDone:false,warmupSkipped:false,restEnd:0,timerEnd:0};
}
