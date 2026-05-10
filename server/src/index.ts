import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { type RawData, WebSocket, WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 4848);
const STATIC_DIR = path.resolve(__dirname, '..', 'dist');

// Limits sized to keep an attacker from consuming meaningful NFS RAM-hours
// or bandwidth via the relay. Tune if real usage hits a ceiling.
const LIMITS = {
  MAX_MESSAGE_BYTES: 4096,
  MAX_ROOMS: 5000,
  MAX_PEERS_PER_ROOM: 20,
  MAX_CONNECTIONS_PER_IP: 5,
  MSG_WINDOW_MS: 10_000,
  MSG_PER_WINDOW: 30,
  HEARTBEAT_INTERVAL_MS: 30_000,
} as const;

const ROOM_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rooms = new Map<string, Set<WebSocket>>();
const connectionsByIp = new Map<string, number>();

type PeerState = {
  isAlive: boolean;
  msgTimestamps: number[];
  ip: string;
  roomId: string;
};
const peerState = new WeakMap<WebSocket, PeerState>();

const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

app.use(
  express.static(STATIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  maxPayload: LIMITS.MAX_MESSAGE_BYTES,
});

// NFS sits in front of us, so the real client IP is in X-Forwarded-For.
// XFF format is "client, proxy1, proxy2" — taking the rightmost entry
// (the most-trusted hop's record of who connected to it) prevents a
// client from spoofing their IP by injecting a fake XFF header.
const getIp = (req: http.IncomingMessage): string => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return req.socket.remoteAddress ?? 'unknown';
};

const addToRoom = (roomId: string, ws: WebSocket): boolean => {
  let peers = rooms.get(roomId);
  if (!peers) {
    if (rooms.size >= LIMITS.MAX_ROOMS) return false;
    peers = new Set();
    rooms.set(roomId, peers);
  }
  if (peers.size >= LIMITS.MAX_PEERS_PER_ROOM) return false;
  peers.add(ws);
  return true;
};

const removeFromRoom = (roomId: string, ws: WebSocket) => {
  const peers = rooms.get(roomId);
  if (!peers) return;
  peers.delete(ws);
  if (peers.size === 0) rooms.delete(roomId);
};

const broadcast = (roomId: string, sender: WebSocket, payload: RawData) => {
  const peers = rooms.get(roomId);
  if (!peers) return;
  const str = payload.toString();
  for (const peer of peers) {
    if (peer === sender) continue;
    if (peer.readyState !== WebSocket.OPEN) continue;
    peer.send(str);
  }
};

// Write to /home/logs/server.log when that directory exists (NFS),
// always console.log too so dev sees output and NFS can also capture
// stdout if its daemon config is wired up that way.
const logStream = (() => {
  try {
    if (fs.statSync('/home/logs').isDirectory()) {
      return fs.createWriteStream('/home/logs/server.log', { flags: 'a' });
    }
  } catch {
    // /home/logs missing (local dev) — fall through to console-only
  }
  return null;
})();

const log = (event: string, info: Record<string, unknown> = {}) => {
  const ts = new Date().toISOString();
  const parts = Object.entries(info).map(([k, v]) => `${k}=${v}`);
  const line = `${ts} [${event}]${parts.length ? ` ${parts.join(' ')}` : ''}`;
  console.log(line);
  if (logStream) logStream.write(`${line}\n`);
};

const cleanup = (ws: WebSocket, reason: string) => {
  const state = peerState.get(ws);
  if (!state) return;
  peerState.delete(ws);
  removeFromRoom(state.roomId, ws);
  const next = (connectionsByIp.get(state.ip) ?? 1) - 1;
  if (next <= 0) connectionsByIp.delete(state.ip);
  else connectionsByIp.set(state.ip, next);
  log('close', { ip: state.ip, room: state.roomId, reason });
};

wss.on('error', (err) => log('wss_error', { err: err.message }));

wss.on('connection', (ws, req) => {
  // Attach error/close listeners FIRST. Without an 'error' listener,
  // any library-level error (e.g. payload-too-large) crashes the process.
  ws.on('error', () => cleanup(ws, 'error'));
  ws.on('close', () => cleanup(ws, 'client'));

  const ip = getIp(req);
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') ?? '';

  if (!ROOM_ID_RE.test(roomId)) {
    log('reject', { ip, reason: 'invalid_room' });
    ws.close(1008, 'invalid room');
    return;
  }

  const ipCount = connectionsByIp.get(ip) ?? 0;
  if (ipCount >= LIMITS.MAX_CONNECTIONS_PER_IP) {
    log('reject', { ip, reason: 'ip_limit' });
    ws.close(1013, 'too many connections');
    return;
  }

  if (!addToRoom(roomId, ws)) {
    log('reject', { ip, room: roomId, reason: 'capacity' });
    ws.close(1013, 'room or server full');
    return;
  }

  connectionsByIp.set(ip, ipCount + 1);
  peerState.set(ws, { isAlive: true, msgTimestamps: [], ip, roomId });
  log('open', {
    ip,
    room: roomId,
    peers: rooms.get(roomId)?.size,
    rooms: rooms.size,
  });

  ws.on('message', (raw) => {
    const state = peerState.get(ws);
    if (!state) return;

    const now = Date.now();
    state.msgTimestamps = state.msgTimestamps.filter(
      (t) => t > now - LIMITS.MSG_WINDOW_MS,
    );
    if (state.msgTimestamps.length >= LIMITS.MSG_PER_WINDOW) {
      log('rate_limit', { ip: state.ip, room: state.roomId });
      ws.close(1008, 'rate limited');
      return;
    }
    state.msgTimestamps.push(now);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as { type?: unknown }).type !== 'string'
    ) {
      return;
    }
    broadcast(state.roomId, ws, raw);
  });

  ws.on('pong', () => {
    const state = peerState.get(ws);
    if (state) state.isAlive = true;
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    const state = peerState.get(ws);
    if (!state) continue;
    if (!state.isAlive) {
      ws.terminate();
      continue;
    }
    state.isAlive = false;
    try {
      ws.ping();
    } catch {
      // socket already closing; cleanup will fire on close event
    }
  }
}, LIMITS.HEARTBEAT_INTERVAL_MS);

server.on('close', () => clearInterval(heartbeat));

server.listen(PORT, '0.0.0.0', () => {
  log('startup', { port: PORT, log_file: logStream ? 'yes' : 'no' });
});
