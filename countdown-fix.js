(() => {
  'use strict';
  function formatSeconds(total){
    const seconds=Math.max(0,Math.ceil(Number(total)||0));
    const h=String(Math.floor(seconds/3600)).padStart(2,'0');
    const m=String(Math.floor((seconds%3600)/60)).padStart(2,'0');
    const s=String(seconds%60).padStart(2,'0');
    return `${h}:${m}:${s}`;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const el=document.querySelector('#countdown');
    if(!el)return;
    let last='';
    const tick=()=>{
      const state=window.FutLiveBattle?.getState?.();
      if(!state)return;
      const next=state.round?.finished?'ENCERRADA':formatSeconds(((Number(state.round?.endAt)||Date.now())-Date.now())/1000);
      if(next!==last){el.textContent=next;last=next;}
    };
    tick();
    setInterval(tick,1000);
  });
})();