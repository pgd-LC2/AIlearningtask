import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Clock, ArrowLeft, RotateCcw, Eye } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

interface Version {
  id: string;
  title: string;
  content_json: unknown;
  change_description: string | null;
  created_at: string;
}

export default function VersionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    const loadVersions = async () => {
      if (!id || !user) return;

      setLoading(true);
      const [versionsResult, taskResult] = await Promise.all([
        supabase
          .from('lesson_task_versions')
          .select('*')
          .eq('task_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('lesson_tasks')
          .select('title')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (!versionsResult.error && versionsResult.data) {
        setVersions(versionsResult.data);
      }

      if (!taskResult.error && taskResult.data) {
        setTaskTitle(taskResult.data.title);
      }

      setLoading(false);
    };

    loadVersions();
  }, [id, user]);

  const handleBack = () => {
    navigate(`/editor/${id}`);
  };

  const handleRestore = async (version: Version) => {
    if (!id || !user) return;

    setRestoring(version.id);
    try {
      const { error } = await supabase
        .from('lesson_tasks')
        .update({
          title: version.title,
          content_json: version.content_json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        await supabase
          .from('lesson_task_versions')
          .insert({
            task_id: id,
            user_id: user.id,
            title: version.title,
            content_json: version.content_json,
            change_description: `恢复到 ${formatDateTime(version.created_at)}`,
          });

        navigate(`/editor/${id}`);
      }
    } catch (error) {
      console.error('恢复版本失败:', error);
      alert('恢复版本失败，请重试');
    } finally {
      setRestoring(null);
    }
  };

  const handlePreview = (version: Version) => {
    console.log('预览版本:', version);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return formatDateTime(dateStr);
  };

  const actions = (
    <Button onClick={handleBack} variant="ghost">
      <ArrowLeft className="w-4 h-4" />
      返回编辑
    </Button>
  );

  if (loading) {
    return (
      <div className="h-screen flex flex-col mesh-gradient-blue-purple-pink">
        <PageHeader title={`${taskTitle} - 版本历史`} actions={actions} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col mesh-gradient-blue-purple-pink">
      <PageHeader title={`${taskTitle} - 版本历史`} actions={actions} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {versions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="暂无版本历史"
              description="当你保存学习单时，系统会自动创建版本记录"
            />
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <Card key={version.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {version.title}
                        </h3>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                            最新
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{formatRelativeTime(version.created_at)}</span>
                        {version.change_description && (
                          <>
                            <span>·</span>
                            <span className="text-gray-500">{version.change_description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(version)}
                      >
                        <Eye className="w-4 h-4" />
                        预览
                      </Button>
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version)}
                          disabled={restoring === version.id}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {restoring === version.id ? '恢复中...' : '恢复'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
