(() => {
  'use strict';
  const STORAGE_KEY='futLivePanelStateV2';
  const MIGRATION_KEY='futLiveTeamGiftsV2';
  const logo=domain=>`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  const TEAMS=[
    ['Palmeiras','PAL','#146b35','palmeiras.com.br','Rose'],
    ['Flamengo','FLA','#a81522','flamengo.com.br','GG'],
    ['São Paulo','SPF','#d12c32','saopaulofc.net','Community Heart'],
    ['Corinthians','COR','#202020','corinthians.com.br','TikTok'],
    ['Atlético MG','CAM','#252525','atletico.com.br','Pop'],
    ['Grêmio','GRE','#1680bb','gremio.net',"You're awesome"],
    ['Internacional','INT','#c8202f','internacional.com.br','A Shard of Hope'],
    ['Cruzeiro','CRU','#234da0','cruzeiro.com.br',"It's Match Time"],
    ['Vasco','VAS','#353535','vasco.com.br','Wink wink'],
    ['Botafogo','BOT','#191919','botafogo.com.br','Ice Cream Cone'],
    ['Athletico PR','CAP','#bb2028','athletico.com.br','Clap Clap'],
    ['Santos','SAN','#333333','santosfc.com.br','Love you so much'],
    ['Fortaleza','FOR','#2f64b5','fortaleza1918.com.br','Glow Stick'],
    ['Bahia','BAH','#2765b3','esporteclubebahia.com.br','Cake Slice'],
    ['Coritiba','CFC','#17733b','coritiba.com.br','Freestyle'],
    ['Sport','SPO','#b71c2a','sportrecife.com.br','Good Job'],
    ['Cuiabá','CUI','#e0b715','cuiabaesporteclube.com.br','Oldies'],
    ['Goiás','GOI','#158445','goiasesporteclube.com.br','Ovelhas Felizes'],
    ['Juventude','JUV','#298a50','juventude.com.br','Heart Me'],
    ['América MG','AME','#18854a','americafc.com.br','Blow a kiss']
  ].map(([name,short,color,domain,giftName])=>({name,short,color,logo:logo(domain),giftName,coins:1,points:1}));

  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}};
  const state=read();
  if(!localStorage.getItem(MIGRATION_KEY)){
    const oldByName=new Map((state.clubs||[]).map(c=>[normalize(c.name),c]));
    state.clubs=TEAMS.map(t=>({...t,points:Number(oldByName.get(normalize(t.name))?.points)||0}));
    state.gifts=TEAMS.map(t=>({name:t.giftName,points:1,coins:1,emoji:'🎁',team:t.name,logo:t.logo}));
    state.likes=Number(state.likes)||0;
    state.giftCount=Number(state.giftCount)||0;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    localStorage.setItem(MIGRATION_KEY,'1');
  }

  function resolveGift(name){const n=normalize(name);return TEAMS.find(t=>normalize(t.giftName)===n)||null}
  function getTeam(name){return TEAMS.find(t=>normalize(t.name)===normalize(name))||null}
  function patchRanking(){
    document.querySelectorAll('.rank-row').forEach(row=>{
      const team=getTeam(row.dataset.club||row.querySelector('.club-name')?.textContent);
      const badge=row.querySelector('.club-badge');
      if(!team||!badge||badge.dataset.crestReady)return;
      badge.dataset.crestReady='1';badge.classList.add('club-crest-badge');
      badge.innerHTML=`<img src="${team.logo}" alt="Escudo ${team.name}" loading="lazy"><span hidden>${team.short}</span>`;
      const img=badge.querySelector('img');img.addEventListener('error',()=>{img.hidden=true;badge.querySelector('span').hidden=false});
    });
  }
  function hookGiftApi(){
    if(!window.FutLivePanel?.receiveGift)return false;
    if(window.FutLivePanel.receiveGift.__teamGiftHook)return true;
    const original=window.FutLivePanel.receiveGift.bind(window.FutLivePanel);
    const hooked=(payload={})=>{
      const team=resolveGift(payload.giftName);
      return original({...payload,clubName:team?.name||payload.clubName,points:team?.points||payload.points||1,emoji:team?'⚽':payload.emoji});
    };
    hooked.__teamGiftHook=true;window.FutLivePanel.receiveGift=hooked;return true;
  }
  const observer=new MutationObserver(patchRanking);
  document.addEventListener('DOMContentLoaded',()=>{
    patchRanking();const list=document.querySelector('#rankingList');if(list)observer.observe(list,{childList:true,subtree:true});
    const timer=setInterval(()=>{if(hookGiftApi())clearInterval(timer)},100);
    setTimeout(()=>clearInterval(timer),10000);
  });
  window.FutLiveTeamGifts={teams:TEAMS,resolveGift,getTeam,patchRanking};
})();