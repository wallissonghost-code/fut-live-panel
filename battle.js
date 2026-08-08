(() => {
  'use strict';
  const KEY='futLiveBattleV3';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const placeholder='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#141a16"/><stop offset="1" stop-color="#080b09"/></linearGradient></defs><rect width="600" height="600" rx="80" fill="url(#g)"/><circle cx="300" cy="230" r="82" fill="#1d2620"/><path d="M130 500c24-106 94-166 170-166s146 60 170 166" fill="#1d2620"/><circle cx="300" cy="300" r="220" fill="none" stroke="#8dff00" stroke-opacity=".28" stroke-width="8" stroke-dasharray="18 18"/><text x="300" y="558" fill="#8dff00" opacity=".8" font-family="Arial" font-size="32" font-weight="700" text-anchor="middle">ESCOLHA UMA IMAGEM</text></svg>`);

  const sideDefault=(name)=>({name,score:0,image:'',fit:'cover',posX:50,posY:50,zoom:1});
  function defaults(){return {side1:sideDefault('LADO 1'),side2:sideDefault('LADO 2'),lastEvent:'Aguardando a batalha começar',giftCount:0,likes:0}}
  function load(){
    const base=defaults();
    try{
      const old=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('futLiveBattleV2')||localStorage.getItem('futLiveBattleV1')||'{}');
      return {...base,...old,side1:{...base.side1,...old.side1},side2:{...base.side2,...old.side2}};
    }catch{return base}
  }
  let state=load();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{alert('A imagem é grande demais. Tente uma imagem menor.') }}
  function openModal(html){const root=document.querySelector('#appModal');const content=document.querySelector('#modalContent');if(!root||!content)return;content.innerHTML=html;root.classList.add('open');root.setAttribute('aria-hidden','false')}
  function closeModal(){const root=document.querySelector('#appModal');if(!root)return;root.classList.remove('open');root.setAttribute('aria-hidden','true')}
  window.openModal=openModal;window.closeModal=closeModal;
  document.addEventListener('click',e=>{if(e.target.matches('[data-close-modal]'))closeModal()});

  function imgStyle(side){
    const fit=side.fit==='contain'?'contain':'cover';
    const x=Math.min(100,Math.max(0,Number(side.posX)||50));
    const y=Math.min(100,Math.max(0,Number(side.posY)||50));
    const zoom=Math.min(2,Math.max(1,Number(side.zoom)||1));
    return `object-fit:${fit};object-position:${x}% ${y}%;transform:scale(${zoom});`;
  }
  function sideMarkup(side,num,isLeading){
    const img=side.image||placeholder;
    return `<section class="battle-side side-${num} ${isLeading?'is-leading':''}">
      <div class="battle-side-head"><span class="battle-side-label">${esc(side.name)}</span><span class="battle-side-number">LADO ${num}</span></div>
      <div class="battle-image-wrap"><img class="battle-main-image" src="${esc(img)}" style="${imgStyle(side)}" alt="Imagem do ${esc(side.name)}"></div>
      <div class="battle-score-wrap"><div class="battle-score">${Number(side.score)||0}</div><span class="battle-score-unit">PONTOS</span>${isLeading?'<span class="battle-leader-tag">👑 NA FRENTE</span>':''}</div>
      <div class="battle-manual admin-only"><button data-side="${num}" data-delta="-1">−1</button><button class="plus" data-side="${num}" data-delta="1">+1</button></div>
    </section>`
  }

  function render(){
    const root=document.querySelector('#battleBoard');if(!root)return;
    const s1=Number(state.side1.score)||0,s2=Number(state.side2.score)||0;
    root.innerHTML=`${sideMarkup(state.side1,1,s1>s2)}<div class="battle-vs"><strong>VS</strong></div>${sideMarkup(state.side2,2,s2>s1)}`;
    root.querySelectorAll('[data-delta]').forEach(btn=>btn.addEventListener('click',()=>addPoints(Number(btn.dataset.side),Number(btn.dataset.delta),'Ajuste manual')));
    const last=document.querySelector('#battleLastEvent');if(last)last.textContent=state.lastEvent;
    const gifts=document.querySelector('#giftCount');if(gifts)gifts.textContent=state.giftCount||0;
    const likes=document.querySelector('#likesCount');if(likes)likes.textContent=state.likes||0;
    const people=document.querySelector('#peopleLiking');if(people)people.textContent=state.likes||0;
    const prog=document.querySelector('#likesProgress');if(prog)prog.style.width=`${Math.min(100,state.likes||0)}%`;
    const event=document.querySelector('#eventName');if(event)event.textContent=`${state.side1.name} × ${state.side2.name}`;
  }

  function addPoints(side,points,source='Presente'){
    const target=side===2?state.side2:state.side1;const delta=Number(points)||0;
    target.score=Math.max(0,Number(target.score||0)+delta);
    state.lastEvent=`${source}: ${delta>=0?'+':''}${delta} para ${target.name}`;
    if(delta>0)state.giftCount=(Number(state.giftCount)||0)+1;
    save();render();
  }
  function reset(){state.side1.score=0;state.side2.score=0;state.giftCount=0;state.lastEvent='Batalha resetada';save();render()}

  function editorSide(num){const side=num===2?state.side2:state.side1;return `<section class="battle-editor-section">
    <h4>Lado ${num}</h4>
    <label>Nome<input class="modal-input" id="battleName${num}" value="${esc(side.name)}" placeholder="Ex.: Cruzeiro"></label>
    <div class="image-preview-box"><img id="battlePreview${num}" src="${esc(side.image||placeholder)}" style="${imgStyle(side)}" alt="Prévia do lado ${num}"></div>
    <label>Escolher imagem<input class="battle-file-input" id="battleFile${num}" type="file" accept="image/*"></label>
    <label>Ou colar URL da imagem<input class="modal-input" id="battleUrl${num}" type="url" value="${side.image&&/^https?:/i.test(side.image)?esc(side.image):''}" placeholder="https://..."></label>
    <div class="image-adjust-grid">
      <label>Enquadramento<select class="battle-count" id="battleFit${num}"><option value="cover" ${side.fit!=='contain'?'selected':''}>Preencher quadro</option><option value="contain" ${side.fit==='contain'?'selected':''}>Mostrar imagem inteira</option></select></label>
      <label>Zoom <strong id="zoomValue${num}">${Math.round((Number(side.zoom)||1)*100)}%</strong><input class="image-range" id="battleZoom${num}" type="range" min="100" max="200" step="5" value="${Math.round((Number(side.zoom)||1)*100)}"></label>
      <label>Horizontal <strong id="xValue${num}">${Number(side.posX)||50}%</strong><input class="image-range" id="battlePosX${num}" type="range" min="0" max="100" step="1" value="${Number(side.posX)||50}"></label>
      <label>Vertical <strong id="yValue${num}">${Number(side.posY)||50}%</strong><input class="image-range" id="battlePosY${num}" type="range" min="0" max="100" step="1" value="${Number(side.posY)||50}"></label>
    </div>
    <button type="button" class="battle-clear-image" id="battleClear${num}">Remover imagem</button>
  </section>`}

  function fileToDataUrl(file,preview){
    if(!file)return;
    if(file.size>3*1024*1024)return alert('Use uma imagem de até 3 MB.');
    const reader=new FileReader();reader.onload=()=>{preview.src=reader.result;preview.dataset.pending=reader.result};reader.readAsDataURL(file);
  }
  function bindImageAdjust(num){
    const preview=document.querySelector(`#battlePreview${num}`),fit=document.querySelector(`#battleFit${num}`),zoom=document.querySelector(`#battleZoom${num}`),x=document.querySelector(`#battlePosX${num}`),y=document.querySelector(`#battlePosY${num}`);
    const update=()=>{
      if(!preview)return;
      preview.style.objectFit=fit.value;
      preview.style.objectPosition=`${x.value}% ${y.value}%`;
      preview.style.transform=`scale(${Number(zoom.value)/100})`;
      document.querySelector(`#zoomValue${num}`).textContent=`${zoom.value}%`;
      document.querySelector(`#xValue${num}`).textContent=`${x.value}%`;
      document.querySelector(`#yValue${num}`).textContent=`${y.value}%`;
    };
    [fit,zoom,x,y].forEach(el=>el?.addEventListener('input',update));
    update();
  }

  function openConfig(){
    openModal(`<h3>Configurar batalha</h3><div class="battle-editor">${editorSide(1)}${editorSide(2)}</div><div class="battle-actions"><button id="saveBattle" class="modal-action">Salvar alterações</button><button id="resetBattleModal" class="modal-danger">Resetar placar</button></div><p class="helper-text">Use os controles de zoom e posição para enquadrar cada imagem exatamente como quiser.</p>`);
    [1,2].forEach(num=>{
      const file=document.querySelector(`#battleFile${num}`),preview=document.querySelector(`#battlePreview${num}`),url=document.querySelector(`#battleUrl${num}`),clear=document.querySelector(`#battleClear${num}`);
      file?.addEventListener('change',()=>fileToDataUrl(file.files?.[0],preview));
      url?.addEventListener('input',()=>{if(/^https?:\/\//i.test(url.value.trim())){preview.src=url.value.trim();preview.dataset.pending=url.value.trim()}});
      clear?.addEventListener('click',()=>{preview.src=placeholder;preview.dataset.pending='';if(url)url.value='';if(file)file.value=''})
      bindImageAdjust(num);
    });
    document.querySelector('#saveBattle')?.addEventListener('click',()=>{
      [1,2].forEach(num=>{
        const side=num===2?state.side2:state.side1;
        side.name=document.querySelector(`#battleName${num}`).value.trim()||`LADO ${num}`;
        const preview=document.querySelector(`#battlePreview${num}`),url=document.querySelector(`#battleUrl${num}`).value.trim();
        if(preview?.dataset.pending!==undefined)side.image=preview.dataset.pending;
        else if(url)side.image=url;
        side.fit=document.querySelector(`#battleFit${num}`).value;
        side.zoom=Number(document.querySelector(`#battleZoom${num}`).value)/100;
        side.posX=Number(document.querySelector(`#battlePosX${num}`).value);
        side.posY=Number(document.querySelector(`#battlePosY${num}`).value);
      });
      save();render();closeModal();
    });
    document.querySelector('#resetBattleModal')?.addEventListener('click',()=>{if(confirm('Zerar o placar dos dois lados?')){reset();closeModal()}})
  }

  function receiveGift({side,points=1,username='usuário',giftName='Presente'}){const s=Number(side)===2?2:1;addPoints(s,Math.max(1,Number(points)||1),`${username} · ${giftName}`);const u=document.querySelector('#lastGiftUser');if(u)u.textContent=username;const n=document.querySelector('#lastGiftName');if(n)n.textContent=`${giftName} · +${Math.max(1,Number(points)||1)}`;const a=document.querySelector('#lastGiftAvatar');if(a)a.textContent=String(username||'?')[0].toUpperCase()}
  function receiveLike(username,count=1){state.likes=(Number(state.likes)||0)+Math.max(1,Number(count)||1);save();render();const u=document.querySelector('#lastLikeUser');if(u)u.textContent=username;const a=document.querySelector('#lastLikeAvatar');if(a)a.textContent=String(username||'?')[0].toUpperCase()}
  function receiveFollow(username){const u=document.querySelector('#lastFollowerUser');if(u)u.textContent=username;const a=document.querySelector('#lastFollowerAvatar');if(a)a.textContent=String(username||'?')[0].toUpperCase()}
  function startCountdown(){let seconds=60*60;const el=document.querySelector('#countdown');setInterval(()=>{if(!el)return;const h=String(Math.floor(seconds/3600)).padStart(2,'0'),m=String(Math.floor((seconds%3600)/60)).padStart(2,'0'),s=String(seconds%60).padStart(2,'0');el.textContent=`${h}:${m}:${s}`;seconds=Math.max(0,seconds-1)},1000)}
  document.addEventListener('DOMContentLoaded',()=>{render();startCountdown();document.querySelector('#battleConfigButton')?.addEventListener('click',openConfig);document.querySelector('#battleResetButton')?.addEventListener('click',()=>{if(confirm('Zerar o placar dos dois lados?'))reset()})});
  window.FutLiveBattle={render,openConfig,reset,addPoints,receiveGift,getState:()=>state};
  window.FutLivePanel={receiveLike,receiveFollow};
})();