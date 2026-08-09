import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PIN = String(process.env.ADMIN_PIN || '1234');
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '*').split(',').map(v => v.trim()).filter(Boolean);
const EULER_API_KEY = String(process.env.EULER_API_KEY || '').trim();
const allowedOrigin = ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS;

const app = express();
app.use(cors({ origin: allowedOrigin, credentials: false }));
app.use(express.json({ limit: '32kb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000
});

let live = null;
let liveUsername = '';
let giftCatalog = [];
let roomState = { connected: false, roomId: null, viewerCount: 0, startedAt: null, lastError: '' };

function safeText(value, max = 240) {
  return String(value ?? '').replace(/[<>]/g, '').slice(0, max);
}
function usernameOf(data) {
  return safeText(data?.user?.uniqueId || data?.uniqueId || data?.userId || 'usuario', 64);
}
function authorized(pin) {
  return String(pin || '') === ADMIN_PIN;
}
function status(message = '') {
  return { ...roomState, username: liveUsername, message };
}
function firstUrl(...values) {
  for (const value of values) {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
    if (Array.isArray(value)) {
      const found = value.find(item => typeof item === 'string' && /^https?:\/\//i.test(item));
      if (found) return found;
    }
  }
  return '';
}
function giftImageOf(data = {}) {
  const info = data.extendedGiftInfo || data.giftDetails || data;
  return firstUrl(
    info?.image?.url_list,
    info?.image?.urlList,
    info?.icon?.url_list,
    info?.icon?.urlList,
    info?.picture_url,
    info?.pictureUrl,
    info?.image_url,
    info?.imageUrl,
    data?.giftPictureUrl,
    data?.giftImageUrl
  );
}
function normalizeGift(gift = {}) {
  return {
    id: String(gift.id ?? gift.gift_id ?? gift.giftId ?? ''),
    name: safeText(gift.name || gift.gift_name || gift.giftName || 'Presente', 80),
    diamondCount: Number(gift.diamond_count ?? gift.diamondCount ?? gift.cost ?? 1) || 1,
    imageUrl: giftImageOf(gift)
  };
}
function errorMessage(error, step = 'conectar') {
  const raw = safeText(error?.message || error || 'Erro desconhecido', 420);
  if (/offline|useroffline|not live|live room not found|room.*not found/i.test(raw)) {
    return `A conta não foi detectada AO VIVO. Confirme o @ exato e deixe a LIVE pública. (${step})`;
  }
  if (/403|forbidden/i.test(raw)) {
    return `TikTok recusou a conexão (403) na etapa ${step}. Isso costuma ser bloqueio temporário de rota/assinatura.`;
  }
  if (/429|rate limit|too many/i.test(raw)) {
    return `TikTok aplicou limite temporário de conexões (429) na etapa ${step}. Aguarde alguns minutos antes de tentar novamente.`;
  }
  if (/sign|signature|euler/i.test(raw)) {
    return `Falha na assinatura da conexão TikTok na etapa ${step}: ${raw}`;
  }
  if (/websocket|upgrade/i.test(raw)) {
    return `Falha ao abrir o WebSocket da LIVE: ${raw}`;
  }
  if (/timeout|timed out/i.test(raw)) {
    return `Tempo esgotado na etapa ${step}: ${raw}`;
  }
  return `${step}: ${raw}`;
}

async function publishGiftCatalog(connection) {
  try {
    const list = await connection.fetchAvailableGifts();
    giftCatalog = (Array.isArray(list) ? list : []).map(normalizeGift).filter(gift => gift.name);
    io.emit('tiktok:giftCatalog', { gifts: giftCatalog });
  } catch (error) {
    console.warn('Catálogo de presentes indisponível; LIVE permanece conectada:', error?.message || error);
  }
}

async function disconnectLive(reason = 'Desconectado') {
  if (live) {
    try { await live.disconnect(); } catch {}
  }
  live = null;
  liveUsername = '';
  giftCatalog = [];
  roomState = { connected: false, roomId: null, viewerCount: 0, startedAt: null, lastError: '' };
  io.emit('tiktok:status', status(reason));
}

function bindTikTok(connection) {
  connection.on(WebcastEvent.CHAT, data => {
    io.emit('tiktok:comment', { username: usernameOf(data), comment: safeText(data.comment, 220) });
  });
  connection.on(WebcastEvent.GIFT, data => {
    if (data.giftType === 1 && !data.repeatEnd) return;
    const giftName = safeText(data.giftDetails?.giftName || data.extendedGiftInfo?.name || data.giftName || 'Presente', 80);
    const catalogGift = giftCatalog.find(gift => gift.name.toLowerCase() === giftName.toLowerCase() || String(gift.id) === String(data.giftId));
    io.emit('tiktok:gift', {
      username: usernameOf(data),
      giftName,
      giftId: data.giftId,
      giftImageUrl: giftImageOf(data) || catalogGift?.imageUrl || '',
      repeatCount: Math.max(1, Number(data.repeatCount || 1)),
      diamondCount: Math.max(1, Number(data.giftDetails?.diamondCount || data.extendedGiftInfo?.diamond_count || data.diamondCount || catalogGift?.diamondCount || 1))
    });
  });
  connection.on(WebcastEvent.LIKE, data => {
    io.emit('tiktok:like', {
      username: usernameOf(data),
      likeCount: Math.max(1, Number(data.likeCount || 1)),
      totalLikeCount: Math.max(0, Number(data.totalLikeCount || 0))
    });
  });
  connection.on(WebcastEvent.FOLLOW, data => {
    io.emit('tiktok:follow', { username: usernameOf(data) });
  });
  connection.on(WebcastEvent.ROOM_USER, data => {
    roomState.viewerCount = Math.max(0, Number(data.viewerCount || data.topViewers?.length || 0));
    io.emit('tiktok:roomUser', { viewerCount: roomState.viewerCount });
  });
  connection.on(WebcastEvent.MEMBER, data => io.emit('tiktok:member', { username: usernameOf(data) }));
  connection.on(WebcastEvent.SHARE, data => io.emit('tiktok:share', { username: usernameOf(data) }));
  connection.on(WebcastEvent.STREAM_END, () => disconnectLive('A LIVE foi encerrada'));
  connection.on('disconnected', () => {
    roomState.connected = false;
    io.emit('tiktok:status', status('Conexão com a LIVE perdida'));
  });
  connection.on('error', error => {
    const message = errorMessage(error, 'evento da LIVE');
    roomState.lastError = message;
    io.emit('tiktok:error', { message });
  });
}

async function connectLive(username) {
  const clean = safeText(username, 64).replace(/^@/, '').trim();
  if (!clean) throw new Error('Usuário TikTok não informado');

  await disconnectLive('Preparando nova conexão');
  liveUsername = clean;

  const options = {
    processInitialData: true,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: false
  };
  if (EULER_API_KEY) options.signApiKey = EULER_API_KEY;

  live = new TikTokLiveConnection(clean, options);
  bindTikTok(live);

  try {
    const result = await live.connect();
    roomState = {
      connected: true,
      roomId: String(result?.roomId || live.roomId || ''),
      viewerCount: 0,
      startedAt: new Date().toISOString(),
      lastError: ''
    };
  } catch (error) {
    const message = errorMessage(error, 'conectar à sala');
    roomState.lastError = message;
    try { await live?.disconnect(); } catch {}
    live = null;
    throw new Error(message);
  }

  io.emit('tiktok:status', status(`Conectado a @${clean}`));
  void publishGiftCatalog(live);
  return roomState;
}

app.get('/', (_req, res) => res.json({ name: 'FUT Live Panel Backend', ok: true, ...status() }));
app.get('/health', (_req, res) => res.json({
  ok: true,
  uptime: process.uptime(),
  connector: 'tiktok-live-connector',
  eulerKeyConfigured: Boolean(EULER_API_KEY),
  ...status()
}));

app.post('/api/connect', async (req, res) => {
  if (!authorized(req.body?.pin)) return res.status(401).json({ ok: false, error: 'PIN inválido' });
  try {
    res.json({ ok: true, state: await connectLive(req.body?.username) });
  } catch (error) {
    res.status(400).json({ ok: false, error: safeText(error?.message || error, 420) });
  }
});

app.post('/api/disconnect', async (req, res) => {
  if (!authorized(req.body?.pin)) return res.status(401).json({ ok: false, error: 'PIN inválido' });
  await disconnectLive();
  res.json({ ok: true });
});

io.use((socket, next) => {
  if (!authorized(socket.handshake.auth?.pin)) return next(new Error('PIN inválido'));
  socket.data.isAdmin = true;
  next();
});

io.on('connection', socket => {
  socket.emit('tiktok:status', status(roomState.connected ? `Conectado a @${liveUsername}` : 'Nenhuma LIVE conectada'));
  if (giftCatalog.length) socket.emit('tiktok:giftCatalog', { gifts: giftCatalog });

  socket.on('tiktok:connect', async (payload = {}, reply = () => {}) => {
    try {
      reply({ ok: true, state: await connectLive(payload.username) });
    } catch (error) {
      const message = safeText(error?.message || error, 420);
      reply({ ok: false, error: message });
    }
  });

  socket.on('tiktok:disconnect', async (_payload = {}, reply = () => {}) => {
    await disconnectLive();
    reply({ ok: true });
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`FUT Live backend na porta ${PORT}`));