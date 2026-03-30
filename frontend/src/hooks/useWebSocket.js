import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';

export function useWebSocket(onMessageReceived) {
  const { accessToken } = useAuthStore();
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the proxy port or the direct backend port. Assuming backend is on 3000
    // During dev proxy is on 5173 but WS proxy needs Vite config adjustment. 
    // We connect directly to backend 3000 for simplicity here.
    const wsUrl = `${protocol}//localhost:3000?token=${accessToken}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
         const payload = JSON.parse(event.data);
         if (payload.type === 'new_message') {
            onMessageReceived(payload.data);
         }
      } catch (err) {
         console.error('Invalid WS message', err);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
       console.error('WS Error', error);
    }

    return () => {
      if (ws.current) {
         ws.current.close();
      }
    };
  }, [accessToken, onMessageReceived]);

  return { isConnected };
}
