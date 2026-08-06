const DEFAULT_CLUBS = [
  ['Palmeiras','PAL',2450,'#146b35'],['Flamengo','FLA',2120,'#a81522'],['São Paulo','SPF',1980,'#d12c32'],['Corinthians','COR',1750,'#202020'],['Atlético MG','CAM',1240,'#252525'],['Grêmio','GRE',980,'#1680bb'],['Internacional','INT',870,'#c8202f'],['Cruzeiro','CRU',760,'#234da0'],['Vasco','VAS',640,'#353535'],['Botafogo','BOT',520,'#191919'],['Athletico PR','CAP',410,'#bb2028'],['Santos','SAN',360,'#333333'],['Fortaleza','FOR',300,'#2f64b5'],['Bahia','BAH',220,'#2765b3'],['Coritiba','CFC',180,'#17733b'],['Sport','SPO',120,'#b71c2a'],['Cuiabá','CUI',80,'#e0b715'],['Goiás','GOI',40,'#158445'],['Juventude','JUV',20,'#298a50'],['América MG','AME',10,'#18854a']
].map(([name,short,points,color]) => ({ name, short, points, color }));

const DEFAULT_GIFTS = [
  { name:'Rosa', points:1, emoji:'🌹' },
  { name:'Coração', points:5, emoji:'💚' },
  { name:'Bola', points:10, emoji:'⚽' },
  { name:'Troféu', points:25, emoji:'🏆' },
  { name:'Leão', points:100, emoji:'🦁' }
];

const STORAGE_KEY = 'futLivePanelStateV2';
const users = ['ghostzada','gbzins_x','knzinsc7','guizinn870','futebol_raiz','cruzeirense10','tropa_do_fut'];
let state = loadState();
let selectedClub = null;
let countdownTimer;

const $ = selector => document.querySelector(selector);
const rankingList = $('#rankingList');
const toast = $('#toast');

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      clubs: saved?.clubs?.length ? saved.clubs : clone(DEFAULT_CLUBS),
      gifts: saved?.gifts?.length ? saved.gifts : clone(DEFAULT_GIFTS),
      likes: Number(saved?.likes ?? 5),
      giftCount: Number(saved?.giftCount ?? 123),
      goal: Number(saved?.goal ?? 50),
      eventName: saved?.eventName || 'SÁBADO PREMIADO',
      goalMessage: saved?.goalMessage || 'MANDE PRESENTE E CONCORRA',
      tiktokUser: saved?.tiktokUser || '',
      durationMinutes: Number(saved?.durationMinutes ?? 84)
    };
  } catch { return { clubs:clone(DEFAULT_CLUBS), gifts:clone(DEFAULT_GIFTS), likes:5, giftCount:123, goal:50, eventName:'SÁBADO PREMIADO', goalMessage:'MANDE PRESENTE E CONCORRA', tiktokUser:'', durationMinutes:84 }; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function formatPoints(value){ return new Intl.NumberFormat('pt-BR').format(value); }
function randomItem(items){ return items[Math.floor(Math.random()*items.length)]; }
function escapeHtml(value=''){ return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function renderAll(){
  $('#goalCount').textContent = state.goal;
  $('#eventName').textContent = state.eventName;
  $('#goalMessage').textContent = state.goalMessage;
  $('#giftCount').textContent = state.giftCount;
  updateLikes();
  renderRanking();
}

function renderRanking(highlightName=''){
  state.clubs.sort((a,b)=>b.points-a.points);
  const max = state.clubs[0]?.points || 1;
  rankingList.innerHTML = state.clubs.map((club,index)=>`
    <article class="rank-row top-${index+1} ${club.name===highlightName?'updated':''} ${club.name===selectedClub?'selected':''}" data-club="${escapeHtml(club.name)}" role="button" tabindex="0">
      <div class="position">${index<3?['🥇','🥈','🥉'][index]:index+1}</div>
      <div class="club-badge" style="--club:${club.color}">${escapeHtml(club.short)}</div>
      <div class="club-data"><div class="club-name-line"><span class="club-name">${escapeHtml(club.name)}</span><span class="club-gift">🏆</span></div><div class="progress-track"><span style="width:${Math.max(3,(club.points/max)*100)}%"></span></div></div>
      <div class="points">${formatPoints(club.points)}<small>PTS</small></div>
    </article>`).join('');
  rankingList.querySelectorAll('.rank-row').forEach(row=>{
    const select=()=>{ selectedClub=row.dataset.club; renderRanking(); showToast(`⚽ ${selectedClub} selecionado`); };
    row.addEventListener('click',select);
    row.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();select();} });
  });
}

function updateLikes(){
  $('#likesCount').textContent=state.likes;
  $('#peopleLiking').textContent=Math.min(999,state.likes);
  $('#likesProgress').style.width=`${Math.min(100,state.likes)}%`;
}
function showToast(message){ toast.textContent=message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200); }

function simulateGift(giftOverride){
  const club = selectedClub ? state.clubs.find(c=>c.name===selectedClub) : randomItem(state.clubs);
  const user = randomItem(users);
  const gift = giftOverride || randomItem(state.gifts);
  club.points += Number(gift.points)||0;
  state.giftCount += 1;
  $('#lastGiftUser').textContent=user;
  $('#lastGiftAvatar').textContent=user[0].toUpperCase();
  $('#lastGiftName').textContent=`${gift.name} · +${gift.points} ponto${gift.points==1?'':'s'}`;
  saveState(); renderRanking(club.name); $('#giftCount').textContent=state.giftCount;
  showToast(`${gift.emoji} ${user} marcou ${gift.points} para ${club.name}`);
}
function registerLike(){
  state.likes+=1; const user=randomItem(users);
  $('#lastLikeUser').textContent=user; $('#lastLikeAvatar').textContent=user[0].toUpperCase();
  updateLikes(); saveState(); showToast(`❤ ${user} curtiu a live`);
}

function startCountdown(){
  clearInterval(countdownTimer);
  let seconds=Math.max(60,state.durationMinutes*60);
  const tick=()=>{ const h=String(Math.floor(seconds/3600)).padStart(2,'0'); const m=String(Math.floor((seconds%3600)/60)).padStart(2,'0'); const s=String(seconds%60).padStart(2,'0'); $('#countdown').textContent=`${h}:${m}:${s}`; seconds=Math.max(0,seconds-1); };
  tick(); countdownTimer=setInterval(tick,1000);
}

function openModal(html){ $('#modalContent').innerHTML=html; $('#appModal').classList.add('open'); $('#appModal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('#appModal').classList.remove('open'); $('#appModal').setAttribute('aria-hidden','true'); }
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));

function openChat(){
  openModal(`<h3>Chat da live</h3><div class="modal-list" id="chatMessages"><div class="modal-item"><strong>cruzeirense10:</strong> Vai Cruzeiro! 💙</div><div class="modal-item"><strong>gbzins_x:</strong> Palmeiras na liderança!</div></div><input class="modal-input" id="chatInput" placeholder="Digite uma mensagem" maxlength="80"><button class="modal-action" id="sendChat">Enviar mensagem</button>`);
  $('#sendChat').onclick=()=>{ const input=$('#chatInput'); if(!input.value.trim())return; $('#chatMessages').insertAdjacentHTML('beforeend',`<div class="modal-item"><strong>Você:</strong> ${escapeHtml(input.value)}</div>`); input.value=''; };
}
function openPrizes(){
  openModal(`<h3>Presentes e pontos</h3><div class="modal-list">${state.gifts.map((g,i)=>`<button class="modal-item prize-test" data-gift="${i}"><strong>${g.emoji} ${escapeHtml(g.name)}</strong><small>${g.points} ponto${g.points==1?'':'s'}</small></button>`).join('')}</div>`);
  document.querySelectorAll('.prize-test').forEach(btn=>btn.onclick=()=>{ closeModal(); simulateGift(state.gifts[Number(btn.dataset.gift)]); });
}

function clubEditorRows(){ return state.clubs.map((c,i)=>`<div class="admin-club-row"><input data-club-name="${i}" value="${escapeHtml(c.name)}" aria-label="Nome"><input data-club-short="${i}" value="${escapeHtml(c.short)}" maxlength="4" aria-label="Sigla"><input data-club-points="${i}" type="number" min="0" value="${c.points}" aria-label="Pontos"><input data-club-color="${i}" type="color" value="${c.color}" aria-label="Cor"><button data-remove-club="${i}" type="button">×</button></div>`).join(''); }
function giftEditorRows(){ return state.gifts.map((g,i)=>`<div class="admin-gift-row"><input data-gift-emoji="${i}" value="${escapeHtml(g.emoji)}" maxlength="4"><input data-gift-name="${i}" value="${escapeHtml(g.name)}"><input data-gift-points="${i}" type="number" min="0" value="${g.points}"><button data-remove-gift="${i}" type="button">×</button></div>`).join(''); }

function openSettings(){
  openModal(`<h3>Painel administrativo</h3>
    <div class="admin-tabs"><button class="active" data-tab="general">Geral</button><button data-tab="clubs">Clubes</button><button data-tab="gifts">Presentes</button></div>
    <div class="admin-tab active" id="tab-general">
      <label>Usuário TikTok<input class="modal-input" id="admTikTok" value="${escapeHtml(state.tiktokUser)}" placeholder="@seuusuario"></label>
      <label>Nome do evento<input class="modal-input" id="admEvent" value="${escapeHtml(state.eventName)}"></label>
      <label>Meta de gols<input class="modal-input" id="admGoal" type="number" min="1" value="${state.goal}"></label>
      <label>Mensagem da meta<input class="modal-input" id="admGoalMessage" value="${escapeHtml(state.goalMessage)}"></label>
      <label>Duração da live em minutos<input class="modal-input" id="admDuration" type="number" min="1" value="${state.durationMinutes}"></label>
      <button class="modal-action" id="saveGeneral">Salvar configurações</button>
      <button class="modal-action broadcast-action" id="startBroadcast">📺 Entrar no modo transmissão</button>
      <button class="modal-danger" id="resetPanel">Zerar pontuação e curtidas</button>
    </div>
    <div class="admin-tab" id="tab-clubs"><div class="admin-head-row"><span>Nome</span><span>Sigla</span><span>Pontos</span><span>Cor</span><span></span></div><div id="clubEditor">${clubEditorRows()}</div><button class="modal-action" id="addClub">+ Adicionar clube</button><button class="modal-action" id="saveClubs">Salvar clubes</button></div>
    <div class="admin-tab" id="tab-gifts"><div id="giftEditor">${giftEditorRows()}</div><button class="modal-action" id="addGift">+ Adicionar presente</button><button class="modal-action" id="saveGifts">Salvar presentes</button></div>`);

  document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('[data-tab],.admin-tab').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $(`#tab-${btn.dataset.tab}`).classList.add('active'); });
  $('#saveGeneral').onclick=()=>{ state.tiktokUser=$('#admTikTok').value.trim(); state.eventName=$('#admEvent').value.trim()||'EVENTO AO VIVO'; state.goal=Math.max(1,Number($('#admGoal').value)||50); state.goalMessage=$('#admGoalMessage').value.trim()||'MANDE PRESENTE E CONCORRA'; state.durationMinutes=Math.max(1,Number($('#admDuration').value)||60); saveState(); renderAll(); startCountdown(); closeModal(); showToast('✅ Configurações salvas'); };
  $('#startBroadcast').onclick=()=>{ saveState(); closeModal(); enterBroadcastMode(); };
  $('#resetPanel').onclick=()=>{ if(!confirm('Zerar toda a pontuação e as curtidas?'))return; state.clubs.forEach(c=>c.points=0); state.likes=0; state.giftCount=0; selectedClub=null; saveState(); renderAll(); closeModal(); showToast('♻️ Painel zerado'); };
  bindClubEditor(); bindGiftEditor();
}

function bindClubEditor(){
  document.querySelectorAll('[data-remove-club]').forEach(btn=>btn.onclick=()=>{ if(state.clubs.length<=2)return showToast('Mantenha pelo menos 2 clubes'); state.clubs.splice(Number(btn.dataset.removeClub),1); $('#clubEditor').innerHTML=clubEditorRows(); bindClubEditor(); });
  $('#addClub').onclick=()=>{ state.clubs.push({name:'Novo clube',short:'NOV',points:0,color:'#1f7a45'}); $('#clubEditor').innerHTML=clubEditorRows(); bindClubEditor(); };
  $('#saveClubs').onclick=()=>{ state.clubs=state.clubs.map((c,i)=>({ name:document.querySelector(`[data-club-name="${i}"]`).value.trim()||`Clube ${i+1}`, short:document.querySelector(`[data-club-short="${i}"]`).value.trim().toUpperCase().slice(0,4)||'CLB', points:Math.max(0,Number(document.querySelector(`[data-club-points="${i}"]`).value)||0), color:document.querySelector(`[data-club-color="${i}"]`).value })); saveState(); renderRanking(); closeModal(); showToast('✅ Clubes salvos'); };
}
function bindGiftEditor(){
  document.querySelectorAll('[data-remove-gift]').forEach(btn=>btn.onclick=()=>{ if(state.gifts.length<=1)return; state.gifts.splice(Number(btn.dataset.removeGift),1); $('#giftEditor').innerHTML=giftEditorRows(); bindGiftEditor(); });
  $('#addGift').onclick=()=>{ state.gifts.push({emoji:'🎁',name:'Novo presente',points:1}); $('#giftEditor').innerHTML=giftEditorRows(); bindGiftEditor(); };
  $('#saveGifts').onclick=()=>{ state.gifts=state.gifts.map((g,i)=>({ emoji:document.querySelector(`[data-gift-emoji="${i}"]`).value.trim()||'🎁', name:document.querySelector(`[data-gift-name="${i}"]`).value.trim()||`Presente ${i+1}`, points:Math.max(0,Number(document.querySelector(`[data-gift-points="${i}"]`).value)||0) })); saveState(); closeModal(); showToast('✅ Presentes salvos'); };
}

async function enterBroadcastMode(){
  document.body.classList.add('broadcast-mode');
  $('#exitBroadcast').classList.add('show');
  try { await document.documentElement.requestFullscreen?.(); } catch {}
  if('wakeLock' in navigator){ try { window.panelWakeLock=await navigator.wakeLock.request('screen'); } catch {} }
  showToast('📺 Modo transmissão ativado');
}
async function exitBroadcastMode(){
  document.body.classList.remove('broadcast-mode'); $('#exitBroadcast').classList.remove('show');
  try { if(document.fullscreenElement) await document.exitFullscreen(); } catch {}
  try { await window.panelWakeLock?.release(); } catch {}
}

$('#simulateGift').onclick=()=>simulateGift();
$('#tapButton').onclick=registerLike;
$('#chatButton').onclick=openChat;
$('#rankingButton').onclick=()=>$('.ranking-panel').scrollIntoView({behavior:'smooth',block:'start'});
$('#prizesButton').onclick=openPrizes;
$('#settingsButton').onclick=openSettings;
$('#exitBroadcast').onclick=exitBroadcastMode;

renderAll(); startCountdown();

window.FutLivePanel={
  receiveGift({username,clubName,giftName,points=1,emoji='🎁'}){ const club=state.clubs.find(c=>c.name.toLowerCase()===String(clubName).toLowerCase()); if(!club)return false; const gift={name:giftName,points:Number(points)||0,emoji}; club.points+=gift.points; state.giftCount++; $('#lastGiftUser').textContent=username; $('#lastGiftAvatar').textContent=String(username)[0]?.toUpperCase()||'?'; $('#lastGiftName').textContent=`${gift.name} · +${gift.points} pontos`; saveState(); renderRanking(club.name); $('#giftCount').textContent=state.giftCount; return true; },
  receiveFollow(username){ $('#lastFollowerUser').textContent=username; $('#lastFollowerAvatar').textContent=String(username)[0]?.toUpperCase()||'?'; },
  receiveLike(username,count=1){ state.likes+=Number(count)||0; $('#lastLikeUser').textContent=username; $('#lastLikeAvatar').textContent=String(username)[0]?.toUpperCase()||'?'; updateLikes(); saveState(); }
};
