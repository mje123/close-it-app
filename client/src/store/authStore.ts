import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, licenseNumber?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.post('/api/auth/login', { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (err: unknown) {
          const msg = (err as any)?.response?.data?.error || 'Login failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (email, password, name, licenseNumber) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.post('/api/auth/register', { email, password, name, licenseNumber });
          set({ user: data.user, token: data.token, isLoading: false });
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (err: unknown) {
          const msg = (err as any)?.response?.data?.error || 'Registration failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: () => {
        set({ user: null, token: null });
        delete axios.defaults.headers.common['Authorization'];
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'close-it-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
