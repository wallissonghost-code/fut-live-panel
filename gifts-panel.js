(() => {
  const STORAGE_KEY='futLivePanelStateV2';
  const fallback=[
    {name:'Rosa',points:1,emoji:'🌹'},
    {name:'Coração',points:5,emoji:'💚'},
    {name:'Bola',points:10,emoji:'⚽'},
    {name:'Troféu',points:25,emoji:'🏆'},
    {name:'Leão',points:100,emoji:'🦁'}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getGifts(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}').gifts||fallback}
    catch{return fallback}
  }
  function render(){
    const list=document.querySelector('#giftsGuideList');
    if(!list)return;
    list.innerHTML=getGifts().map(g=>`<article class="gift-guide-card"><span class="gift-guide-icon">${esc(g.emoji||'🎁')}</span><div class="gift-guide-info"><strong>${esc(g.name||'Presente')}</strong><span>+${Number(g.points)||0} PTS</span></div></article>`).join('');
  }
  window.addEventListener('storage',render);
  document.addEventListener('DOMContentLoaded',render);
  window.FutLiveGiftsGuide={render};
})();