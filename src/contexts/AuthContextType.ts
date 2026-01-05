import { createContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  is_activated: boolean;
  is_admin: boolean;
  activation_code_id: string | null;
  activated_at: string | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
