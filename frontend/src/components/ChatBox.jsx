import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function ChatBox({ channelId }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  // We expose setMessages so Layout can update it when WS broadcasts
  useEffect(() => {
    // Layout should ideally manage standard websocket injections
    // but we can fetch history here initially
    const fetchHistory = async () => {
      try {
         const res = await api.get(`/messages/list?channelId=${channelId}&uid=${user?.uid}`);
         if (res.data?.data) {
             setMessages(res.data.data.reverse()); // Reverse to get oldest first
         }
      } catch (e) {
         console.error(e)
      }
    };
    if (channelId) {
      fetchHistory();
    }
  }, [channelId]);

  useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages])

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !channelId) return;
    try {
      // Backend expects: channelId, senderUid, content, type
      const res = await api.post('/messages/send', {
         channelId,
         senderUid: user.uid,
         content: text,
         type: 'text'
      });
      // Append my message locally since WS might not broadcast to sender
      if (res.data.success) {
         setMessages(prev => [...prev, res.data.data]);
         setText('');
      }
    } catch (error) {
       console.error(error);
    }
  }

  // Inject handleNewMessage to global window for simplicity 
  // in a standard app you would pass this via props from ChatLayout or Context
  useEffect(() => {
      window.handleNewMessage = (msgData) => {
         if (msgData.channel_id === channelId) {
            // Avoid duplicate if we are sender (depend on backend logic)
            if (msgData.sender_uid !== user.uid) {
                setMessages(prev => [...prev, msgData]);
            }
         }
      }
      return () => { window.handleNewMessage = null; }
  }, [channelId, user.uid])

  if (!channelId) return <div className="flex-1 flex items-center justify-center text-gray-400">Select a group to start chatting</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <div className="p-4 bg-white border-b shadow-sm font-semibold capitalize sticky top-0">
          Chat - ID: <span className="text-gray-500 font-mono text-xs">{channelId}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
             const isMe = m.sender_uid === user.uid;
             return (
              <div key={m._id || m.message_seq || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                      {!isMe && <div className="text-[10px] opacity-50 mb-1">{m.sender_uid}</div>}
                      <p>{m.content}</p>
                  </div>
              </div>
             )
          })}
          <div ref={endRef} />
      </div>

      <div className="p-4 bg-white border-t">
          <form className="flex space-x-2" onSubmit={send}>
             <input 
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-gray-300 rounded-full bg-gray-100 px-4 py-2 outline-none focus:ring focus:border-indigo-300 transition-shadow"
             />
             <button type="submit" disabled={!text.trim()} className="bg-indigo-600 text-white rounded-full px-6 font-bold hover:bg-indigo-700 disabled:opacity-50">
                Send
             </button>
          </form>
      </div>
    </div>
  );
}
