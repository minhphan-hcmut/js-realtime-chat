import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
             <ChatLayout />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;
