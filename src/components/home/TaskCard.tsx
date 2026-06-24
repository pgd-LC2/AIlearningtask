import { CreditCard as Edit, Download, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LessonTask } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import Card from '../ui/Card';
import IconButton from '../ui/IconButton';

interface TaskCardProps {
  task: LessonTask;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
  onDragStart: () => void;
  isMoving?: boolean;
}

export default function TaskCard({ task, selected, onToggleSelect, onDownload, onDragStart, isMoving = false }: TaskCardProps) {
  const navigate = useNavigate();
  const componentCount = Array.isArray(task.content_json) ? task.content_json.length : 0;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={`transition-all duration-300 cursor-move select-none ${
        isDragging ? 'opacity-50 border-blue-500' :
        isMoving ? 'opacity-0 scale-95' :
        'hover:border-gray-400'
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="pt-0.5">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold text-gray-900 cursor-pointer hover:text-gray-700 mb-1"
              onClick={() => navigate(`/editor/${task.id}`)}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                {componentCount} 题
              </span>
              <span>{formatRelativeTime(task.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1" draggable={false} onDragStart={(e) => e.preventDefault()}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/editor/${task.id}`);
            }}
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            title="下载学习单"
          >
            <Download className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}
