(() => {
  'use strict';
  const KEY='futLiveModeEnabled';
  const body=document.body;
  function setMode(on){
    body.classList.toggle('live-mode',!!on);
    try{localStorage.setItem(KEY,on?'1':'0')}catch{}
    const btn=document.querySelector('#liveModeButton');
    if(btn)btn.textContent=on?'📺 Modo LIVE ativo':'📺 Modo LIVE';
  }
  function toggle(){setMode(!body.classList.contains('live-mode'))}
  document.addEventListener('DOMContentLoaded',()=>{
    let saved=false;try{saved=localStorage.getItem(KEY)==='1'}catch{}
    if(saved)setMode(true);
    document.querySelector('#liveModeButton')?.addEventListener('click',toggle);
    document.querySelector('#liveModeExit')?.addEventListener('click',()=>setMode(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&body.classList.contains('live-mode'))setMode(false)});
  });
  window.FutLiveMode={set:setMode,toggle,isActive:()=>body.classList.contains('live-mode')};
})();