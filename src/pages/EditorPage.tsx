import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { LessonComponent } from '../types';
import { Save, Eye, Download } from 'lucide-react';
import { generateStudentHTML } from '../utils/htmlGenerator';
import { useAutoSave } from '../hooks/useAutoSave';
import PageHeader from '../components/layout/PageHeader';
import ComponentLibrary from '../components/editor/ComponentLibrary';
import Canvas from '../components/editor/Canvas';
import TeacherControlPanel from '../components/editor/TeacherControlPanel';
import Button from '../components/ui/Button';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [title, setTitle] = useState('未命名学习单');
  const [components, setComponents] = useState<LessonComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const loadTask = useCallback(async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('lesson_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setTitle(data.title);
      setComponents(Array.isArray(data.content_json) ? data.content_json : []);
    }
  }, [id, user]);

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
    }
    setSaving(false);
  }, [id, user, title, components]);

  useAutoSave({
    onSave: saveTask,
    enabled: components.length > 0 || title !== '未命名学习单'
  });

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

  const actions = (
    <>
      <div className="text-xs text-gray-600">
        {saving ? '保存中...' : lastSaved ? `已保存 ${lastSaved.toLocaleTimeString()}` : ''}
      </div>
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
