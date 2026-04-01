import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';

export function useWebSocket(onMessageReceived) {
  const { accessToken } = useAuthStore();
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Keep the latest callback in a ref to prevent infinite re-renders
  const callbackRef = useRef(onMessageReceived);

  useEffect(() => {
     callbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!accessToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3000?token=${accessToken}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
         const payload = JSON.parse(event.data);
         if (payload.type === 'new_message' && callbackRef.current) {
            callbackRef.current(payload.data);
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
  }, [accessToken]);

  return { isConnected };
}
