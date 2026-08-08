(() => {
  'use strict';
  const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
  const format=total=>{
    const s=Math.max(0,Math.ceil(Number(total)||0));
    return `${pad(s/3600)}:${pad((s%3600)/60)}:${pad(s%60)}`;
  };
  function expected(){
    const st=window.FutLiveBattle?.getState?.();
    if(!st)return null;
    if(st.round?.finished)return 'ENCERRADA';
    const endAt=Number(st.round?.endAt)||Date.now();
    return format((endAt-Date.now())/1000);
  }
  function stabilize(){
    const el=document.querySelector('#countdown');
    if(!el)return;
    const value=expected();
    if(value!==null && el.textContent!==value)el.textContent=value;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const el=document.querySelector('#countdown');
    if(!el)return;
    let correcting=false;
    const observer=new MutationObserver(()=>{
      if(correcting)return;
      const value=expected();
      if(value!==null && el.textContent!==value){
        correcting=true;
        el.textContent=value;
        correcting=false;
      }
    });
    observer.observe(el,{childList:true,characterData:true,subtree:true});
    stabilize();
    setInterval(stabilize,1000);
  });
})();