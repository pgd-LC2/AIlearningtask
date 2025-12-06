import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Download, FileText } from 'lucide-react';
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
}

export default function SubmissionsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [components, setComponents] = useState<LessonComponent[]>([]);
  const [loading, setLoading] = useState(true);

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
          <div className="space-y-3">
            {submissions.map(submission => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                components={components}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
