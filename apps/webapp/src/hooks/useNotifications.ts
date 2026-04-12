import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/AuthStore';
import { useNotificationStore } from '../store/NotificationStore';

type HubMessageType =
  | 'reconciliation.result'
  | 'reconciliation.error'
  | 'connector.status'
  | 'ingest.value';

interface HubMessage {
  type: HubMessageType;
  payload: Record<string, unknown>;
}

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/ws`;
}

function labelForType(type: HubMessageType): string {
  switch (type) {
    case 'reconciliation.result': return 'Reconciliação concluída';
    case 'reconciliation.error': return 'Erro na reconciliação';
    case 'connector.status': return 'Status do conector';
    case 'ingest.value': return 'Valor ingerido';
    default: return 'Notificação';
  }
}

/** Maps a hub message to a toast notification. Returns null to silence the event. */
function toNotification(msg: HubMessage) {
  const push = useNotificationStore.getState().push;

  switch (msg.type) {
    case 'reconciliation.result': {
      const p = msg.payload;
      const valid = p.statistical_validity as boolean;
      push({
        level: valid ? 'success' : 'warning',
        title: labelForType(msg.type),
        message: valid
          ? `Consistente — χ²=${(p.chi_square as number).toFixed(2)}, confiança ${((p.confidence_score as number) * 100).toFixed(0)}%`
          : `Inconsistente — outlier idx ${p.outlier_index}${p.outlier_tag ? ` (${p.outlier_tag})` : ''}`,
      });
      break;
    }
    case 'reconciliation.error': {
      push({
        level: 'error',
        title: labelForType(msg.type),
        message: (msg.payload.error as string) ?? 'Falha ao processar reconciliação.',
      });
      break;
    }
    case 'connector.status': {
      const online = msg.payload.online as boolean;
      push({
        level: online ? 'info' : 'warning',
        title: `Conector ${msg.payload.name ?? ''}`,
        message: online ? 'Online' : 'Offline',
      });
      break;
    }
    case 'ingest.value': {
      // Silenced — too noisy for toasts; future: update a live indicator instead
      break;
    }
  }
}

const RECONNECT_DELAY_MS = 5000;

/**
 * Opens a WebSocket to /api/ws, parses hub messages, and pushes toasts.
 * Auto-reconnects on disconnect as long as the user is authenticated.
 * Call once at the app root (inside AppShell or main.tsx).
 */
export function useNotifications() {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (!token || unmountedRef.current) return;

      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const msg: HubMessage = JSON.parse(ev.data as string);
          toNotification(msg);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!unmountedRef.current && token) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose → reconnect
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [token]);
}
