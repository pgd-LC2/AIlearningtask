import { ReactNode, useState, useRef, useEffect } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IconButton from '../ui/IconButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBack?: boolean;
  editable?: boolean;
  onTitleChange?: (newTitle: string) => void;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  showBack = true,
  editable = false,
  onTitleChange
}: PageHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleSave = () => {
    if (editValue.trim() && onTitleChange) {
      onTitleChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <header className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 flex-1">
            {showBack && (
              <IconButton onClick={() => navigate(-1)} className="bg-white/20 hover:bg-white/30 text-white">
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
            )}
            <div className="flex-1 max-w-2xl">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-full h-10 px-3 text-xl font-bold bg-white/20 border-2 border-white/40 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white"
                  placeholder="学习单标题"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  {editable && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
                      title="编辑标题"
                    >
                      <Pencil className="w-4 h-4 text-white/60 group-hover:text-white" />
                    </button>
                  )}
                </div>
              )}
              {subtitle && !isEditing && <p className="text-sm text-purple-100">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
