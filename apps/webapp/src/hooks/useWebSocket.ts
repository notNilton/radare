import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/AuthStore';
import { API_URL } from '../config/env';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export interface WsMessage {
  type: string;
  payload: Record<string, unknown>;
}

interface UseWebSocketReturn {
  status: WsStatus;
  lastMessage: WsMessage | null;
  send: (data: unknown) => void;
}

const BACKOFF_STEPS = [500, 1000, 2000, 4000, 8000, 16000, 30000];

function buildWsUrl(token: string): string {
  // Derive WebSocket URL from the API base URL
  // API_URL is either "/api" (relative) or an absolute "http(s)://..."
  let base = API_URL.replace(/\/$/, '');

  if (base.startsWith('http://') || base.startsWith('https://')) {
    base = base.replace(/^http/, 'ws');
  } else {
    // Relative path — build from window.location
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    base = `${proto}//${window.location.host}${base}`;
  }

  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

export function useWebSocket(): UseWebSocketReturn {
  const token = useAuthStore((s) => s.token);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (!token || unmountedRef.current) return;

      setStatus('connecting');
      const url = buildWsUrl(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        retryRef.current = 0;
        setStatus('connected');
      };

      ws.onmessage = (ev) => {
        if (unmountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data as string) as WsMessage;
          setLastMessage(msg);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus('disconnected');
        if (!token) return;
        const delay = BACKOFF_STEPS[Math.min(retryRef.current, BACKOFF_STEPS.length - 1)] ?? 30000;
        retryRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    if (token) {
      connect();
    } else {
      setStatus('disconnected');
    }

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token]);

  return { status, lastMessage, send };
}
