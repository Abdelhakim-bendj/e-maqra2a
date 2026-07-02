import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  studentProfile?: {
    teacherId: string | null;
    teacherStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    classId: string | null;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    // Lazy import to avoid circular dependency
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
