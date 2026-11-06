export const tagTemplates = {
  classic: {label:'Класичний',color:'#e8f2ff',textColor:'#0066cc',gradient:false,colorEnd:'#d9e8ff',angle:120,effect:'none',shadow:'none'},
  gold: {label:'Золотий блиск',color:'#8a4b08',textColor:'#ffffff',gradient:true,colorEnd:'#e6ad32',angle:120,effect:'shine',shadow:'soft'},
  aurora: {label:'Північне сяйво',color:'#185adb',textColor:'#ffffff',gradient:true,colorEnd:'#b037c8',angle:120,effect:'flow',shadow:'glow'},
  emerald: {label:'Смарагд',color:'#087b60',textColor:'#ffffff',gradient:true,colorEnd:'#114b49',angle:135,effect:'shine',shadow:'soft'},
  neon: {label:'Неон',color:'#302064',textColor:'#ffffff',gradient:true,colorEnd:'#7333b7',angle:90,effect:'pulse',shadow:'glow'},
};
export function tagStyle(tag) {
  const t=tagData([tag])[0];
  return `--tag-bg:${t.gradient?`linear-gradient(${t.angle}deg,${t.color},${t.colorEnd},${t.color})`:t.color};--tag-fg:${t.textColor};--tag-glow:${t.color};`;
}
export function tagData(input) {
  if (!Array.isArray(input) || input.length > 5) throw Error('Можна видати до 5 тегів користувачу.');
  return input.map((tag) => {
    const text = typeof tag?.text === 'string' ? tag.text.trim() : '';
    if (!text || text.length > 40 || !/^#[0-9a-fA-F]{6}$/.test(tag.color) || !/^#[0-9a-fA-F]{6}$/.test(tag.textColor))
      throw Error('Вкажи текст тегу до 40 символів та кольори фону й тексту.');
    const colorEnd=tag.colorEnd??tag.color,angle=tag.angle??120,effect=tag.effect??'none',shadow=tag.shadow??'none';
    if(!/^#[0-9a-fA-F]{6}$/.test(colorEnd)||!Number.isInteger(angle)||angle<0||angle>360||!['none','shine','flow','pulse'].includes(effect)||!['none','soft','glow'].includes(shadow)||(tag.gradient!==undefined&&typeof tag.gradient!=='boolean'))throw Error('Перевір оформлення тегу.');
    return { text, color: tag.color.toLowerCase(), textColor: tag.textColor.toLowerCase(),colorEnd:colorEnd.toLowerCase(),angle,gradient:tag.gradient??false,effect,shadow };
  });
}
