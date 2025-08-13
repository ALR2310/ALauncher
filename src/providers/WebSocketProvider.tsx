import { WSRequest, WSResponse } from '@shared/ws.type';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';

type Handler = (data: any, raw?: WSResponse) => void;

type WSContextType = {
  send: (action: string, payload?: any) => void;
  on: (action: string, handler: Handler) => () => void;
};

const WSContext = createContext<WSContextType | null>(null);

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const queueRef = useRef<WSRequest[]>([]);
  const isOpenRef = useRef(false);

  useEffect(() => {
    const url = `ws://localhost:${import.meta.env.VITE_WS_PORT}`;
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      isOpenRef.current = true;
      for (const m of queueRef.current) {
        socket.send(JSON.stringify(m));
      }
      queueRef.current = [];
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WSResponse;
        const set = listenersRef.current.get(msg.action);
        if (!set || set.size === 0) return;
        [...set].forEach((h) => {
          try {
            h(msg.data, msg);
          } catch (err) {
            console.error('WS handler error:', err);
          }
        });
      } catch (e) {
        console.warn('Invalid WS message:', e);
      }
    };

    socket.onclose = () => {
      isOpenRef.current = false;
    };

    socket.onerror = (_e) => {};

    const listenersSnapshot = listenersRef.current;
    return () => {
      try {
        socket.close();
      } catch {
        // Ignore close errors
      }
      wsRef.current = null;
      isOpenRef.current = false;
      listenersSnapshot.clear();
      queueRef.current = [];
    };
  }, []);

  const send = useCallback((action: string, payload?: any) => {
    const msg: WSRequest = { action, payload };
    const ws = wsRef.current;
    if (ws && isOpenRef.current && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      queueRef.current.push(msg);
    }
  }, []);

  const on = useCallback((action: string, handler: Handler) => {
    let set = listenersRef.current.get(action);
    if (!set) {
      set = new Set();
      listenersRef.current.set(action, set);
    }
    set.add(handler);

    return () => {
      const s = listenersRef.current.get(action);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) listenersRef.current.delete(action);
    };
  }, []);

  const value = useMemo<WSContextType>(() => ({ send, on }), [send, on]);

  return <WSContext.Provider value={value}>{children}</WSContext.Provider>;
}

export { WebSocketProvider, WSContext };
export type { Handler };
