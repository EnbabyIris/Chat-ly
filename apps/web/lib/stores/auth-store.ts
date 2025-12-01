import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id?: string;
  name?: string;
  email?: string;
  pic?: string;
  token?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (userData: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  updateUserField: <K extends keyof User>(field: K, value: User[K]) => void;
  clearUser: () => void;
  getUser: () => User | null;
  getToken: () => string | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (userData) => {
        set({
          user: userData,
          isAuthenticated: !!userData,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: { ...currentUser, ...updates },
          isAuthenticated: true,
        });
      },

      updateUserField: (field, value) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: { ...currentUser, [field]: value },
          isAuthenticated: true,
        });
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      getUser: () => get().user,
      getToken: () => get().user?.token,
    }),
    {
      name: 'userInfo',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

