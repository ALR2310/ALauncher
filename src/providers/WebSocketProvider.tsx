import { createContext, useEffect, useRef, useState } from 'react';

type WSContextType = {
  send: (action: string, payload?: any) => void;
  on: (action: string, handler: (data: any) => void) => void;
  off: (action: string, handler: (data: any) => void) => void;
};

const WSContext = createContext<WSContextType>({
  send: () => {},
  on: () => {},
  off: () => {},
});

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const listenersRef = useRef<Record<string, ((data: any) => void)[]>>({});

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:${import.meta.env.VITE_WS_PORT}`);

    socket.onopen = () => console.log('Connected to WS server');

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        let finalData = parsed.data;

        if (typeof finalData === 'string') {
          try {
            finalData = JSON.parse(finalData);
          } catch {
            // noop
          }
        }

        const action = parsed.action ?? '';
        if (listenersRef.current[action]) {
          listenersRef.current[action].forEach((cb) => cb(finalData));
        }
      } catch (err) {
        console.error(err);
      }
    };

    socket.onclose = () => console.log('Disconnected from WS server');

    setWs(socket);
    return () => socket.close();
  }, []);

  const send = (action: string, payload?: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const on = (action: string, handler: (data: any) => void) => {
    if (!listenersRef.current[action]) {
      listenersRef.current[action] = [];
    }
    listenersRef.current[action].push(handler);
  };

  const off = (action: string, handler: (data: any) => void) => {
    if (listenersRef.current[action]) {
      listenersRef.current[action] = listenersRef.current[action].filter((h) => h !== handler);
    }
  };

  return <WSContext.Provider value={{ send, on, off }}>{children}</WSContext.Provider>;
}

export { WebSocketProvider, WSContext };
