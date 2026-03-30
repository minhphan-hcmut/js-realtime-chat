import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Sidebar({ setChannelId }) {
  const { user, logout } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/list');
      // Assume the backend returns data in an array structure
      if (res.data?.data) {
        setGroups(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await api.post('/groups/create', { name: newGroupName });
      setNewGroupName('');
      fetchGroups();
    } catch (e) {
       console.error(e);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col pt-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-mono">ChatApp.</h1>
        <button onClick={logout} className="text-sm text-red-500 hover:bg-red-50 p-2 rounded">
           Logout
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
           <p className="font-semibold">{user?.name}</p>
           <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Your Groups</h2>
        {groups.map((group) => (
          <button
            key={group.channel_id}
            onClick={() => setChannelId(group.channel_id)}
            className="w-fulltext-left w-full block py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 mb-2 transition-colors font-medium text-gray-700 text-left"
          >
            # {group.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateGroup} className="mt-4 pb-4">
          <input 
             type="text" 
             value={newGroupName}
             onChange={e => setNewGroupName(e.target.value)}
             placeholder="New channel name..." 
             className="w-full text-sm border p-2 rounded bg-gray-50 focus:outline-none focus:ring focus:border-indigo-300" 
          />
          <button type="submit" className="w-full mt-2 bg-indigo-600 text-white rounded p-2 text-sm hover:bg-indigo-700 font-semibold">
              Create Channel
          </button>
      </form>
    </div>
  );
}
