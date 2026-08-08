(() => {
  'use strict';
  const STORAGE_KEY='futLiveBattleV5';
  const $=s=>document.querySelector(s);
  let activeSide=1;
  let source='';
  let image=null;
  let naturalW=0,naturalH=0,baseScale=1,zoom=1,offsetX=0,offsetY=0;
  let dragging=false,lastX=0,lastY=0,activePointerId=null;

  function getState(){return window.FutLiveBattle?.getState?.()||null}
  function side(){const s=getState();return activeSide===2?s?.side2:s?.side1}
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function stage(){return $('#cropStage')}
  function stageImg(){return $('#cropImage')}
  function setStatus(text,ok=false){const el=$('#cropStatus');if(!el)return;el.textContent=text;el.classList.toggle('ok',ok)}
  function updateZoomLabel(){const el=$('#cropZoomValue');if(el)el.textContent=`${Math.round(zoom*100)}%`;const range=$('#cropZoom');if(range)range.value=Math.round(zoom*100)}
  function applyTransform(){const img=stageImg();if(!img||!image)return;const w=naturalW*baseScale,h=naturalH*baseScale;img.style.width=`${w}px`;img.style.height=`${h}px`;img.style.transform=`translate(-50%,-50%) translate3d(${Math.round(offsetX)}px,${Math.round(offsetY)}px,0) scale(${zoom})`;updateZoomLabel()}
  function computeScale(mode='cover'){
    const box=stage();if(!box||!naturalW||!naturalH)return;
    const rect=box.getBoundingClientRect(),w=Math.round(rect.width),h=Math.round(rect.height);
    if(!w||!h)return;
    baseScale=mode==='contain'?Math.min(w/naturalW,h/naturalH):Math.max(w/naturalW,h/naturalH);
    zoom=1;offsetX=0;offsetY=0;applyTransform();setStatus(mode==='contain'?'Imagem inteira ajustada.':'Quadro preenchido.',true)
  }
  function center(){offsetX=0;offsetY=0;applyTransform();setStatus('Imagem centralizada.',true)}
  function reset(){computeScale('cover')}
  function loadSource(src,mode='cover'){
    source=src||'';const img=stageImg(),empty=$('#cropEmpty');dragging=false;activePointerId=null;
    if(!src){image=null;if(img)img.hidden=true;if(empty)empty.hidden=false;setStatus('Escolha uma imagem para começar.');return}
    const loader=new Image();
    if(/^https?:/i.test(src))loader.crossOrigin='anonymous';
    loader.onload=()=>{image=loader;naturalW=loader.naturalWidth;naturalH=loader.naturalHeight;if(img){img.src=src;img.hidden=false}if(empty)empty.hidden=true;requestAnimationFrame(()=>requestAnimationFrame(()=>computeScale(mode)))};
    loader.onerror=()=>{image=null;if(img)img.hidden=true;if(empty)empty.hidden=false;setStatus('Não consegui abrir essa imagem para recortar. Se for um link, baixe a foto e envie pelo botão Escolher foto.')};
    loader.src=src;
  }
  function switchSide(num){activeSide=num;dragging=false;activePointerId=null;document.querySelectorAll('[data-crop-side]').forEach(b=>b.classList.toggle('active',Number(b.dataset.cropSide)===num));const s=side();const name=$('#cropCurrentName');if(name)name.innerHTML=`Editando <span>${esc(s?.name||`Lado ${num}`)}</span>`;loadSource(s?.image||'','cover')}
  function fileChosen(file){if(!file)return;if(file.size>8*1024*1024)return alert('Escolha uma imagem de até 8 MB.');const reader=new FileReader();reader.onload=()=>loadSource(String(reader.result),'cover');reader.readAsDataURL(file)}
  function pointerDown(e){if(!image||dragging)return;if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;activePointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;stage()?.setPointerCapture?.(e.pointerId);e.preventDefault()}
  function pointerMove(e){if(!dragging||!image||e.pointerId!==activePointerId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)>80||Math.abs(dy)>80){lastX=e.clientX;lastY=e.clientY;return}offsetX+=dx;offsetY+=dy;lastX=e.clientX;lastY=e.clientY;applyTransform();e.preventDefault()}
  function pointerUp(e){if(activePointerId!==null&&e.pointerId!==activePointerId)return;dragging=false;try{stage()?.releasePointerCapture?.(e.pointerId)}catch{}activePointerId=null}
  function saveCrop(){
    if(!image)return alert('Escolha uma imagem primeiro.');
    const box=stage();if(!box)return;
    const rect=box.getBoundingClientRect(),boxW=Math.round(rect.width),boxH=Math.round(rect.height);if(!boxW||!boxH)return;
    const outW=800,outH=1000,ratioX=outW/boxW,ratioY=outH/boxH;
    const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#060806';ctx.fillRect(0,0,outW,outH);
    const drawW=naturalW*baseScale*zoom*ratioX,drawH=naturalH*baseScale*zoom*ratioY;
    const x=outW/2+offsetX*ratioX-drawW/2,y=outH/2+offsetY*ratioY-drawH/2;
    try{ctx.drawImage(image,x,y,drawW,drawH)}catch{return alert('Não foi possível salvar esse link de imagem. Baixe a foto e envie pelo botão Escolher foto.')}
    let data='';try{data=canvas.toDataURL('image/webp',.9)}catch{return alert('Esse link não permite recorte por segurança do navegador. Baixe a imagem e envie pelo botão Escolher foto.')}
    const st=getState();if(!st)return;const target=activeSide===2?st.side2:st.side1;target.image=data;target.fit='cover';target.zoom=1;target.posX=50;target.posY=50;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(st))}catch{return alert('A imagem ficou grande demais para salvar. Tente outra foto.')}
    window.FutLiveBattle?.render?.();setStatus(`Enquadramento do Lado ${activeSide} salvo exatamente como está na prévia.`,true)
  }
  function open(){
    const st=getState();if(!st)return alert('Aguarde o painel carregar.');
    window.openModal?.(`<h3>Enquadrar fotos</h3><div class="crop-editor-shell"><div class="crop-side-tabs"><button type="button" data-crop-side="1">Lado 1</button><button type="button" data-crop-side="2">Lado 2</button></div><div class="crop-current-name" id="cropCurrentName"></div><div class="crop-workspace"><div class="crop-stage-wrap"><div class="crop-stage" id="cropStage"><img id="cropImage" alt="Imagem para recortar" hidden><div class="crop-empty" id="cropEmpty">Escolha uma foto.<br>Depois arraste diretamente com o dedo ou mouse.</div></div></div><div class="crop-controls"><label class="crop-file-label">Escolher foto<input id="cropFile" type="file" accept="image/*"></label><label>Zoom <span class="crop-value" id="cropZoomValue">100%</span><input id="cropZoom" type="range" min="25" max="400" value="100" step="1"></label><div class="crop-button-grid"><button id="cropFill" type="button">Preencher</button><button id="cropContain" type="button">Imagem inteira</button><button id="cropCenter" type="button">Centralizar</button><button id="cropReset" type="button">Resetar</button></div><p class="crop-help">A foto só se move enquanto seu dedo estiver pressionado dentro do quadro.</p><button id="cropSave" class="crop-save" type="button">Salvar este enquadramento</button><div id="cropStatus" class="crop-status"></div></div></div></div>`);
    document.querySelectorAll('[data-crop-side]').forEach(b=>b.addEventListener('click',()=>switchSide(Number(b.dataset.cropSide))));
    $('#cropFile')?.addEventListener('change',e=>fileChosen(e.target.files?.[0]));
    $('#cropZoom')?.addEventListener('input',e=>{zoom=Math.max(.25,Math.min(4,Number(e.target.value)/100));applyTransform()});
    $('#cropFill')?.addEventListener('click',()=>computeScale('cover'));$('#cropContain')?.addEventListener('click',()=>computeScale('contain'));$('#cropCenter')?.addEventListener('click',center);$('#cropReset')?.addEventListener('click',reset);$('#cropSave')?.addEventListener('click',saveCrop);
    const box=stage();box?.addEventListener('pointerdown',pointerDown,{passive:false});box?.addEventListener('pointermove',pointerMove,{passive:false});box?.addEventListener('pointerup',pointerUp);box?.addEventListener('pointercancel',pointerUp);box?.addEventListener('lostpointercapture',()=>{dragging=false;activePointerId=null});
    switchSide(activeSide);
  }
  document.addEventListener('DOMContentLoaded',()=>{$('#cropEditorButton')?.addEventListener('click',open)});
  window.FutLiveCropEditor={open};
})();