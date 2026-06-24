import { ReactNode } from 'react';
import { AuthContext } from './AuthContextType';

const DEMO_USER_ID = 'demo-user-00000000';

const demoUser = { id: DEMO_USER_ID, email: 'demo@local' };
const demoProfile = { id: DEMO_USER_ID, is_activated: true, is_admin: true };

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: demoUser, profile: demoProfile, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}
