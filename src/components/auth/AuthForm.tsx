import { FormEvent, useState } from 'react';
import { BookOpen } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onSubmit, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">学习单管理系统</h1>
          <p className="text-gray-600">
            {mode === 'login' ? '登录你的账户' : '创建新账户'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                邮箱
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                fullWidth
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                密码
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6个字符"
                fullWidth
                disabled={loading}
              />
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onToggleMode}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {mode === 'login' ? '还没有账户？立即注册' : '已有账户？立即登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
