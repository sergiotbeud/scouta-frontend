import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../domain/entities/User';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        if (typeof document !== 'undefined') {
          document.cookie = `scouta-auth-storage=authenticated; path=/; max-age=86400`;
        }
      },
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof document !== 'undefined') {
          document.cookie = 'scouta-auth-storage=; path=/; max-age=0';
        }
      },
    }),
    {
      name: 'scouta-auth-storage',
    }
  )
);

