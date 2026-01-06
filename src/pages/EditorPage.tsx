import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { LessonComponent } from '../types';
import { Save, Eye, Download, History } from 'lucide-react';
import { generateStudentHTML } from '../utils/htmlGenerator';
import { useAutoSave } from '../hooks/useAutoSave';
import { useDraft } from '../hooks/useDraft';
import PageHeader from '../components/layout/PageHeader';
import ComponentLibrary from '../components/editor/ComponentLibrary';
import Canvas from '../components/editor/Canvas';
import TeacherControlPanel from '../components/editor/TeacherControlPanel';
import DraftRecoveryBanner from '../components/editor/DraftRecoveryBanner';
import Button from '../components/ui/Button';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('未命名学习单');
  const [components, setComponents] = useState<LessonComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftTime, setDraftTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadRef = useRef(true);
  const lastSavedDataRef = useRef<{ title: string; components: LessonComponent[] } | null>(null);

  const { saveDraft, saveDraftImmediately, loadDraft, clearDraft } = useDraft(id);

  const loadTask = useCallback(async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('lesson_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      const dbTitle = data.title;
      const dbComponents = Array.isArray(data.content_json) ? data.content_json : [];
      const dbUpdatedAt = new Date(data.updated_at).getTime();

      const draft = loadDraft();
      if (draft && draft.timestamp > dbUpdatedAt) {
        setShowDraftBanner(true);
        setDraftTime(new Date(draft.timestamp));
        setTitle(dbTitle);
        setComponents(dbComponents);
      } else {
        setTitle(dbTitle);
        setComponents(dbComponents);
        if (draft) {
          clearDraft();
        }
      }

      lastSavedDataRef.current = { title: dbTitle, components: dbComponents };
    }
  }, [id, user, loadDraft, clearDraft]);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id, loadTask]);

  const saveTask = useCallback(async () => {
    if (!id || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from('lesson_tasks')
      .update({
        title,
        content_json: components,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastSavedDataRef.current = { title, components };
      clearDraft();

      await supabase
        .from('lesson_task_versions')
        .insert({
          task_id: id,
          user_id: user.id,
          title,
          content_json: components,
          change_description: '自动保存',
        });
    }
    setSaving(false);
  }, [id, user, title, components, clearDraft]);

  useAutoSave({
    onSave: saveTask,
    delay: 10000,
    enabled: components.length > 0 || title !== '未命名学习单'
  });

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    saveDraft(title, components);
    setHasUnsavedChanges(true);
  }, [title, components, saveDraft]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        saveDraftImmediately(title, components);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        saveDraftImmediately(title, components);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges, title, components, saveDraftImmediately]);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setComponents(draft.components);
      setShowDraftBanner(false);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  const handleAddComponent = (component: LessonComponent) => {
    const newIndex = components.length;
    setComponents([...components, component]);
    setEditingIndex(newIndex);
  };

  const handleUpdateComponent = (index: number, component: LessonComponent) => {
    const newComponents = [...components];
    newComponents[index] = component;
    setComponents(newComponents);
  };

  const handleDeleteComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
    const newComponents = [...components];
    if (direction === 'up' && index > 0) {
      [newComponents[index], newComponents[index - 1]] = [newComponents[index - 1], newComponents[index]];
    } else if (direction === 'down' && index < components.length - 1) {
      [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
    }
    setComponents(newComponents);
  };

  const handleReorderComponent = (fromIndex: number, toIndex: number) => {
    const newComponents = [...components];
    const [movedItem] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, movedItem);
    setComponents(newComponents);
  };

  const handleDuplicateComponent = (index: number) => {
    const componentToDuplicate = components[index];
    const duplicatedComponent = {
      ...componentToDuplicate,
      id: `${componentToDuplicate.type}-${Date.now()}`,
      config: { ...componentToDuplicate.config }
    };
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, duplicatedComponent);
    setComponents(newComponents);
  };

  const handleGenerateHTML = async () => {
    if (!id) return;

    setGenerating(true);
    try {
      await saveTask();

      const html = generateStudentHTML(
        title,
        components,
        id,
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (!id) return;

    const html = generateStudentHTML(
      title,
      components,
      id,
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleViewHistory = () => {
    if (id) {
      navigate(`/editor/${id}/history`);
    }
  };

  const actions = (
    <>
      <div className="text-xs text-gray-600">
        {saving ? '保存中...' : lastSaved ? `已保存 ${lastSaved.toLocaleTimeString()}` : ''}
      </div>
      <Button onClick={handleViewHistory} variant="ghost">
        <History className="w-4 h-4" />
        历史版本
      </Button>
      <Button onClick={saveTask} disabled={saving} variant="ghost">
        <Save className="w-4 h-4" />
        {saving ? '保存中...' : '保存'}
      </Button>
      <Button onClick={handlePreview} variant="outline">
        <Eye className="w-4 h-4" />
        预览
      </Button>
      <Button onClick={handleGenerateHTML} disabled={generating} variant="secondary">
        <Download className="w-4 h-4" />
        {generating ? '生成中...' : '下载学习单'}
      </Button>
    </>
  );

  return (
    <div className="h-screen flex flex-col mesh-gradient-blue-purple-pink">
      <PageHeader
        title={title}
        actions={actions}
        editable
        onTitleChange={setTitle}
      />

      {showDraftBanner && draftTime && (
        <DraftRecoveryBanner
          draftTime={draftTime}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0">
          <ComponentLibrary onAddComponent={handleAddComponent} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Canvas
              components={components}
              onUpdateComponent={handleUpdateComponent}
              onDeleteComponent={handleDeleteComponent}
              onMoveComponent={handleMoveComponent}
              onReorderComponent={handleReorderComponent}
              onDuplicateComponent={handleDuplicateComponent}
              editingIndex={editingIndex}
              setEditingIndex={setEditingIndex}
            />
          </div>
        </div>
      </div>

      {id && <TeacherControlPanel taskId={id} components={components} />}
    </div>
  );
}
