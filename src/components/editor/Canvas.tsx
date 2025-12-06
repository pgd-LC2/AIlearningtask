import { useState, useRef } from 'react';
import { LessonComponent } from '../../types';
import { Pencil, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import ComponentRenderer from './ComponentRenderer';
import InlineEditor from './InlineEditor';

interface CanvasProps {
  components: LessonComponent[];
  onUpdateComponent: (index: number, component: LessonComponent) => void;
  onDeleteComponent: (index: number) => void;
  onMoveComponent: (index: number, direction: 'up' | 'down') => void;
  onReorderComponent: (fromIndex: number, toIndex: number) => void;
  onDuplicateComponent: (index: number) => void;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
}

export default function Canvas({
  components,
  onUpdateComponent,
  onDeleteComponent,
  onMoveComponent,
  onReorderComponent,
  onDuplicateComponent,
  editingIndex,
  setEditingIndex,
}: CanvasProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');
  const lastPositionRef = useRef<{ index: number; position: 'before' | 'after' } | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleInlineSave = (component: LessonComponent) => {
    if (editingIndex !== null) {
      onUpdateComponent(editingIndex, component);
    }
    setEditingIndex(null);
  };

  const handleInlineCancel = () => {
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    if (confirm('确定要删除这个组件吗？')) {
      onDeleteComponent(index);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const elementTop = rect.top;
    const elementHeight = rect.height;
    const relativeY = mouseY - elementTop;

    const threshold = elementHeight * 0.35;

    let newPosition: 'before' | 'after';
    if (relativeY < threshold) {
      newPosition = 'before';
    } else if (relativeY > elementHeight - threshold) {
      newPosition = 'after';
    } else {
      newPosition = 'after';
    }

    const last = lastPositionRef.current;
    if (!last || last.index !== index || last.position !== newPosition) {
      lastPositionRef.current = { index, position: newPosition };
      setDropTargetIndex(index);
      setDropPosition(newPosition);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || components.length === 0) return;

    if (dropTargetIndex === null) {
      setDropTargetIndex(components.length - 1);
      setDropPosition('after');
      lastPositionRef.current = { index: components.length - 1, position: 'after' };
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (draggedIndex === null || dropTargetIndex === null) return;

    let toIndex = dropTargetIndex;

    if (dropPosition === 'after') {
      toIndex = dropTargetIndex + 1;
    }

    if (draggedIndex < toIndex) {
      toIndex--;
    }

    if (draggedIndex === toIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      lastPositionRef.current = null;
      return;
    }

    onReorderComponent(draggedIndex, toIndex);

    setDraggedIndex(null);
    setDropTargetIndex(null);
    lastPositionRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    lastPositionRef.current = null;
  };

  return (
    <main
      className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-8"
      onDragOver={handleCanvasDragOver}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {components.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-blue-300 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold mb-2">画布为空</p>
            <p className="text-sm text-gray-600">从左侧组件库中选择组件开始创建</p>
          </div>
        ) : (
          components.map((component, index) => (
            <div key={component.id} className="relative">
              {dropTargetIndex === index && dropPosition === 'before' && (
                <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg" />
              )}

              <div
                draggable={editingIndex !== index}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`relative group transition-all ${
                  draggedIndex === index ? 'opacity-40 scale-95' : ''
                }`}
                onMouseEnter={() => editingIndex === null && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {editingIndex === index ? (
                  <InlineEditor
                    component={component}
                    onSave={handleInlineSave}
                    onCancel={handleInlineCancel}
                  />
                ) : (
                  <>
                    <div
                      onDoubleClick={() => handleEdit(index)}
                      className={`bg-white rounded-xl p-6 border-2 transition-all ${
                        draggedIndex === index ? 'cursor-grabbing' : 'cursor-grab'
                      } ${
                        hoveredIndex === index ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : 'border-gray-200 shadow-sm'
                      }`}
                    >
                      <ComponentRenderer component={component} />
                    </div>

                    {hoveredIndex === index && editingIndex === null && draggedIndex === null && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 p-1">
                        <button
                          onClick={() => onMoveComponent(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="上移"
                        >
                          <ArrowUp className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => onMoveComponent(index, 'down')}
                          disabled={index === components.length - 1}
                          className="p-1.5 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="下移"
                        >
                          <ArrowDown className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => onDuplicateComponent(index)}
                          className="p-1.5 hover:bg-green-50 rounded transition-colors"
                          title="复制"
                        >
                          <Copy className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1.5 hover:bg-purple-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4 text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {dropTargetIndex === index && dropPosition === 'after' && (
                <div className="h-1 bg-primary rounded-full mt-4 shadow-lg" />
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
