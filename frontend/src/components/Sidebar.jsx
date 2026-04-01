import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Sidebar({ setChannelId }) {
  const { user, logout } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinChannelId, setJoinChannelId] = useState('');

  const fetchGroups = async () => {
    if (!user?.uid) return;
    try {
      const res = await api.get(`/groups/list?uid=${user.uid}`);
      if (res.data?.data) {
        setGroups(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user?.uid) return;
    try {
      // Backend createGroup expects channelId, name, ownerUid
      const randomChannelId = 'CH-' + Math.random().toString(36).substring(2, 9);
      await api.post('/groups/create', { 
         channelId: randomChannelId,
         name: newGroupName,
         ownerUid: user.uid
      });
      setNewGroupName('');
      fetchGroups();
    } catch (e) {
       console.error("Failed to create group", e);
       alert("Failed to create chat room");
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinChannelId.trim() || !user?.uid) return;
    try {
      // Backend joinGroup expects channelId, uid
      await api.post('/groups/join', { 
         channelId: joinChannelId,
         uid: user.uid
      });
      setJoinChannelId('');
      fetchGroups();
    } catch (e) {
       console.error("Failed to join group", e);
       alert("Chat room not found or failed to join");
    }
  }

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return (
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col pt-[30px] px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-mono text-indigo-600">JS Chat.</h1>
        <button onClick={logout} className="text-sm font-semibold text-red-500 hover:bg-red-50 px-3 py-1 rounded-md transition-colors">
           Logout
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-6 p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="overflow-hidden">
           <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
           <p className="text-xs text-gray-500 truncate">{user?.uid}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Conversations</h2>
        {groups.length === 0 && <p className="text-xs text-gray-400 px-2">No active chats.</p>}
        {groups.map((group) => (
          <button
            key={group.channel_id}
            onClick={() => setChannelId(group.channel_id)}
            className="w-fulltext-left w-full block py-3 px-3 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-100 focus:text-indigo-800 mb-2 transition-all font-medium text-gray-700 text-left border border-transparent shadow-sm"
          >
            <div className="font-semibold truncate"># {group.name}</div>
            <div className="text-[10px] text-gray-400 truncate">ID: {group.channel_id}</div>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 pb-2 space-y-3">
        <form onSubmit={handleCreateGroup}>
            <input 
               type="text" 
               value={newGroupName}
               onChange={e => setNewGroupName(e.target.value)}
               placeholder="Create new chat name..." 
               className="w-full text-sm border-gray-200 shadow-sm border p-2.5 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium" 
            />
            <button type="submit" disabled={!newGroupName.trim()} className="w-full mt-2 bg-indigo-600 text-white rounded-md p-2 text-sm hover:bg-indigo-700 font-semibold shadow-sm disabled:opacity-50 transition-colors">
                + Create Chat
            </button>
        </form>

        <form onSubmit={handleJoinGroup}>
            <input 
               type="text" 
               value={joinChannelId}
               onChange={e => setJoinChannelId(e.target.value)}
               placeholder="Join using Channel ID..." 
               className="w-full text-sm border-gray-200 shadow-sm border p-2.5 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium" 
            />
            <button type="submit" disabled={!joinChannelId.trim()} className="w-full mt-2 bg-gray-800 text-white rounded-md p-2 text-sm hover:bg-gray-900 font-semibold shadow-sm disabled:opacity-50 transition-colors">
                → Join Chat
            </button>
        </form>
      </div>
    </div>
  );
}
