(() => {
  'use strict';
  const CFG_KEY='futLiveRealtimeConfigV1';
  const HISTORY_KEY='futLiveHistoryV1';
  const GIFT_IMAGES_KEY='futLiveGiftImagesV1';
  const $=s=>document.querySelector(s);
  let socket=null;
  let cfg=loadCfg();
  let history=loadHistory();
  let giftImages=loadGiftImages();
  let userClub=new Map();
  let lastLeader='';

  function loadCfg(){try{return {...{backendUrl:'',adminPin:'',autoConnect:false},...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}}catch{return {backendUrl:'',adminPin:'',autoConnect:false}}}
  function saveCfg(){localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}
  function loadHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return []}}
  function saveHistory(){history=history.slice(0,500);localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}
  function loadGiftImages(){try{return JSON.parse(localStorage.getItem(GIFT_IMAGES_KEY)||'{}')}catch{return {}}}
  function saveGiftImages(){localStorage.setItem(GIFT_IMAGES_KEY,JSON.stringify(giftImages));window.dispatchEvent(new CustomEvent('futlive:gifts-updated'))}
  function addHistory(type,data){history.unshift({time:new Date().toISOString(),type,...data});saveHistory()}
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function panelState(){try{return JSON.parse(localStorage.getItem('futLivePanelStateV2')||'{}')}catch{return {}}}
  function clubs(){return panelState().clubs||[]}
  function gifts(){return panelState().gifts||[]}
  function normalize(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function findClub(text=''){
    const n=normalize(text).replace(/^!/,'');
    return clubs().find(c=>n.includes(normalize(c.name))||n===normalize(c.short)||n.includes(normalize(c.short)))?.name||'';
  }
  function setStatus(kind,text,detail=''){
    const dot=$('#connectionDot'), label=$('#connectionText'), sub=$('#connectionDetail');
    if(dot)dot.className=`connection-dot ${kind}`;
    if(label)label.textContent=text;
    if(sub)sub.textContent=detail;
  }
  function effect(icon,title,subtitle=''){
    const el=$('#eventEffect'); if(!el)return;
    el.innerHTML=`<div><b>${icon}</b><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),2800);
  }
  function currentLeader(){return document.querySelector('.rank-row .club-name')?.textContent||''}
  function checkLeader(){const leader=currentLeader();if(lastLeader&&leader&&leader!==lastLeader)effect('👑','NOVO LÍDER',leader);lastLeader=leader}
  function giftPoints(name,diamondCount=1){const g=gifts().find(x=>normalize(x.name)===normalize(name));return Math.max(1,Number(g?.points||diamondCount||1))}
  function rememberGiftImage(name,url){if(!name||!/^https?:\/\//i.test(String(url||'')))return;giftImages[normalize(name)]=String(url);saveGiftImages()}
  function receiveGiftCatalog(data){(data?.gifts||[]).forEach(gift=>rememberGiftImage(gift.name,gift.imageUrl))}

  function receiveComment(data){
    const username=data.username||data.uniqueId||'usuário';
    const comment=data.comment||'';
    const club=findClub(comment);
    if(club){userClub.set(username,club);document.querySelectorAll('.rank-row').forEach(r=>{if(r.dataset.club===club)r.click()});effect('⚽',`${username} escolheu`,club)}
    addHistory('comment',{username,comment,club});
  }
  function receiveGift(data){
    const username=data.username||data.uniqueId||'usuário';
    const giftName=data.giftName||data.name||'Presente';
    rememberGiftImage(giftName,data.giftImageUrl||data.imageUrl);
    const mappedTeam=window.FutLiveTeamGifts?.resolveGift?.(giftName);
    const club=mappedTeam?.name||userClub.get(username)||findClub(data.comment||'')||clubs()[0]?.name;
    const points=mappedTeam?.points||giftPoints(giftName,data.diamondCount);
    if(club)window.FutLivePanel?.receiveGift({username,clubName:club,giftName,points,emoji:'🎁'});
    addHistory('gift',{username,giftName,points,club,repeatCount:data.repeatCount||1,imageUrl:data.giftImageUrl||''});
    effect(points>=100?'🔥':'🎁',`${username} enviou presente`,`${club||'Sem clube'} · +${points} pontos`);
    setTimeout(checkLeader,150);
  }
  function receiveLike(data){const username=data.username||data.uniqueId||'usuário';const count=Math.max(1,Number(data.likeCount||data.count||1));window.FutLivePanel?.receiveLike(username,count);addHistory('like',{username,count})}
  function receiveFollow(data){const username=data.username||data.uniqueId||'usuário';window.FutLivePanel?.receiveFollow(username);addHistory('follow',{username});effect('➕','NOVO SEGUIDOR',username)}

  function bindSocket(s){
    s.on('connect',()=>setStatus('online','Backend conectado','Aguardando conexão com a LIVE'));
    s.on('disconnect',()=>setStatus('offline','Backend desconectado','Reconectando automaticamente…'));
    s.on('connect_error',e=>setStatus('error','Erro no backend',e.message));
    s.on('tiktok:status',d=>setStatus(d.connected?'live':'online',d.connected?'LIVE conectada':'Backend conectado',d.message||d.username||''));
    s.on('tiktok:giftCatalog',receiveGiftCatalog);
    s.on('tiktok:comment',receiveComment);
    s.on('tiktok:gift',receiveGift);
    s.on('tiktok:like',receiveLike);
    s.on('tiktok:follow',receiveFollow);
    s.on('tiktok:roomUser',d=>{const el=$('#viewerCount');if(el)el.textContent=new Intl.NumberFormat('pt-BR',{notation:'compact'}).format(d.viewerCount||0)});
    s.on('tiktok:error',d=>{setStatus('error','Erro na LIVE',d.message||'Falha desconhecida');effect('⚠️','ERRO NA CONEXÃO',d.message||'')});
  }
  function connectBackend(){
    const url=cfg.backendUrl.trim().replace(/\/$/,'');
    if(!url||typeof io!=='function'){setStatus('error','Backend não configurado','Abra Conectar LIVE');return}
    socket?.disconnect();
    setStatus('loading','Conectando backend',url);
    socket=io(url,{transports:['websocket','polling'],reconnection:true,reconnectionDelay:1500,auth:{pin:cfg.adminPin}});
    bindSocket(socket);
  }
  function connectTikTok(username){
    if(!socket?.connected)return alert('Conecte primeiro ao backend.');
    const clean=String(username||'').replace(/^@/,'').trim();
    if(!clean)return alert('Digite o @ da conta.');
    socket.emit('tiktok:connect',{username:clean,pin:cfg.adminPin},reply=>{if(reply?.ok)setStatus('loading','Conectando à LIVE',`@${clean}`);else alert(reply?.error||'Não foi possível conectar')});
  }

  function openConnection(){
    const saved=panelState().tiktokUser||'';
    window.openModal?.(`<h3>Conectar TikTok LIVE</h3>
      <label>URL do backend<input id="rtBackend" class="modal-input" value="${esc(cfg.backendUrl)}" placeholder="https://seu-backend.onrender.com"></label>
      <label>PIN do administrador<input id="rtPin" class="modal-input" type="password" value="${esc(cfg.adminPin)}" placeholder="PIN definido no servidor"></label>
      <label>Usuário TikTok<input id="rtUser" class="modal-input" value="${esc(saved)}" placeholder="@usuario"></label>
      <label class="check-line"><input id="rtAuto" type="checkbox" ${cfg.autoConnect?'checked':''}> Reconectar automaticamente ao abrir</label>
      <button id="rtSave" class="modal-action">Salvar e conectar</button>
      <p class="helper-text">Ao conectar, o painel carrega as imagens reais dos presentes disponíveis na LIVE.</p>`);
    $('#rtSave').onclick=()=>{cfg.backendUrl=$('#rtBackend').value.trim();cfg.adminPin=$('#rtPin').value.trim();cfg.autoConnect=$('#rtAuto').checked;saveCfg();const user=$('#rtUser').value.trim();window.closeModal?.();connectBackend();setTimeout(()=>connectTikTok(user),1200)};
  }
  function exportCsv(){
    const rows=[['data','tipo','usuario','clube','presente','pontos','comentario']];
    history.forEach(e=>rows.push([e.time,e.type,e.username||'',e.club||'',e.giftName||'',e.points||e.count||'',e.comment||'']));
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=`fut-live-historico-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)
  }
  function openHistory(){
    const giftsOnly=history.filter(x=>x.type==='gift');
    const donors={};giftsOnly.forEach(x=>donors[x.username]=(donors[x.username]||0)+(Number(x.points)||0));
    const top=Object.entries(donors).sort((a,b)=>b[1]-a[1]).slice(0,10);
    window.openModal?.(`<h3>Histórico da live</h3><div class="history-summary"><div><b>${giftsOnly.length}</b><small>presentes</small></div><div><b>${history.length}</b><small>eventos</small></div><div><b>${Object.values(donors).reduce((a,b)=>a+b,0)}</b><small>pontos</small></div></div><h4>Top doadores</h4><div class="modal-list">${top.length?top.map(([u,p],i)=>`<div class="modal-item"><strong>${i+1}. ${esc(u)}</strong><small>${p} pts</small></div>`).join(''):'<p>Nenhum presente registrado.</p>'}</div><button id="exportHistory" class="modal-action">Exportar CSV</button><button id="clearHistory" class="modal-danger">Limpar histórico</button>`);
    $('#exportHistory').onclick=exportCsv;
    $('#clearHistory').onclick=()=>{if(confirm('Apagar todo o histórico?')){history=[];saveHistory();window.closeModal?.()}};
  }

  $('#connectLiveButton')?.addEventListener('click',openConnection);
  $('#historyButton')?.addEventListener('click',openHistory);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  if(cfg.autoConnect&&cfg.backendUrl)connectBackend();
  setTimeout(()=>{lastLeader=currentLeader()},800);
  window.FutLiveRealtime={connectBackend,connectTikTok,openConnection,openHistory};
})();