import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  accessToken: localStorage.getItem('accessToken'),

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.data.accessToken);
      set({ user: data.data.user, accessToken: data.data.accessToken });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  },

  register: async (name, email, password) => {
    try {
      await api.post('/auth/register', { name, email, password });
      return true;
    } catch (error) {
       console.error('Register failed', error);
       return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, accessToken: null, loading: false });
    }
  },

  checkAuth: async () => {
    try {
      // Decode user from token or fetch profile
      // For now we assume if we have token and it's valid, user is authenticated
      // Ideally backend returns user info on a /me endpoint or inside token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ loading: false });
        return;
      }
      
      // Let's rely on a basic decoding since we don't have a GET /auth/me in the analysis
      // We will just set a dummy user state if token exists, letting interceptor handle expiration
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
          const decodedJson = atob(payloadBase64);
          const decoded = JSON.parse(decodedJson);
          set({ user: decoded, loading: false, accessToken: token });
      } else {
          set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  }
}));

export default useAuthStore;
