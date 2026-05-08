import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { type RawData, WebSocket, WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 4848);
const STATIC_DIR = path.resolve(__dirname, '..', 'dist');

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
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<WebSocket>>();

const addToRoom = (roomId: string, ws: WebSocket) => {
  let peers = rooms.get(roomId);
  if (!peers) {
    peers = new Set();
    rooms.set(roomId, peers);
  }
  peers.add(ws);
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
  for (const peer of peers) {
    if (peer === sender) continue;
    if (peer.readyState !== WebSocket.OPEN) continue;
    peer.send(payload.toString());
  }
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room');
  if (!roomId) {
    ws.close(1008, 'room required');
    return;
  }

  addToRoom(roomId, ws);

  ws.on('message', (raw) => {
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
    broadcast(roomId, ws, raw);
  });

  ws.on('close', () => removeFromRoom(roomId, ws));
  ws.on('error', () => removeFromRoom(roomId, ws));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`server listening on :${PORT}`);
});
