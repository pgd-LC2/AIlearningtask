import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Key, Plus, Copy, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import PageHeader from '../components/layout/PageHeader';

interface ActivationCode {
  id: string;
  code: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  note: string | null;
}

export default function AdminPage() {
  const { profile } = useAuth();
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCodes(data);
      }
    } catch (err) {
      console.error('加载激活码失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    if (count < 1 || count > 100) {
      alert('请输入1-100之间的数量');
      return;
    }

    setGenerating(true);
    try {
      const newCodes = [];
      for (let i = 0; i < count; i++) {
        const code = generateRandomCode();
        newCodes.push({
          code,
          note: note.trim() || null,
        });
      }

      const { error } = await supabase
        .from('activation_codes')
        .insert(newCodes);

      if (error) throw error;

      alert(`成功生成 ${count} 个激活码`);
      setCount(1);
      setNote('');
      loadCodes();
    } catch (err: any) {
      alert('生成失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateRandomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient-blue-purple-pink">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">您没有访问此页面的权限</p>
        </Card>
      </div>
    );
  }

  const unusedCodes = codes.filter(c => !c.used);
  const usedCodes = codes.filter(c => c.used);

  return (
    <div className="min-h-screen mesh-gradient-blue-purple-pink">
      <PageHeader title="激活码管理" showBackButton />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <div className="text-3xl font-bold mb-1">{codes.length}</div>
            <div className="text-blue-100">总激活码数</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <div className="text-3xl font-bold mb-1">{usedCodes.length}</div>
            <div className="text-green-100">已使用</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <div className="text-3xl font-bold mb-1">{unusedCodes.length}</div>
            <div className="text-amber-100">未使用</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            生成激活码
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              placeholder="数量 (1-100)"
            />
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注 (可选)"
            />
            <Button onClick={generateCodes} disabled={generating} fullWidth>
              {generating ? '生成中...' : '生成'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            激活码列表
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-600">加载中...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">暂无激活码</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">激活码</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">备注</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">创建时间</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">使用时间</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        {code.used ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            已使用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            未使用
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {code.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(code.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => copyCode(code.code)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="复制激活码"
                        >
                          {copiedCode === code.code ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
