(() => {
  'use strict';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function render() {
    const list = document.querySelector('#giftsGuideList');
    const teams = window.FutLiveTeamGifts?.teams || [];
    if (!list) return;

    list.innerHTML = teams.map((team) => `
      <article class="gift-guide-card">
        <span class="gift-team-crest">
          <img src="${team.logo}" alt="Escudo ${escapeHtml(team.name)}" loading="lazy">
          <b hidden>${escapeHtml(team.short)}</b>
        </span>
        <div class="gift-guide-info">
          <strong>${escapeHtml(team.name)}</strong>
          <small>🎁 ${escapeHtml(team.giftName)}</small>
          <span>${team.coins} MOEDA · +${team.points} PTS</span>
        </div>
      </article>`).join('');

    list.querySelectorAll('img').forEach((image) => {
      image.addEventListener('error', () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('storage', render);
  window.FutLiveGiftsGuide = { render };
})();