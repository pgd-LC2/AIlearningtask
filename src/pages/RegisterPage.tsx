import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/auth/AuthForm';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleRegister = async (email: string, password: string) => {
    const { error } = await signUp(email, password, email.split('@')[0]);
    if (error) {
      throw new Error(error.message);
    }
    navigate('/');
  };

  return (
    <AuthForm
      mode="register"
      onSubmit={handleRegister}
      onToggleMode={() => navigate('/login')}
    />
  );
}
