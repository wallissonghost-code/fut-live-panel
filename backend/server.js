import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PIN = String(process.env.ADMIN_PIN || '1234');
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '*').split(',').map(v => v.trim());
const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '32kb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000
});

let live = null;
let liveUsername = '';
let roomState = { connected: false, roomId: null, viewerCount: 0, startedAt: null };

function safeText(value, max = 120) {
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
async function disconnectLive(reason = 'Desconectado') {
  if (live) {
    try { live.disconnect(); } catch {}
  }
  live = null;
  liveUsername = '';
  roomState = { connected: false, roomId: null, viewerCount: 0, startedAt: null };
  io.emit('tiktok:status', status(reason));
}

function bindTikTok(connection) {
  connection.on(WebcastEvent.CHAT, data => {
    io.emit('tiktok:comment', { username: usernameOf(data), comment: safeText(data.comment, 220) });
  });
  connection.on(WebcastEvent.GIFT, data => {
    if (data.giftType === 1 && !data.repeatEnd) return;
    io.emit('tiktok:gift', {
      username: usernameOf(data),
      giftName: safeText(data.giftDetails?.giftName || data.giftName || 'Presente', 80),
      giftId: data.giftId,
      repeatCount: Number(data.repeatCount || 1),
      diamondCount: Number(data.giftDetails?.diamondCount || data.diamondCount || 1)
    });
  });
  connection.on(WebcastEvent.LIKE, data => {
    io.emit('tiktok:like', { username: usernameOf(data), likeCount: Number(data.likeCount || 1), totalLikeCount: Number(data.totalLikeCount || 0) });
  });
  connection.on(WebcastEvent.FOLLOW, data => {
    io.emit('tiktok:follow', { username: usernameOf(data) });
  });
  connection.on(WebcastEvent.ROOM_USER, data => {
    roomState.viewerCount = Number(data.viewerCount || data.topViewers?.length || 0);
    io.emit('tiktok:roomUser', { viewerCount: roomState.viewerCount });
  });
  connection.on(WebcastEvent.MEMBER, data => io.emit('tiktok:member', { username: usernameOf(data) }));
  connection.on(WebcastEvent.SHARE, data => io.emit('tiktok:share', { username: usernameOf(data) }));
  connection.on(WebcastEvent.STREAM_END, () => disconnectLive('A LIVE foi encerrada'));
  connection.on('disconnected', () => {
    roomState.connected = false;
    io.emit('tiktok:status', status('Conexão com a LIVE perdida'));
  });
  connection.on('error', error => io.emit('tiktok:error', { message: safeText(error?.message || error, 200) }));
}

async function connectLive(username) {
  const clean = safeText(username, 64).replace(/^@/, '').trim();
  if (!clean) throw new Error('Usuário TikTok não informado');
  await disconnectLive('Preparando nova conexão');
  liveUsername = clean;
  live = new TikTokLiveConnection(clean, {
    processInitialData: true,
    enableExtendedGiftInfo: true,
    requestPollingIntervalMs: 1000
  });
  bindTikTok(live);
  const result = await live.connect();
  roomState = { connected: true, roomId: result.roomId || live.roomId || null, viewerCount: 0, startedAt: new Date().toISOString() };
  io.emit('tiktok:status', status(`Conectado a @${clean}`));
  return roomState;
}

app.get('/', (_req, res) => res.json({ name: 'FUT Live Panel Backend', ok: true, ...status() }));
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime(), ...status() }));
app.post('/api/connect', async (req, res) => {
  if (!authorized(req.body?.pin)) return res.status(401).json({ ok: false, error: 'PIN inválido' });
  try { res.json({ ok: true, state: await connectLive(req.body?.username) }); }
  catch (error) { res.status(400).json({ ok: false, error: safeText(error?.message || error, 220) }); }
});
app.post('/api/disconnect', async (req, res) => {
  if (!authorized(req.body?.pin)) return res.status(401).json({ ok: false, error: 'PIN inválido' });
  await disconnectLive();
  res.json({ ok: true });
});

io.use((socket, next) => {
  const pin = socket.handshake.auth?.pin;
  socket.data.isAdmin = authorized(pin);
  next();
});
io.on('connection', socket => {
  socket.emit('tiktok:status', status(roomState.connected ? `Conectado a @${liveUsername}` : 'Nenhuma LIVE conectada'));
  socket.on('tiktok:connect', async (payload = {}, reply = () => {}) => {
    if (!socket.data.isAdmin && !authorized(payload.pin)) return reply({ ok: false, error: 'PIN inválido' });
    try { reply({ ok: true, state: await connectLive(payload.username) }); }
    catch (error) { const message = safeText(error?.message || error, 220); socket.emit('tiktok:error', { message }); reply({ ok: false, error: message }); }
  });
  socket.on('tiktok:disconnect', async (payload = {}, reply = () => {}) => {
    if (!socket.data.isAdmin && !authorized(payload.pin)) return reply({ ok: false, error: 'PIN inválido' });
    await disconnectLive(); reply({ ok: true });
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`FUT Live backend na porta ${PORT}`));
