import { createContext, useEffect, useRef, useState } from 'react';

type WSContextType = {
  send: (action: string, payload?: any) => void;
  on: (action: string, handler: (data: any) => void) => () => void; // cleanup fn
};

const WSContext = createContext<WSContextType>(null!);

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const queueRef = useRef<{ action: string; payload?: any }[]>([]);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:${import.meta.env.VITE_WS_PORT}`);

    socket.onopen = () => {
      console.log('✅ Connected to WS server');
      queueRef.current.forEach(({ action, payload }) => {
        socket.send(JSON.stringify({ action, payload }));
      });
      queueRef.current = [];
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        let finalData = parsed.data;

        if (typeof finalData === 'string') {
          try {
            finalData = JSON.parse(finalData);
          } catch {
            // ignore parse error
          }
        }

        const action = parsed.action ?? '';
        const handlers = listenersRef.current.get(action);
        if (handlers) {
          handlers.forEach((cb) => cb(finalData));
        }
      } catch (err) {
        console.error('WS message parse error', err);
      }
    };

    socket.onclose = () => {
      console.log('❌ Disconnected from WS server');
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const send = (action: string, payload?: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, payload }));
    } else {
      console.warn('WS not ready, queueing message');
      queueRef.current.push({ action, payload });
    }
  };

  const on = (action: string, handler: (data: any) => void) => {
    if (!listenersRef.current.has(action)) {
      listenersRef.current.set(action, new Set());
    }
    listenersRef.current.get(action)!.add(handler);

    return () => {
      listenersRef.current.get(action)?.delete(handler);
    };
  };

  return <WSContext.Provider value={{ send, on }}>{children}</WSContext.Provider>;
}

export { WebSocketProvider, WSContext };
