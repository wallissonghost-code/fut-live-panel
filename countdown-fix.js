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
    setInterval(()=>{
      const state=window.FutLiveBattle?.getState?.();
      if(!state)return;
      if(state.round?.finished){el.textContent='ENCERRADA';return;}
      const endAt=Number(state.round?.endAt)||Date.now();
      el.textContent=formatSeconds((endAt-Date.now())/1000);
    },250);
  });
})();