import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/auth/AuthForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      throw new Error(error.message);
    }
    navigate('/');
  };

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      onToggleMode={() => navigate('/register')}
    />
  );
}
