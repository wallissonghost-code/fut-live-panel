(() => {
  'use strict';
  const CFG_KEY='futLiveRealtimeConfigV1';
  const HISTORY_KEY='futLiveHistoryV1';
  const $=s=>document.querySelector(s);
  let socket=null;
  let cfg=loadCfg();
  let history=loadHistory();
  let pendingTikTokUser='';
  let liveConnected=false;
  let lastLiveError='';
  const userSide=new Map();

  function defaults(){return {backendUrl:'',adminPin:'',autoConnect:false,tiktokUsername:''}}
  function loadCfg(){try{return {...defaults(),...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}}catch{return defaults()}}
  function saveCfg(){localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}
  function loadHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return []}}
  function saveHistory(){history=history.slice(0,500);localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}
  function addHistory(type,data){history.unshift({time:new Date().toISOString(),type,...data});saveHistory()}
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function setStatus(kind,text,detail=''){const dot=$('#connectionDot'),label=$('#connectionText'),sub=$('#connectionDetail');if(dot)dot.className=`connection-dot ${kind}`;if(label)label.textContent=text;if(sub){sub.textContent=detail;sub.hidden=false}}
  function effect(icon,title,subtitle=''){const el=$('#eventEffect');if(!el)return;el.innerHTML=`<div><b>${icon}</b><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div>`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
  function cleanUser(username=''){return String(username||'').replace(/^@/,'').trim()}
  function parseSide(comment=''){const n=String(comment).trim().toLowerCase().replace(/\s+/g,'');if(['1','lado1','time1','equipe1'].includes(n))return 1;if(['2','lado2','time2','equipe2'].includes(n))return 2;return 0}

  function showLiveError(message){
    lastLiveError=String(message||'Falha desconhecida');
    setStatus('error','Erro na LIVE',lastLiveError);
    effect('⚠️','ERRO NA CONEXÃO',lastLiveError);
    if(window.openModal){
      window.openModal(`<h3>Não consegui entrar na LIVE</h3><div class="modal-list"><div class="modal-item"><strong>Diagnóstico</strong><small style="white-space:normal;line-height:1.45">${esc(lastLiveError)}</small></div><div class="modal-item"><strong>Conta usada</strong><small>@${esc(cfg.tiktokUsername||'não informada')}</small></div></div><div class="battle-actions"><button id="retryTikTokLive" class="modal-action" type="button">Tentar novamente</button><button id="editTikTokConnection" type="button">Editar conexão</button></div><p class="helper-text">Sua LIVE pode estar aberta normalmente e, mesmo assim, o TikTok bloquear temporariamente o conector externo. O texto acima mostra em qual etapa ocorreu a falha.</p>`);
      $('#retryTikTokLive')?.addEventListener('click',()=>{window.closeModal?.();connectTikTok(cfg.tiktokUsername)});
      $('#editTikTokConnection')?.addEventListener('click',()=>{window.closeModal?.();setTimeout(openConnection,50)});
    }
  }

  function receiveComment(data){const username=data.username||data.uniqueId||'usuário';const comment=data.comment||'';const side=parseSide(comment);if(side){userSide.set(username,side);effect('⚔️',`${username} escolheu`,`Lado ${side}`)}addHistory('comment',{username,comment,side})}
  function receiveGift(data){const username=data.username||data.uniqueId||'usuário';const giftName=data.giftName||data.name||'Presente';const side=userSide.get(username);const points=Math.max(1,Number(data.diamondCount||1))*Math.max(1,Number(data.repeatCount||1));if(!side){effect('⚠️',`${username} enviou presente`,'Comente 1 ou 2 antes para escolher um lado');addHistory('gift',{username,giftName,points,side:0});return}window.FutLiveBattle?.receiveGift({side,points,username,giftName});addHistory('gift',{username,giftName,points,side});effect('🎁',`${username} pontuou`,`Lado ${side} · +${points}`)}
  function receiveLike(data){const username=data.username||data.uniqueId||'usuário';const count=Math.max(1,Number(data.likeCount||data.count||1));const side=userSide.get(username)||0;window.FutLiveBattle?.receiveLike(username,count,side);addHistory('like',{username,count,side});if(side){const rules=window.FutLiveBattle?.getState?.().rules;const every=Math.max(1,Number(rules?.likesPerPoint)||10);effect('❤️',`${username} curtiu`,`Lado ${side} · ${count} curtida${count===1?'':'s'} · ${every} = 1 ponto`)}}
  function receiveFollow(data){const username=data.username||data.uniqueId||'usuário';const side=userSide.get(username)||0;const points=window.FutLiveBattle?.receiveFollow(username,side)||0;addHistory('follow',{username,side,points});if(side)effect('➕',`${username} seguiu`,`Lado ${side} · +${points} pontos`);else effect('➕','NOVO SEGUIDOR',`${username} · comente 1 ou 2 para escolher um lado`)}

  function connectTikTok(username){
    const clean=cleanUser(username||cfg.tiktokUsername);
    if(!clean)return setStatus('online','Backend conectado','Informe o @ da LIVE');
    cfg.tiktokUsername=clean;saveCfg();
    if(!socket?.connected){pendingTikTokUser=clean;setStatus('loading','Aguardando backend',`Depois vou conectar @${clean}`);return}
    pendingTikTokUser='';lastLiveError='';
    setStatus('loading','Conectando à LIVE',`@${clean}`);
    socket.emit('tiktok:connect',{username:clean,pin:cfg.adminPin},reply=>{
      if(!reply?.ok){liveConnected=false;showLiveError(reply?.error||`Não foi possível conectar @${clean}`);return}
      setStatus('loading','Entrando na LIVE',`@${clean}`);
    });
  }

  function bindSocket(s){
    s.on('connect',()=>{
      setStatus('online','Backend conectado','Verificando LIVE…');
      const user=cleanUser(pendingTikTokUser||((cfg.autoConnect||cfg.tiktokUsername)?cfg.tiktokUsername:''));
      if(user)connectTikTok(user);
    });
    s.on('disconnect',()=>{liveConnected=false;setStatus('offline','Backend desconectado','Reconectando automaticamente…')});
    s.on('connect_error',e=>{liveConnected=false;setStatus('error','Erro no backend',e.message)});
    s.on('tiktok:status',d=>{
      liveConnected=!!d.connected;
      if(d.connected){
        lastLiveError='';
        const user=cleanUser(d.username||cfg.tiktokUsername);
        setStatus('live','LIVE CONECTADA',user?`@${user} · interações ativas`:'Interações ativas');
        effect('✅','LIVE CONECTADA',user?`@${user}`:'Interações liberadas');
      }else if(!lastLiveError){
        setStatus('online','Backend conectado',d.message||'Nenhuma LIVE conectada');
      }
    });
    s.on('tiktok:comment',receiveComment);s.on('tiktok:gift',receiveGift);s.on('tiktok:like',receiveLike);s.on('tiktok:follow',receiveFollow);
    s.on('tiktok:roomUser',d=>{const el=$('#viewerCount');if(el)el.textContent=new Intl.NumberFormat('pt-BR',{notation:'compact'}).format(d.viewerCount||0)});
    s.on('tiktok:error',d=>{liveConnected=false;showLiveError(d.message||'Falha desconhecida')});
  }

  function connectBackend(){
    const url=cfg.backendUrl.trim().replace(/\/$/,'');
    if(!url||typeof io!=='function'){setStatus('error','Backend não configurado','Abra Conectar LIVE');return}
    socket?.disconnect();
    setStatus('loading','Conectando backend','Aguarde: Render pode levar alguns segundos para acordar');
    socket=io(url,{transports:['websocket','polling'],reconnection:true,reconnectionDelay:1500,reconnectionAttempts:Infinity,timeout:60000,auth:{pin:cfg.adminPin}});
    bindSocket(socket);
  }

  function openConnection(){
    window.openModal?.(`<h3>Conectar TikTok LIVE</h3><label>URL do backend<input id="rtBackend" class="modal-input" value="${esc(cfg.backendUrl)}" placeholder="https://seu-backend.onrender.com"></label><label>PIN do administrador<input id="rtPin" class="modal-input" type="password" value="${esc(cfg.adminPin)}"></label><label>Usuário TikTok<input id="rtUser" class="modal-input" value="${esc(cfg.tiktokUsername)}" placeholder="@usuario"></label><label class="check-line"><input id="rtAuto" type="checkbox" ${cfg.autoConnect?'checked':''}> Reconectar LIVE automaticamente</label><button id="rtSave" class="modal-action">Conectar à LIVE</button><p class="helper-text">Espere aparecer <b>LIVE CONECTADA</b> no topo. “Backend conectado” sozinho não significa que as interações do TikTok já estão ativas.</p>`);
    $('#rtSave').onclick=()=>{
      cfg.backendUrl=$('#rtBackend').value.trim();cfg.adminPin=$('#rtPin').value.trim();cfg.autoConnect=$('#rtAuto').checked;cfg.tiktokUsername=cleanUser($('#rtUser').value);saveCfg();
      if(!cfg.tiktokUsername)return alert('Digite o @ da conta que está fazendo a LIVE.');
      pendingTikTokUser=cfg.tiktokUsername;lastLiveError='';window.closeModal?.();
      if(socket?.connected)connectTikTok(cfg.tiktokUsername);else connectBackend();
    };
  }

  function openHistory(){const scored=history.filter(x=>x.side);const s1=scored.filter(x=>x.side===1).reduce((a,b)=>a+(Number(b.points)||0),0);const s2=scored.filter(x=>x.side===2).reduce((a,b)=>a+(Number(b.points)||0),0);window.openModal?.(`<h3>Histórico da batalha</h3><div class="history-summary"><div><b>${s1}</b><small>Lado 1</small></div><div><b>${s2}</b><small>Lado 2</small></div><div><b>${history.length}</b><small>eventos</small></div></div><div class="modal-list">${history.slice(0,30).map(e=>`<div class="modal-item"><strong>${esc(e.username||e.type)}</strong><small>${e.side?`Lado ${e.side} · ${esc(e.type)}${e.points?` · +${e.points}`:''}`:esc(e.comment||e.type)}</small></div>`).join('')||'<p>Nenhum evento.</p>'}</div><button id="clearHistory" class="modal-danger">Limpar histórico</button>`);$('#clearHistory').onclick=()=>{if(confirm('Apagar o histórico?')){history=[];saveHistory();window.closeModal?.()}}}

  $('#connectLiveButton')?.addEventListener('click',openConnection);$('#historyButton')?.addEventListener('click',openHistory);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  if(cfg.autoConnect&&cfg.backendUrl&&cfg.tiktokUsername){pendingTikTokUser=cfg.tiktokUsername;connectBackend()}
  else if(cfg.autoConnect&&cfg.backendUrl)connectBackend();
  window.FutLiveRealtime={connectBackend,connectTikTok,openConnection,openHistory,isLiveConnected:()=>liveConnected,getLastError:()=>lastLiveError};
})();