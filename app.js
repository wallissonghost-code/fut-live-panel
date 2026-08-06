const clubs = [
  { name: 'Palmeiras', short: 'PAL', points: 2450, color: '#146b35' },
  { name: 'Flamengo', short: 'FLA', points: 2120, color: '#a81522' },
  { name: 'São Paulo', short: 'SPF', points: 1980, color: '#d12c32' },
  { name: 'Corinthians', short: 'COR', points: 1750, color: '#202020' },
  { name: 'Atlético MG', short: 'CAM', points: 1240, color: '#252525' },
  { name: 'Grêmio', short: 'GRE', points: 980, color: '#1680bb' },
  { name: 'Internacional', short: 'INT', points: 870, color: '#c8202f' },
  { name: 'Cruzeiro', short: 'CRU', points: 760, color: '#234da0' },
  { name: 'Vasco', short: 'VAS', points: 640, color: '#353535' },
  { name: 'Botafogo', short: 'BOT', points: 520, color: '#191919' },
  { name: 'Athletico PR', short: 'CAP', points: 410, color: '#bb2028' },
  { name: 'Santos', short: 'SAN', points: 360, color: '#333333' },
  { name: 'Fortaleza', short: 'FOR', points: 300, color: '#2f64b5' },
  { name: 'Bahia', short: 'BAH', points: 220, color: '#2765b3' },
  { name: 'Coritiba', short: 'CFC', points: 180, color: '#17733b' },
  { name: 'Sport', short: 'SPO', points: 120, color: '#b71c2a' },
  { name: 'Cuiabá', short: 'CUI', points: 80, color: '#e0b715' },
  { name: 'Goiás', short: 'GOI', points: 40, color: '#158445' },
  { name: 'Juventude', short: 'JUV', points: 20, color: '#298a50' },
  { name: 'América MG', short: 'AME', points: 10, color: '#18854a' }
];

const initialPoints = Object.fromEntries(clubs.map(club => [club.name, club.points]));
const users = ['ghostzada', 'gbzins_x', 'knzinsc7', 'guizinn870', 'futebol_raiz', 'cruzeirense10', 'tropa_do_fut'];
const gifts = [
  { name: 'Rosa', points: 1, emoji: '🌹' },
  { name: 'Coração', points: 5, emoji: '💚' },
  { name: 'Bola', points: 10, emoji: '⚽' },
  { name: 'Troféu', points: 25, emoji: '🏆' },
  { name: 'Leão', points: 100, emoji: '🦁' }
];

const rankingList = document.querySelector('#rankingList');
const toast = document.querySelector('#toast');
const likesCount = document.querySelector('#likesCount');
const likesProgress = document.querySelector('#likesProgress');
const peopleLiking = document.querySelector('#peopleLiking');
let likes = 5;
let selectedClub = null;

function formatPoints(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function renderRanking(highlightName = '') {
  clubs.sort((a, b) => b.points - a.points);
  const max = clubs[0]?.points || 1;
  rankingList.innerHTML = clubs.map((club, index) => `
    <article class="rank-row top-${index + 1} ${club.name === highlightName ? 'updated' : ''} ${club.name === selectedClub ? 'selected' : ''}" data-club="${club.name}" role="button" tabindex="0">
      <div class="position">${index + 1 <= 3 ? ['🥇','🥈','🥉'][index] : index + 1}</div>
      <div class="club-badge" style="--club:${club.color}">${club.short}</div>
      <div class="club-data">
        <div class="club-name-line">
          <span class="club-name">${club.name}</span>
          <span class="club-gift">🏆</span>
        </div>
        <div class="progress-track"><span style="width:${Math.max(3, (club.points / max) * 100)}%"></span></div>
      </div>
      <div class="points">${formatPoints(club.points)}<small>PTS</small></div>
    </article>
  `).join('');

  rankingList.querySelectorAll('.rank-row').forEach(row => {
    const select = () => {
      selectedClub = row.dataset.club;
      renderRanking();
      showToast(`⚽ ${selectedClub} selecionado`);
    };
    row.addEventListener('click', select);
    row.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') select();
    });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function simulateGift() {
  const club = selectedClub ? clubs.find(item => item.name === selectedClub) : randomItem(clubs);
  const user = randomItem(users);
  const gift = randomItem(gifts);
  club.points += gift.points;
  document.querySelector('#lastGiftUser').textContent = user;
  document.querySelector('#lastGiftAvatar').textContent = user.charAt(0).toUpperCase();
  document.querySelector('#lastGiftName').textContent = `${gift.name} · +${gift.points} ponto${gift.points > 1 ? 's' : ''}`;
  document.querySelector('#giftCount').textContent = Number(document.querySelector('#giftCount').textContent) + 1;
  renderRanking(club.name);
  showToast(`${gift.emoji} ${user} marcou ${gift.points} para ${club.name}`);
}

function registerLike() {
  likes += 1;
  likesCount.textContent = likes;
  peopleLiking.textContent = Math.min(99, likes);
  likesProgress.style.width = `${Math.min(100, likes)}%`;
  const user = randomItem(users);
  document.querySelector('#lastLikeUser').textContent = user;
  document.querySelector('#lastLikeAvatar').textContent = user.charAt(0).toUpperCase();
  showToast(`❤ ${user} curtiu a live`);
}

function startCountdown() {
  let seconds = 1 * 3600 + 23 * 60 + 45;
  setInterval(() => {
    seconds = Math.max(0, seconds - 1);
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.querySelector('#countdown').textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function ensureModal() {
  if (document.querySelector('#appModal')) return;
  const modal = document.createElement('div');
  modal.id = 'appModal';
  modal.innerHTML = '<div class="modal-backdrop"></div><section class="app-modal"><button class="modal-close" aria-label="Fechar">×</button><div id="modalContent"></div></section>';
  document.body.appendChild(modal);

  const style = document.createElement('style');
  style.textContent = `
    #appModal{position:fixed;inset:0;z-index:50;display:none;align-items:flex-end;justify-content:center}
    #appModal.open{display:flex}.modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}
    .app-modal{position:relative;width:min(100%,620px);max-height:82vh;overflow:auto;background:#0c120e;border:1px solid rgba(141,255,0,.35);border-radius:24px 24px 0 0;padding:22px 18px calc(24px + env(safe-area-inset-bottom));box-shadow:0 -18px 60px rgba(0,0,0,.55)}
    .modal-close{position:absolute;right:14px;top:10px;border:0;background:rgba(255,255,255,.08);color:white;border-radius:50%;width:36px;height:36px;font-size:24px}.app-modal h3{margin:0 42px 16px 0;color:#8dff00}.app-modal p{color:#aab7ad}
    .modal-list{display:grid;gap:10px}.modal-item{padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.035)}
    .modal-action{width:100%;margin-top:10px;border:1px solid rgba(141,255,0,.45);background:rgba(141,255,0,.1);color:#8dff00;border-radius:14px;padding:12px;font-weight:800}
    .modal-input{width:100%;border:1px solid rgba(255,255,255,.16);background:#070b08;color:white;border-radius:13px;padding:12px;margin-top:8px}
    .selected{border-color:#8dff00!important;box-shadow:0 0 18px rgba(141,255,0,.18)!important}
  `;
  document.head.appendChild(style);
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
}

function openModal(html) {
  ensureModal();
  document.querySelector('#modalContent').innerHTML = html;
  document.querySelector('#appModal').classList.add('open');
}

function closeModal() {
  document.querySelector('#appModal')?.classList.remove('open');
}

function openChat() {
  openModal(`
    <h3>Chat da live</h3>
    <div class="modal-list" id="chatMessages">
      <div class="modal-item"><strong>cruzeirense10:</strong> Vai Cruzeiro! 💙</div>
      <div class="modal-item"><strong>gbzins_x:</strong> Palmeiras na liderança!</div>
    </div>
    <input class="modal-input" id="chatInput" placeholder="Digite uma mensagem" maxlength="80">
    <button class="modal-action" id="sendChat">Enviar mensagem</button>
  `);
  document.querySelector('#sendChat').addEventListener('click', () => {
    const input = document.querySelector('#chatInput');
    if (!input.value.trim()) return;
    document.querySelector('#chatMessages').insertAdjacentHTML('beforeend', `<div class="modal-item"><strong>Você:</strong> ${input.value.replace(/[<>]/g, '')}</div>`);
    input.value = '';
  });
}

function openPrizes() {
  openModal(`
    <h3>Presentes e pontos</h3>
    <div class="modal-list">${gifts.map(gift => `<div class="modal-item"><strong>${gift.emoji} ${gift.name}</strong><br><small>Vale ${gift.points} ponto${gift.points > 1 ? 's' : ''} para o clube escolhido.</small></div>`).join('')}</div>
    <button class="modal-action" id="testPrize">Testar presente agora</button>
  `);
  document.querySelector('#testPrize').addEventListener('click', () => { closeModal(); simulateGift(); });
}

function openSettings() {
  const savedUser = localStorage.getItem('tiktokUser') || '';
  openModal(`
    <h3>Ajustes do painel</h3>
    <label>Usuário do TikTok</label>
    <input class="modal-input" id="tiktokUser" value="${savedUser}" placeholder="@seuusuario">
    <button class="modal-action" id="saveSettings">Salvar usuário</button>
    <button class="modal-action" id="resetRanking">Zerar demonstração</button>
  `);
  document.querySelector('#saveSettings').addEventListener('click', () => {
    localStorage.setItem('tiktokUser', document.querySelector('#tiktokUser').value.trim());
    showToast('✅ Usuário salvo');
    closeModal();
  });
  document.querySelector('#resetRanking').addEventListener('click', () => {
    clubs.forEach(club => { club.points = initialPoints[club.name]; });
    likes = 5;
    likesCount.textContent = likes;
    peopleLiking.textContent = likes;
    likesProgress.style.width = `${likes}%`;
    selectedClub = null;
    renderRanking();
    showToast('♻️ Painel reiniciado');
    closeModal();
  });
}

document.querySelector('#simulateGift').addEventListener('click', simulateGift);
document.querySelector('#tapButton').addEventListener('click', registerLike);

const navButtons = [...document.querySelectorAll('.bottom-nav button')];
navButtons[0].addEventListener('click', openChat);
navButtons[1].addEventListener('click', () => {
  document.querySelector('.ranking-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('🏆 Ranking aberto');
});
navButtons[3].addEventListener('click', openPrizes);
navButtons[4].addEventListener('click', openSettings);

renderRanking();
likesProgress.style.width = `${likes}%`;
startCountdown();

window.FutLivePanel = {
  receiveGift({ username, clubName, giftName, points = 1 }) {
    const club = clubs.find(item => item.name === clubName);
    if (!club) return;
    club.points += Number(points) || 0;
    document.querySelector('#lastGiftUser').textContent = username;
    document.querySelector('#lastGiftAvatar').textContent = username.charAt(0).toUpperCase();
    document.querySelector('#lastGiftName').textContent = `${giftName} · +${points} pontos`;
    renderRanking(club.name);
  },
  receiveFollow(username) {
    document.querySelector('#lastFollowerUser').textContent = username;
    document.querySelector('#lastFollowerAvatar').textContent = username.charAt(0).toUpperCase();
  },
  receiveLike(username, count = 1) {
    likes += Number(count) || 0;
    likesCount.textContent = likes;
    peopleLiking.textContent = Math.min(99, likes);
    likesProgress.style.width = `${Math.min(100, likes)}%`;
    document.querySelector('#lastLikeUser').textContent = username;
    document.querySelector('#lastLikeAvatar').textContent = username.charAt(0).toUpperCase();
  }
};
