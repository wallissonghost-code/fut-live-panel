(() => {
  'use strict';
  const KEY='futLiveBattleV1';
  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fallbackTeams=()=>window.FutLiveTeamGifts?.teams||[];
  function defaults(){
    const t=fallbackTeams();
    return {side1:{name:'LADO 1',score:0,teams:t.slice(0,2).map(x=>x.name)},side2:{name:'LADO 2',score:0,teams:t.slice(2,4).map(x=>x.name)},lastEvent:'Aguardando a batalha começar'};
  }
  function load(){try{return {...defaults(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaults()}}
  let state=load();
  function save(){localStorage.setItem(KEY,JSON.stringify(state))}
  function teamByName(name){return fallbackTeams().find(t=>normalize(t.name)===normalize(name))}
  function teamCard(name){const t=teamByName(name);if(!t)return'';return `<div class="battle-team"><span class="battle-team-badge"><img src="${esc(t.logo)}" alt="Escudo ${esc(t.name)}"><b hidden>${esc(t.short)}</b></span><strong>${esc(t.name)}</strong></div>`}
  function render(){
    const root=document.querySelector('#battleBoard'); if(!root)return;
    root.innerHTML=`<section class="battle-side side-1"><div class="battle-side-head"><span class="battle-side-label">${esc(state.side1.name)}</span><small>${state.side1.teams.length} time${state.side1.teams.length===1?'':'s'}</small></div><div class="battle-score" id="side1Score">${state.side1.score}</div><div class="battle-teams">${state.side1.teams.map(teamCard).join('')}</div><div class="battle-manual admin-only"><button data-side="1" data-delta="-1">−1</button><button class="plus" data-side="1" data-delta="1">+1</button></div></section><div class="battle-vs">VS</div><section class="battle-side side-2"><div class="battle-side-head"><span class="battle-side-label">${esc(state.side2.name)}</span><small>${state.side2.teams.length} time${state.side2.teams.length===1?'':'s'}</small></div><div class="battle-score" id="side2Score">${state.side2.score}</div><div class="battle-teams">${state.side2.teams.map(teamCard).join('')}</div><div class="battle-manual admin-only"><button data-side="2" data-delta="-1">−1</button><button class="plus" data-side="2" data-delta="1">+1</button></div></section>`;
    root.querySelectorAll('[data-delta]').forEach(btn=>btn.addEventListener('click',()=>addPoints(Number(btn.dataset.side),Number(btn.dataset.delta),'Ajuste manual')));
    const last=document.querySelector('#battleLastEvent');if(last)last.textContent=state.lastEvent;
    root.querySelectorAll('.battle-team-badge img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false}));
  }
  function addPoints(side,points,source='Presente'){
    const target=side===2?state.side2:state.side1;
    target.score=Math.max(0,Number(target.score||0)+Number(points||0));
    state.lastEvent=`${source}: +${Math.max(0,Number(points||0))} para ${target.name}`;
    save();render();
    document.querySelector('#giftCount')?.replaceChildren(document.createTextNode(String((Number(document.querySelector('#giftCount')?.textContent)||0)+(points>0?1:0))));
  }
  function reset(){state.side1.score=0;state.side2.score=0;state.lastEvent='Batalha resetada';save();render()}
  function selectOptions(selected,used){return fallbackTeams().map(t=>`<option value="${esc(t.name)}" ${selected===t.name?'selected':''} ${used.includes(t.name)&&selected!==t.name?'disabled':''}>${esc(t.name)}</option>`).join('')}
  function editorSide(sideNum){
    const side=sideNum===2?state.side2:state.side1;
    const used=sideNum===2?state.side1.teams:state.side2.teams;
    return `<section class="battle-editor-section"><h4>${sideNum===1?'Lado 1':'Lado 2'}</h4><label>Nome<input class="modal-input" id="battleName${sideNum}" value="${esc(side.name)}"></label><label>Quantidade de times<select class="battle-count" id="battleCount${sideNum}">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${side.teams.length===n?'selected':''}>${n}</option>`).join('')}</select></label><div class="battle-team-selects" id="battleSelects${sideNum}"></div></section>`;
  }
  function rebuildSelects(sideNum){
    const count=Number(document.querySelector(`#battleCount${sideNum}`).value)||1;
    const side=sideNum===2?state.side2:state.side1;
    const other=sideNum===2?state.side1.teams:state.side2.teams;
    const box=document.querySelector(`#battleSelects${sideNum}`);if(!box)return;
    box.innerHTML=Array.from({length:count},(_,i)=>`<label>Time ${i+1}<select class="battle-count" data-battle-team="${sideNum}">${selectOptions(side.teams[i]||fallbackTeams().find(t=>!other.includes(t.name))?.name||fallbackTeams()[0]?.name||'',other)}</select></label>`).join('');
  }
  function openConfig(){
    window.openModal?.(`<h3>Configurar batalha</h3><div class="battle-editor">${editorSide(1)}${editorSide(2)}</div><div class="battle-actions"><button id="saveBattle" class="modal-action">Salvar batalha</button><button id="resetBattleModal" class="modal-danger">Resetar placar</button></div><p class="helper-text">Na LIVE, a pessoa comenta <b>1</b> ou <b>2</b> para escolher o lado. O próximo presente soma o valor daquele presente ao lado escolhido.</p>`);
    rebuildSelects(1);rebuildSelects(2);
    document.querySelector('#battleCount1')?.addEventListener('change',()=>rebuildSelects(1));
    document.querySelector('#battleCount2')?.addEventListener('change',()=>rebuildSelects(2));
    document.querySelector('#saveBattle')?.addEventListener('click',()=>{
      const side1Teams=[...document.querySelectorAll('[data-battle-team="1"]')].map(x=>x.value);
      const side2Teams=[...document.querySelectorAll('[data-battle-team="2"]')].map(x=>x.value);
      if(new Set([...side1Teams,...side2Teams]).size!==side1Teams.length+side2Teams.length)return alert('Não repita o mesmo time nos dois lados.');
      state.side1.name=document.querySelector('#battleName1').value.trim()||'LADO 1';state.side2.name=document.querySelector('#battleName2').value.trim()||'LADO 2';state.side1.teams=side1Teams;state.side2.teams=side2Teams;save();render();window.closeModal?.();
    });
    document.querySelector('#resetBattleModal')?.addEventListener('click',()=>{if(confirm('Zerar o placar dos dois lados?')){reset();window.closeModal?.()}});
  }
  function receiveGift({side,points=1,username='usuário',giftName='Presente'}){const s=Number(side)===2?2:1;addPoints(s,Math.max(1,Number(points)||1),`${username} · ${giftName}`)}
  document.addEventListener('DOMContentLoaded',()=>{render();document.querySelector('#battleConfigButton')?.addEventListener('click',openConfig);document.querySelector('#battleResetButton')?.addEventListener('click',()=>{if(confirm('Zerar o placar dos dois lados?'))reset()})});
  window.FutLiveBattle={render,openConfig,reset,addPoints,receiveGift,getState:()=>state};
})();