import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Download, FileText, Trash2, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { LessonComponent } from '../types';
import { generateCSV } from '../utils/csv';
import PageHeader from '../components/layout/PageHeader';
import SubmissionCard from '../components/submissions/SubmissionCard';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

interface Submission {
  id: string;
  student_name: string;
  student_class: string;
  answers: Record<string, any>;
  created_at: string;
  review_status: 'pending' | 'approved' | 'rejected';
}

export default function SubmissionsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [components, setComponents] = useState<LessonComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    if (!taskId || !user) return;

    const { data: task } = await supabase
      .from('lesson_tasks')
      .select('title, content_json')
      .eq('id', taskId)
      .maybeSingle();

    if (task) {
      setTaskTitle(task.title);
      setComponents(task.content_json || []);
    }

    const { data, error } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('lesson_task_id', taskId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    generateCSV(submissions, components, taskTitle);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 条提交记录吗？此操作不可恢复。`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('student_submissions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('student_submissions')
        .update({ review_status: status })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.map(s =>
        s.id === id ? { ...s, review_status: status } : s
      ));
    } catch (error) {
      console.error('更新审核状态失败:', error);
      alert('更新审核状态失败，请重试');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const actions = (
    <>
      {submissions.length > 0 && (
        <Button onClick={handleExportCSV} variant="secondary">
          <Download className="w-4 h-4" />
          导出CSV
        </Button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <PageHeader title={taskTitle} subtitle="学生提交记录" actions={actions} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-600">加载中...</div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="暂无提交记录"
            description="还没有学生提交作业"
          />
        ) : (
          <>
            <div className={`rounded-xl p-3 mb-3 border-2 flex items-center justify-between transition-all ${
              selectedIds.size > 0
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  {selectedIds.size === submissions.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      取消全选
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      全选
                    </>
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  刷新
                </button>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l-2 border-blue-300">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      已选中 {selectedIds.size} 条
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 ? (
                  <>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 font-medium transition-colors"
                    >
                      取消选择
                    </button>
                    <Button
                      onClick={handleBatchDelete}
                      variant="secondary"
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? '删除中...' : '批量删除'}
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-gray-600">
                    共 {submissions.length} 条提交记录
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {submissions.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  components={components}
                  isSelected={selectedIds.has(submission.id)}
                  onSelect={handleToggleSelect}
                  onDelete={handleDelete}
                  onReview={handleReview}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
