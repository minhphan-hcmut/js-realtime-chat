import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';
import { useWebSocket } from '../hooks/useWebSocket';

export default function ChatLayout() {
  const [activeChannelId, setActiveChannelId] = useState(null);

  // Hook handles connection automatically via AccessToken from store
  useWebSocket((newMessageData) => {
      // Global injection for simplicity.
      // In production it is better to dispatch to a Zustand store
      if (typeof window.handleNewMessage === 'function') {
         window.handleNewMessage(newMessageData);
      }
  });

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar setChannelId={setActiveChannelId} />
      <ChatBox channelId={activeChannelId} />
    </div>
  );
}
