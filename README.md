# FUT Live Panel

Painel vertical mobile para lives interativas de futebol, sem câmera e sem exibir o apresentador.

## Primeira versão

- Layout responsivo com aparência neon
- Ranking de 20 clubes
- Barra de progresso e pontuação em tempo real
- Último presente, último tap tap e último seguidor
- Contador de curtidas
- Meta de gols e cronômetro
- Botão para simular presentes
- API local de demonstração disponível em `window.FutLivePanel`

## Executar

O projeto é estático. Abra `index.html` ou publique diretamente no Vercel/GitHub Pages.

Para servidor local:

```bash
npx serve .
```

## Integração futura com a live

Os eventos recebidos por WebSocket poderão chamar:

```js
window.FutLivePanel.receiveGift({
  username: 'usuario',
  clubName: 'Cruzeiro',
  giftName: 'Rosa',
  points: 1
});

window.FutLivePanel.receiveFollow('novo_seguidor');
window.FutLivePanel.receiveLike('usuario', 10);
```

A conexão real com eventos de LIVE deverá ficar no backend. Nenhum token ou segredo deve ser colocado no código do navegador.
