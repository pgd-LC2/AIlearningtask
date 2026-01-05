import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextType';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}
