(() => {
  'use strict';

  const button = document.querySelector('#quickResetButton');
  if (!button) return;

  const style = document.createElement('style');
  style.textContent = `
    #quickResetButton{border-color:rgba(255,70,100,.55)!important;background:rgba(255,47,104,.12)!important;color:#ff789a!important}
    #quickResetButton:active{transform:scale(.96)}
  `;
  document.head.appendChild(style);

  button.addEventListener('click', () => {
    const confirmed = window.confirm('Resetar o painel? Todos os times, curtidas, presentes e histórico voltarão para zero. A conexão com o backend será preservada.');
    if (!confirmed) return;

    let state = {};
    try {
      state = JSON.parse(localStorage.getItem('futLivePanelStateV2') || '{}');
    } catch {
      state = {};
    }

    const clubs = Array.isArray(state.clubs)
      ? state.clubs.map(club => ({ ...club, points: 0 }))
      : [];

    localStorage.setItem('futLivePanelStateV2', JSON.stringify({
      ...state,
      clubs,
      likes: 0,
      giftCount: 0
    }));
    localStorage.setItem('futLiveHistoryV1', '[]');

    window.location.reload();
  });
})();
