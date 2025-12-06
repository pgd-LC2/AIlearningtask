import { BookOpen, LogOut, Plus, Trash2, Settings, FolderPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';

interface HomeHeaderProps {
  onCreateTask: () => void;
  onCreateFolder: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  deleting: boolean;
}

export default function HomeHeader({ onCreateTask, onCreateFolder, onDeleteSelected, selectedCount, deleting }: HomeHeaderProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">学习单管理</h1>
              <p className="text-xs text-blue-100">创建和管理你的学习单</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button
                onClick={onDeleteSelected}
                disabled={deleting}
                variant="danger"
              >
                <Trash2 className="w-4 h-4" />
                删除 ({selectedCount})
              </Button>
            )}
            <Button onClick={onCreateFolder} variant="secondary">
              <FolderPlus className="w-4 h-4" />
              新建文件夹
            </Button>
            <Button onClick={onCreateTask} variant="primary">
              <Plus className="w-4 h-4" />
              新建学习单
            </Button>
            {profile?.is_admin && (
              <IconButton onClick={() => navigate('/admin')} title="管理激活码" className="bg-white/20 hover:bg-white/30 text-white">
                <Settings className="w-5 h-5" />
              </IconButton>
            )}
            <IconButton onClick={signOut} title="退出登录" className="bg-white/20 hover:bg-white/30 text-white">
              <LogOut className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  );
}
