import { profileLabel } from './training-profiles.js';
import { isWorkingSet } from './training-methods.js';
import { repsLabel } from './repetitions.js';
import {workoutSummary} from './workout-summary.js';
import {weightLabel} from './workout-modes.js';

const number=value=>Number(value).toLocaleString('uk-UA',{maximumFractionDigits:2});
export function resultCardData(session,sessions=[],profiles=[]) {
  const stats=workoutSummary(session,sessions);
  return {name:session.name||'Тренування',date:session.date,early:!!session.endedEarly,stats,
    exercises:session.items.flatMap((item,index)=>{
      const logs=(session.logs||[]).filter(log=>log.index===index&&!log.warmup);
      if(!logs.length&&!session.simpleCompleted?.includes(index))return [];
      const groups=new Map();
      for(const log of logs) {
        const label=`${profileLabel(log.machine,profiles)} · ${log.dropOf !== undefined ? `Дроп до підходу ${session.logs.slice(0,log.dropOf+1).filter(entry=>entry.index === index && isWorkingSet(entry)).length}: ` : log.quickResult?'Найкращий: ':''}${weightLabel(log)}${log.seconds?` · ${log.seconds} с`:` × ${repsLabel(log)}`}`;
        groups.set(label,(groups.get(label)||0)+1);
      }
      return [{name:(item.name||'Вправа')+(item.superset?' · суперсет':''),results:[...groups].map(([label,count])=>`${count>1?`${count} підх. · `:''}${label}`).join(' / ')||'Виконано без обліку підходів'}];
    })};
}

// Both exports use the same local canvas, preserving Ukrainian glyphs without external fonts.
export async function renderResultCard(session,sessions=[],profiles=[]) {
  await document.fonts.ready;
  const data=resultCardData(session,sessions,profiles),pages=[];
  let canvas,ctx,y;
  const font=(size,bold=false)=>{ctx.font=`${bold?700:400} ${size}px system-ui, sans-serif`;};
  const wrapped=(text,size,width=860)=>{
    font(size,true);const lines=[];let line='';
    for(const word of String(text).split(/\s+/)) {
      for(const letter of `${line?' ':''}${word}`) {
        if(ctx.measureText(line+letter).width>width&&line){lines.push(line);line='';}
        line+=letter;
      }
    }
    if(line)lines.push(line.trim());return lines.length?lines:[''];
  };
  const text=(value,size=24,bold=false,color='#26364e',x=70)=>{
    font(size,bold);ctx.fillStyle=color;ctx.fillText(String(value),x,y);y+=size*1.5;
  };
  function page() {
    canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1414;ctx=canvas.getContext('2d');pages.push(canvas);
    ctx.fillStyle='#f2f5fc';ctx.fillRect(0,0,1000,1414);
    ctx.fillStyle='#fff';ctx.fillRect(36,36,928,1342);
    ctx.fillStyle='#3659e3';ctx.fillRect(36,36,928,10);
    y=104;text('GymB',30,true,'#3659e3');
    text(pages.length===1?'КАРТКА РЕЗУЛЬТАТІВ':'РЕЗУЛЬТАТИ · ПРОДОВЖЕННЯ',17,true,'#62718a');
    y+=14;
    for(const line of wrapped(data.name,36))text(line,36,true,'#15253e');
    text(`${data.date}${data.early?' · Завершено достроково':''}`,21,false,'#62718a');y+=22;
  }
  const ensure=height=>{if(y+height>1295)page();};
  function block(title,body,accent=false) {
    // Break even exceptionally long names/results across pages instead of clipping.
    for(const line of wrapped(title,25)) {ensure(42);text(line,25,true,accent?'#3659e3':'#15253e');}
    for(const line of wrapped(body,22)) {ensure(36);text(line,22,false,'#62718a');}
    y+=20;
  }
  page();
  const s=data.stats;
  block(`${s.minutesKnown?`${s.minutes} хв`:'Час не записано'}   /   ${s.sets} підходів   /   ${s.exercises} вправ`,
    `Обсяг: ${s.volumeKnown?`${number(s.volume)} кг × повт.`:'не записано'}${s.unknownWeightSets?' (лише відома вага)':''} · ${s.reps} повторень`);
  text('ВИКОНАНІ ВПРАВИ',18,true,'#3659e3');y+=8;
  if(!data.exercises.length)block('Без записаних вправ','У цьому тренуванні немає результатів підходів.');
  for(const exercise of data.exercises) {ensure(110);block(exercise.name,exercise.results);}
  const records=[...s.records.map(r=>({...r,label:r.first?'Перший результат':'Новий рекорд'})),
    ...s.repetitionRecords.filter(r=>!s.records.some(p=>p.key===r.key&&p.weight===r.weight&&p.reps===r.reps)).map(r=>({...r,label:r.first?'Перший результат за повтореннями':'Рекорд за повтореннями'}))];
  if(records.length){ensure(130);text('ОСОБИСТІ РЕЗУЛЬТАТИ',18,true,'#3659e3');y+=8;}
  for(const r of records){ensure(110);block(r.name,`${r.label} · ${weightLabel(r)} × ${repsLabel(r)}`,true);}
  ensure(85);text(`Дропів: ${s.dropSets} · обсяг діапазонів — за нижньою межею.`,17,false,'#62718a');
  for(const [index,p] of pages.entries()) {
    const c=p.getContext('2d');c.font='17px system-ui, sans-serif';c.fillStyle='#62718a';
    c.fillText('GymB · Результати тренування',70,1348);c.textAlign='right';c.fillText(`${index+1} / ${pages.length}`,930,1348);
  }
  return pages;
}

export async function resultPNG(pages) {
  if(pages.length*1414>16000)throw Error('Для такого довгого тренування завантаж PDF.');
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=pages.length*1414;
  const ctx=canvas.getContext('2d');pages.forEach((page,index)=>ctx.drawImage(page,0,index*1414));
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Не вдалося створити PNG.')),'image/png'));
}

// A small standards-based PDF writer: one JPEG canvas per A4 page, no CDN or server upload.
export function resultPDF(pages) {
  const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
  const add=value=>{const bytes=typeof value==='string'?enc.encode(value):value;chunks.push(bytes);length+=bytes.length;};
  const object=(id,body,stream)=>{
    offsets[id]=length;add(`${id} 0 obj\n${body}`);
    if(stream){add('\nstream\n');add(stream);add('\nendstream');}
    add('\nendobj\n');
  };
  add('%PDF-1.4\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
  pages.forEach((page,index)=>{
    const id=3+index*3,binary=atob(page.toDataURL('image/jpeg',0.94).split(',')[1]),jpeg=Uint8Array.from(binary,c=>c.charCodeAt(0));
    object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    object(id+1,`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
    const content=enc.encode('q 595.28 0 0 841.89 0 0 cm /Image Do Q');
    object(id+2,`<< /Length ${content.length} >>`,content);
  });
  const start=length;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for(const offset of offsets.slice(1))add(`${String(offset).padStart(10,'0')} 00000 n \n`);
  add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
  return new Blob(chunks,{type:'application/pdf'});
}

export function downloadResult(blob,filename) {
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
