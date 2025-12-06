import { Folder as FolderIcon, FolderOpen, MoreVertical, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Folder } from '../../types';
import { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';

interface FolderCardProps {
  folder: Folder;
  taskCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onDrop: (taskId: string) => void;
}

export default function FolderCard({ folder, taskCount, isExpanded, onToggleExpand, onRename, onDelete, onDrop }: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(folder.name);
      setIsRenaming(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId);
    }
  };

  return (
    <Card
      className={`transition-all ${isDragOver ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400'} group`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleExpand}
          className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
        >
          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <FolderIcon className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm font-medium border-2 border-blue-500 rounded focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500">({taskCount})</span>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                重命名
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
