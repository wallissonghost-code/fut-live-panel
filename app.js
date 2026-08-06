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

function formatPoints(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function renderRanking(highlightName = '') {
  clubs.sort((a, b) => b.points - a.points);
  const max = clubs[0]?.points || 1;
  rankingList.innerHTML = clubs.map((club, index) => `
    <article class="rank-row top-${index + 1} ${club.name === highlightName ? 'updated' : ''}" data-club="${club.name}">
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
  const club = randomItem(clubs);
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

document.querySelector('#simulateGift').addEventListener('click', simulateGift);
document.querySelector('#tapButton').addEventListener('click', registerLike);

renderRanking();
likesProgress.style.width = `${likes}%`;
startCountdown();

// Eventos reais do TikTok deverão entrar aqui futuramente via WebSocket.
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
    likesProgress.style.width = `${Math.min(100, likes)}%`;
    document.querySelector('#lastLikeUser').textContent = username;
    document.querySelector('#lastLikeAvatar').textContent = username.charAt(0).toUpperCase();
  }
};
