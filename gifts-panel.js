(() => {
  'use strict';
  const IMAGE_KEY='futLiveGiftImagesV1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const fallbackImage='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b8ff39"/><stop offset="1" stop-color="#53d400"/></linearGradient></defs><rect width="160" height="160" rx="40" fill="#101712"/><path d="M30 68h100v66H30z" fill="url(#a)"/><path d="M24 52h112v30H24z" fill="#eaffd1"/><path d="M72 52h16v82H72z" fill="#151b16"/><path d="M79 52c-23-5-31-20-22-29 10-10 24 3 22 29Zm2 0c23-5 31-20 22-29-10-10-24 3-22 29Z" fill="none" stroke="#b8ff39" stroke-width="9" stroke-linecap="round"/></svg>`);

  function imageMap(){try{return JSON.parse(localStorage.getItem(IMAGE_KEY)||'{}')}catch{return {}}}
  function render(){
    const list=document.querySelector('#giftsGuideList');
    const teams=window.FutLiveTeamGifts?.teams||[];
    if(!list)return;
    const images=imageMap();

    list.innerHTML=teams.map(team=>{
      const giftImage=images[normalize(team.giftName)]||fallbackImage;
      return `<article class="gift-guide-card">
        <span class="gift-team-crest"><img src="${esc(team.logo)}" alt="Escudo ${esc(team.name)}" loading="lazy"><b hidden>${esc(team.short)}</b></span>
        <div class="gift-picture-wrap"><img class="gift-picture" src="${esc(giftImage)}" alt="Presente do ${esc(team.name)}" loading="lazy"></div>
        <div class="gift-guide-info"><strong>${esc(team.name)}</strong><span>${team.coins} MOEDA · +${team.points} PTS</span></div>
      </article>`;
    }).join('');

    list.querySelectorAll('.gift-team-crest img').forEach(image=>image.addEventListener('error',()=>{image.hidden=true;image.nextElementSibling.hidden=false}));
    list.querySelectorAll('.gift-picture').forEach(image=>image.addEventListener('error',()=>{image.src=fallbackImage}));
  }

  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  window.addEventListener('futlive:gifts-updated',render);
  window.FutLiveGiftsGuide={render};
})();