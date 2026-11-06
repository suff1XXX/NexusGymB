// Pointer, touch and keyboard support for a compact reaction control.
export function installReactionInteractions({openPicker,closePicker}) {
  let press=null,timer=null,suppressed=null;
  const cancel=()=>{clearTimeout(timer);timer=null;press=null;};
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('[data-action="quick-react"]');
    if(!event.target.closest('.reaction-popover')&&!button)closePicker(false);
    if(!button||event.button!==0||button.disabled)return;
    cancel();press={button,x:event.clientX,y:event.clientY,id:event.pointerId};
    timer=setTimeout(()=>{
      if(!press)return;
      suppressed={button,until:Date.now()+2000};openPicker(button);timer=null;
    },450);
  });
  document.addEventListener('pointermove',event=>{
    if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancel();
  },{passive:true});
  document.addEventListener('pointerup',cancel);
  document.addEventListener('pointercancel',cancel);
  document.addEventListener('scroll',cancel,{passive:true,capture:true});
  document.addEventListener('click',event=>{
    if(suppressed&&Date.now()<suppressed.until&&suppressed.button.contains(event.target)){
      event.preventDefault();event.stopImmediatePropagation();suppressed=null;
    }
  },true);
  document.addEventListener('contextmenu',event=>{
    const button=event.target.closest('[data-action="quick-react"]');
    if(button){event.preventDefault();cancel();suppressed={button,until:Date.now()+2000};openPicker(button);}
  });
  document.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-action="quick-react"]');
    if(button&&['ArrowDown','ContextMenu'].includes(event.key)) {event.preventDefault();cancel();openPicker(button,true);}
    if(event.key==='Escape'){cancel();if(closePicker(true)){event.preventDefault();event.stopPropagation();}}
    const popup=event.target.closest('.reaction-popover');
    if(popup&&['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();const buttons=[...popup.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+buttons.length)%buttons.length;
      buttons[next].focus();
    }
  });
  window.addEventListener('resize',()=>closePicker(false));
}
