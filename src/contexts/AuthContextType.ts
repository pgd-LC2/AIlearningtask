import { createContext } from 'react';

export interface UserProfile {
  id: string;
  is_activated: boolean;
  is_admin: boolean;
}

export interface AuthContextType {
  user: { id: string; email: string };
  profile: UserProfile;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
