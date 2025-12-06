import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Key, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ActivationPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入激活码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase
        .rpc('verify_and_use_activation_code', {
          activation_code: code.trim()
        });

      if (rpcError) throw rpcError;

      if (data?.success) {
        await refreshProfile();
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data?.message || '激活失败');
      }
    } catch (err: any) {
      setError(err.message || '激活失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient-blue-purple-pink p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">激活成功</h2>
            <p className="text-gray-600">正在跳转到首页...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient-blue-purple-pink p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">激活账号</h1>
            <p className="text-gray-600">请输入激活码来激活您的账号</p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="输入激活码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !code.trim()}
              fullWidth
            >
              {loading ? '验证中...' : '激活账号'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">还没有激活码？</p>
            <p className="text-xs text-gray-500">请联系管理员获取激活码</p>
          </div>
        </div>
      </div>
    </div>
  );
}
