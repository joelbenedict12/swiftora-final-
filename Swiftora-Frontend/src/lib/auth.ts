import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  merchantId?: string;
  isAdmin?: boolean;
  merchant?: {
    id: string;
    companyName: string;
    walletBalance: number;
  };
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    phone: string;
    name: string;
    password: string;
    companyName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { token, user } = response.data;

          set({ user, token, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error || 'Login failed');
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { token, user } = response.data;

          set({ user, token, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error || 'Registration failed');
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, token: null });
        }
      },

      setUser: (user) => set({ user }),

      checkSession: async () => {
        const token = get().token;
        if (!token) {
          set({ user: null, token: null });
          return;
        }

        try {
          const response = await authApi.me();
          set({ user: response.data.user, token });
        } catch (error) {
          console.error('Session check failed:', error);
          set({ user: null, token: null });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          await authApi.forgotPassword(email);
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'Failed to send reset email');
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true });
        try {
          await authApi.resetPassword(token, password);
          // Clear any existing session
          set({ user: null, token: null });
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'Failed to reset password');
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
