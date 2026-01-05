import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { LessonTask, Folder, LessonControl } from '../types';
import { FileText, FolderOpen } from 'lucide-react';
import { generateStudentHTML } from '../utils/htmlGenerator';
import HomeHeader from '../components/home/HomeHeader';
import TaskCard from '../components/home/TaskCard';
import FolderCard from '../components/home/FolderCard';
import EmptyState from '../components/ui/EmptyState';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LessonTask[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [isDraggingOverMain, setIsDraggingOverMain] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [controlStates, setControlStates] = useState<Map<string, boolean>>(new Map());

  const loadData = useCallback(async () => {
    if (!user) return;

    const [tasksResult, foldersResult, controlsResult] = await Promise.all([
      supabase
        .from('lesson_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
      supabase
        .from('lesson_controls')
        .select('*')
    ]);

    if (!tasksResult.error && tasksResult.data) {
      setTasks(tasksResult.data);
    }

    if (!foldersResult.error && foldersResult.data) {
      setFolders(foldersResult.data);
    }

    if (!controlsResult.error && controlsResult.data) {
      const statesMap = new Map<string, boolean>();
      controlsResult.data.forEach((control: LessonControl) => {
        statesMap.set(control.task_id, control.control_enabled);
      });
      setControlStates(statesMap);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createNewTask = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lesson_tasks')
      .insert([
        {
          user_id: user.id,
          title: '未命名学习单',
          content_json: [],
          folder_id: null,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      navigate(`/editor/${data.id}`);
    }
  };

  const createNewFolder = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('folders')
      .insert([
        {
          user_id: user.id,
          name: '新文件夹',
          parent_id: null,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setFolders([...folders, data]);
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('folders')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (!error) {
      setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName } : f));
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;

    const tasksInFolder = tasks.filter(t => t.folder_id === folderId);

    if (tasksInFolder.length > 0) {
      alert('无法删除：文件夹内有学习单');
      return;
    }

    if (!confirm('确定要删除这个文件夹吗？')) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (!error) {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  const deleteMultipleTasks = async () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedTasks.size} 个学习单吗？`)) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('lesson_tasks')
        .delete()
        .in('id', Array.from(selectedTasks))
        .eq('user_id', user?.id);

      if (error) throw error;

      setTasks(tasks.filter(t => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const moveTaskToFolder = async (taskId: string, folderId: string | null) => {
    if (!user) return;

    setMovingTaskId(taskId);

    await new Promise(resolve => setTimeout(resolve, 300));

    const { error } = await supabase
      .from('lesson_tasks')
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, folder_id: folderId } : t));
    }

    setTimeout(() => setMovingTaskId(null), 300);
  };

  const handleDownloadHTML = (task: LessonTask) => {
    const components = Array.isArray(task.content_json) ? task.content_json : [];
    const controlEnabled = controlStates.get(task.id) || false;
    const html = generateStudentHTML(
      task.title,
      components,
      task.id,
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      controlEnabled
    );

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rootTasks = tasks.filter(t => !t.folder_id);
  const isEmpty = tasks.length === 0 && folders.length === 0;

  const handleMainAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverMain(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTaskToFolder(taskId, null);
    }
  };

  const handleMainAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverMain(true);
  };

  const handleMainAreaDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingOverMain(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-blue-purple-pink">
      <HomeHeader
        onCreateTask={createNewTask}
        onCreateFolder={createNewFolder}
        onDeleteSelected={deleteMultipleTasks}
        selectedCount={selectedTasks.size}
        deleting={deleting}
      />

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]"
        onDrop={handleMainAreaDrop}
        onDragOver={handleMainAreaDragOver}
        onDragLeave={handleMainAreaDragLeave}
      >
        {loading ? (
          <div className="text-center py-12 text-gray-600">加载中...</div>
        ) : isEmpty ? (
          <EmptyState
            icon={FileText}
            title="还没有学习单"
            description="创建你的第一个学习单，开始使用吧"
            actionLabel="新建学习单"
            onAction={createNewTask}
          />
        ) : (
          <div className="space-y-3">
            {folders.map(folder => {
              const folderTasks = tasks.filter(t => t.folder_id === folder.id);
              const isExpanded = expandedFolders.has(folder.id);

              return (
                <div key={folder.id}>
                  <FolderCard
                    folder={folder}
                    taskCount={folderTasks.length}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleFolderExpand(folder.id)}
                    onRename={(newName) => renameFolder(folder.id, newName)}
                    onDelete={() => deleteFolder(folder.id)}
                    onDrop={(taskId) => moveTaskToFolder(taskId, folder.id)}
                  />
                  {isExpanded && folderTasks.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                      {folderTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="animate-in slide-in-from-top-1 fade-in"
                          style={{ animationDelay: `${index * 50}ms`, animationDuration: '200ms' }}
                        >
                          <TaskCard
                            task={task}
                            selected={selectedTasks.has(task.id)}
                            onToggleSelect={() => toggleTaskSelection(task.id)}
                            onDownload={() => handleDownloadHTML(task)}
                            onDragStart={() => {}}
                            isMoving={movingTaskId === task.id}
                            controlEnabled={controlStates.get(task.id) || false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {rootTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedTasks.has(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                onDownload={() => handleDownloadHTML(task)}
                controlEnabled={controlStates.get(task.id) || false}
                onDragStart={() => {}}
                isMoving={movingTaskId === task.id}
              />
            ))}

            {folders.length > 0 && rootTasks.length === 0 && isDraggingOverMain && (
              <div className="mt-4 p-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-center">
                <FolderOpen className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-blue-700">拖到这里移出文件夹</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
