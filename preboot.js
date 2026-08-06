(() => {
  const RESET_MARKER = 'futLivePanelInitialZeroV1';
  if (localStorage.getItem(RESET_MARKER)) return;

  const clubs = [
    ['Palmeiras','PAL','#146b35'],['Flamengo','FLA','#a81522'],['São Paulo','SPF','#d12c32'],['Corinthians','COR','#202020'],['Atlético MG','CAM','#252525'],['Grêmio','GRE','#1680bb'],['Internacional','INT','#c8202f'],['Cruzeiro','CRU','#234da0'],['Vasco','VAS','#353535'],['Botafogo','BOT','#191919'],['Athletico PR','CAP','#bb2028'],['Santos','SAN','#333333'],['Fortaleza','FOR','#2f64b5'],['Bahia','BAH','#2765b3'],['Coritiba','CFC','#17733b'],['Sport','SPO','#b71c2a'],['Cuiabá','CUI','#e0b715'],['Goiás','GOI','#158445'],['Juventude','JUV','#298a50'],['América MG','AME','#18854a']
  ].map(([name, short, color]) => ({ name, short, points: 0, color }));

  const existing = (() => {
    try { return JSON.parse(localStorage.getItem('futLivePanelStateV2') || '{}'); }
    catch { return {}; }
  })();

  localStorage.setItem('futLivePanelStateV2', JSON.stringify({
    clubs,
    gifts: existing.gifts || [
      { name:'Rosa', points:1, emoji:'🌹' },
      { name:'Coração', points:5, emoji:'💚' },
      { name:'Bola', points:10, emoji:'⚽' },
      { name:'Troféu', points:25, emoji:'🏆' },
      { name:'Leão', points:100, emoji:'🦁' }
    ],
    likes: 0,
    giftCount: 0,
    goal: existing.goal || 50,
    eventName: existing.eventName || 'SÁBADO PREMIADO',
    goalMessage: existing.goalMessage || 'MANDE PRESENTE E CONCORRA',
    tiktokUser: existing.tiktokUser || '',
    durationMinutes: existing.durationMinutes || 84
  }));

  localStorage.setItem('futLiveHistoryV1', '[]');
  localStorage.setItem(RESET_MARKER, '1');
})();
