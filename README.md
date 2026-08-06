# FUT Live Panel

Painel vertical mobile para lives interativas de futebol, sem câmera e sem exibir o apresentador.

## Recursos implementados

- Ranking de clubes e pontos por presente
- Comentário com nome, sigla ou comando `!clube` seleciona o time do usuário
- Presentes, curtidas, seguidores, comentários e público em tempo real
- Backend Socket.IO com reconexão automática
- Integração experimental com TikTok LIVE por `tiktok-live-connector`
- Histórico local de até 500 eventos
- Top doadores e exportação CSV
- Efeitos para presente, novo seguidor e mudança de líder
- Painel administrativo, edição de clubes e presentes
- PIN obrigatório no backend para conectar ou desconectar uma LIVE
- Modo transmissão em tela cheia e Wake Lock
- PWA instalável, orientação vertical e cache offline
- Modo demonstração continua disponível

## Arquitetura

- **Frontend:** raiz do repositório, publicado na Vercel.
- **Backend:** pasta `backend`, publicado em um serviço com processo contínuo e WebSocket, como Render ou Railway.

A Vercel continua hospedando apenas o painel. O backend não deve ser publicado como função serverless porque precisa manter a conexão da LIVE e o Socket.IO ativos.

## Publicar o backend no Render

1. Entre no Render e escolha **New + → Blueprint**.
2. Conecte este repositório.
3. O Render detectará o arquivo `render.yaml`.
4. Depois do deploy, abra as variáveis do serviço e copie o valor gerado em `ADMIN_PIN`.
5. Copie a URL pública do backend, por exemplo `https://fut-live-panel-backend.onrender.com`.
6. No painel, toque em **Conectar LIVE** e informe:
   - URL do backend;
   - PIN do administrador;
   - `@` da conta TikTok.

Para trocar o PIN, altere a variável `ADMIN_PIN`. Em `ALLOWED_ORIGINS`, mantenha a URL do frontend.

## Executar localmente

Frontend:

```bash
npx serve .
```

Backend:

```bash
cd backend
npm install
ADMIN_PIN=1234 ALLOWED_ORIGINS=http://localhost:3001 npm start
```

## Regras dos clubes

O usuário pode comentar:

```text
Cruzeiro
CRU
!cruzeiro
```

O clube escolhido fica associado ao usuário. O próximo presente enviado por ele soma pontos nesse clube. O valor é buscado na tabela de presentes configurada no painel; quando não existe correspondência, usa-se o valor de diamantes informado pelo evento, com mínimo de 1 ponto.

## Aviso importante

A integração usa uma biblioteca não oficial baseada no serviço interno de Webcast do TikTok. Ela pode parar de funcionar após alterações da plataforma e não deve ser considerada uma API oficial ou garantida para produção. O modo demonstração e a API visual do painel continuam funcionando independentemente dessa conexão.
