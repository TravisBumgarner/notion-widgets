import { useEffect, useRef } from 'react';

export type TimerState = {
  selectedSeconds: number;
  runState: 'stopped' | 'running' | 'paused';
  startedAt: number | null;
  elapsedBeforePauseMs: number;
};

type Message = { type: 'state'; state: TimerState } | { type: 'request_state' };

const resolveWsUrl = (roomId: string): string => {
  const base = import.meta.env.VITE_WS_URL as string | undefined;
  if (base) return `${base}?room=${encodeURIComponent(roomId)}`;
  if (import.meta.env.DEV) {
    return `ws://${window.location.hostname}:4848/ws/?room=${encodeURIComponent(roomId)}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws/?room=${encodeURIComponent(roomId)}`;
};

const isTimerState = (v: unknown): v is TimerState => {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.selectedSeconds === 'number' &&
    (s.runState === 'stopped' ||
      s.runState === 'running' ||
      s.runState === 'paused') &&
    (s.startedAt === null || typeof s.startedAt === 'number') &&
    typeof s.elapsedBeforePauseMs === 'number'
  );
};

/**
 * Connects to a room over WebSocket. Emits the local state on demand
 * (on `request_state`) and forwards incoming state to `onRemoteState`.
 * The returned `send` broadcasts the local state to peers.
 */
export const useTimerRoom = ({
  roomId,
  getState,
  onRemoteState,
}: {
  roomId: string | undefined;
  getState: () => TimerState;
  onRemoteState: (state: TimerState) => void;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const getStateRef = useRef(getState);
  const onRemoteStateRef = useRef(onRemoteState);

  getStateRef.current = getState;
  onRemoteStateRef.current = onRemoteState;

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(resolveWsUrl(roomId));
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        attempt = 0;
        ws.send(JSON.stringify({ type: 'request_state' } satisfies Message));
      });

      ws.addEventListener('message', (event) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (typeof parsed !== 'object' || parsed === null) return;
        const msg = parsed as { type?: unknown };
        if (msg.type === 'request_state') {
          ws.send(
            JSON.stringify({
              type: 'state',
              state: getStateRef.current(),
            } satisfies Message),
          );
        } else if (msg.type === 'state') {
          const s = (parsed as { state?: unknown }).state;
          if (isTimerState(s)) onRemoteStateRef.current(s);
        }
      });

      ws.addEventListener('close', () => {
        if (cancelled) return;
        wsRef.current = null;
        attempt += 1;
        const delay = Math.min(15000, 500 * 2 ** Math.min(attempt, 5));
        reconnectTimer = setTimeout(connect, delay);
      });

      ws.addEventListener('error', () => ws.close());
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      wsRef.current = null;
      if (!ws) return;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', () => ws.close(1000));
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000);
      }
    };
  }, [roomId]);

  const send = (state: TimerState) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'state', state } satisfies Message));
  };

  return { send };
};
