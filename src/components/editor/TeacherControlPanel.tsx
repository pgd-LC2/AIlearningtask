import { useState, useEffect, useRef } from 'react';
import { Radio, ChevronLeft, ChevronRight, Power, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { navigateToPage, getControlState, updateControlEnabled, sendHeartbeat } from '../../lib/lessonControl';
import { LessonComponent } from '../../types';
import Button from '../ui/Button';

interface TeacherControlPanelProps {
  taskId: string;
  components: LessonComponent[];
}

export default function TeacherControlPanel({ taskId, components }: TeacherControlPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pages = getPageCount(components);
  const totalPages = pages.length;
  const hasPages = totalPages > 1;

  useEffect(() => {
    loadControlState();
  }, [taskId]);

  useEffect(() => {
    if (enabled) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    return () => stopHeartbeat();
  }, [enabled, taskId]);

  const loadControlState = async () => {
    const state = await getControlState(taskId);
    if (state) {
      setEnabled(state.control_enabled);
      setCurrentPage(state.current_page);
    }
  };

  const handleToggleControl = async () => {
    if (!hasPages) {
      alert('请先添加分页符组件创建多个页面');
      return;
    }

    setLoading(true);
    const newEnabled = !enabled;
    console.log('[教师控制] 切换控制状态:', enabled, '->', newEnabled);
    const result = await updateControlEnabled(taskId, newEnabled);

    if (result.success) {
      console.log('[教师控制] 状态切换成功');
      setEnabled(newEnabled);
      if (newEnabled) {
        console.log('[教师控制] 初始化到页面:', currentPage);
        await handleNavigate(currentPage);
      }
    } else {
      console.error('[教师控制] 状态切换失败:', result.error);
      alert('操作失败: ' + result.error);
    }
    setLoading(false);
  };

  const startHeartbeat = () => {
    console.log('[教师控制] 开始发送心跳');
    sendHeartbeat(taskId);

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat(taskId);
    }, 5000);
  };

  const stopHeartbeat = () => {
    console.log('[教师控制] 停止发送心跳');
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  const handleNavigate = async (page: number) => {
    if (page < 0 || page >= totalPages) return;

    console.log('[教师控制] 导航到页面:', page);
    setSyncing(true);
    const result = await navigateToPage(taskId, page);

    if (result.success) {
      console.log('[教师控制] 导航成功');
      setCurrentPage(page);
    } else {
      console.error('[教师控制] 导航失败:', result.error);
      alert('切换失败: ' + result.error);
    }
    setSyncing(false);
  };

  return (
    <>
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          title="显示控制面板"
        >
          <Radio className="w-5 h-5" />
        </button>
      )}

      {showPanel && (
        <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4 w-80 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-900">流程控制</h3>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="隐藏面板"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-tight">
              实验性功能：控制学生端展示进度
            </p>
          </div>

          {!hasPages && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 leading-tight">
                💡 提示：请先在画布中添加<strong>分页符</strong>组件创建多页学习单，然后即可启用流程控制
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {enabled ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  控制状态
                </span>
              </div>
              <button
                onClick={handleToggleControl}
                disabled={loading || !hasPages}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  enabled ? 'bg-green-500' : hasPages ? 'bg-gray-300' : 'bg-gray-200'
                } ${loading || !hasPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={!hasPages ? '请先添加分页符' : ''}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {enabled && hasPages && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-900">
                      当前页码
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {currentPage + 1} / {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleNavigate(currentPage - 1)}
                      disabled={currentPage === 0 || syncing}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </button>
                    <button
                      onClick={() => handleNavigate(currentPage + 1)}
                      disabled={currentPage === totalPages - 1 || syncing}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleNavigate(i)}
                      disabled={syncing}
                      className={`h-8 rounded-lg text-xs font-bold transition-all ${
                        i === currentPage
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {syncing && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-600">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    同步中...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function getPageCount(components: LessonComponent[]): LessonComponent[][] {
  const pages: LessonComponent[][] = [];
  let currentPage: LessonComponent[] = [];

  components.forEach(comp => {
    if (comp.type === 'page-break') {
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }
    } else {
      currentPage.push(comp);
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [components];
}
