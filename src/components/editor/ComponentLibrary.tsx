import { useState } from 'react';
import { Heading, Type, Columns2 as Columns, List, CheckSquare, TextCursorInput, MessageSquare, Gift, Code, ChevronDown, ChevronRight, Image, Video, Minus, Link, FileCode } from 'lucide-react';
import { LessonComponent } from '../../types';

interface ComponentLibraryProps {
  onAddComponent: (component: LessonComponent) => void;
}

export default function ComponentLibrary({ onAddComponent }: ComponentLibraryProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'media', 'questions', 'advanced']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createDefaultComponent = (type: string): LessonComponent => {
    const id = `${type}-${Date.now()}`;

    switch (type) {
      case 'title':
        return { id, type: 'title', config: { text: '', size: 'large', align: 'left' } };
      case 'paragraph':
        return { id, type: 'paragraph', config: { text: '', size: 'normal' } };
      case 'two-column':
        return { id, type: 'two-column', config: { leftContent: '', rightContent: '' } };
      case 'three-column':
        return { id, type: 'three-column', config: { content1: '', content2: '', content3: '' } };
      case 'single-choice':
        return { id, type: 'single-choice', config: { question: '', options: ['', ''], correctAnswer: 0, explanation: '' } };
      case 'multiple-choice':
        return { id, type: 'multiple-choice', config: { question: '', options: ['', ''], correctAnswers: [], explanation: '' } };
      case 'fill-blank':
        return { id, type: 'fill-blank', config: { text: '', correctAnswers: [] } };
      case 'question-answer':
        return { id, type: 'question-answer', config: { question: '', referenceAnswer: '' } };
      case 'lucky-box':
        return { id, type: 'lucky-box', config: { title: '', options: ['', ''], mode: 'random' } };
      case 'embed-html':
        return { id, type: 'embed-html', config: { htmlCode: '' } };
      case 'image':
        return { id, type: 'image', config: { url: '', alt: '', align: 'center', width: 100 } };
      case 'video':
        return { id, type: 'video', config: { platform: 'bilibili', embedCode: '', height: 400 } };
      case 'page-break':
        return { id, type: 'page-break', config: { label: '' } };
      case 'hyperlink':
        return { id, type: 'hyperlink', config: { text: '点击这里', url: '', openInNewTab: true } };
      case 'code-editor':
        return {
          id,
          type: 'code-editor' as const,
          config: {
            sections: [
              { id: 'section-1', title: '题目', color: '#3b82f6' },
              { id: 'section-2', title: '要求', color: '#10b981' }
            ],
            language: 'python',
            initialCode: '# 在这里编写你的代码\n',
            placeholder: '请在此输入 Python 代码...'
          }
        };
      default:
        return { id, type: type as any, config: {} } as LessonComponent;
    }
  };

  const handleComponentClick = (type: string) => {
    const component = createDefaultComponent(type);
    onAddComponent(component);
  };

  const componentGroups = [
    {
      id: 'basic',
      title: '基础组件',
      color: 'blue',
      components: [
        { type: 'title', icon: Heading, label: '文档标题' },
        { type: 'paragraph', icon: Type, label: '正文段落' },
        { type: 'hyperlink', icon: Link, label: '超链接' },
        { type: 'two-column', icon: Columns, label: '二列布局' },
        { type: 'three-column', icon: Columns, label: '三列布局' },
        { type: 'page-break', icon: Minus, label: '分页符' },
      ],
    },
    {
      id: 'media',
      title: '媒体组件',
      color: 'purple',
      components: [
        { type: 'image', icon: Image, label: '图片' },
        { type: 'video', icon: Video, label: '视频' },
      ],
    },
    {
      id: 'questions',
      title: '题目工具',
      color: 'green',
      components: [
        { type: 'single-choice', icon: List, label: '单选题' },
        { type: 'multiple-choice', icon: CheckSquare, label: '多选题' },
        { type: 'fill-blank', icon: TextCursorInput, label: '填空题' },
        { type: 'question-answer', icon: MessageSquare, label: '问答题' },
        { type: 'code-editor', icon: FileCode, label: '代码编辑器' },
      ],
    },
    {
      id: 'advanced',
      title: '高级组件',
      color: 'orange',
      components: [
        { type: 'lucky-box', icon: Gift, label: '盲盒' },
        { type: 'embed-html', icon: Code, label: '嵌入HTML' },
      ],
    },
  ];

  const colorStyles: Record<string, { header: string; icon: string; button: string }> = {
    blue: {
      header: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: 'text-blue-500',
      button: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-200'
    },
    purple: {
      header: 'bg-gradient-to-r from-purple-500 to-purple-600',
      icon: 'text-purple-500',
      button: 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:border-purple-200'
    },
    green: {
      header: 'bg-gradient-to-r from-green-500 to-green-600',
      icon: 'text-green-500',
      button: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-200'
    },
    orange: {
      header: 'bg-gradient-to-r from-orange-500 to-orange-600',
      icon: 'text-orange-500',
      button: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:border-orange-200'
    }
  };

  return (
    <aside className="h-full bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 shadow-sm">
      <div className="p-4">
        <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">组件库</h2>
        <div className="space-y-3">
          {componentGroups.map((group) => {
            const colorStyle = colorStyles[group.color];
            return (
              <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection(group.id)}
                  className={`w-full px-3 py-2.5 flex items-center justify-between ${colorStyle.header} transition-all`}
                >
                  <span className="text-sm font-semibold text-white">{group.title}</span>
                  {expandedSections.includes(group.id) ? (
                    <ChevronDown className="w-4 h-4 text-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white" />
                  )}
                </button>
                {expandedSections.includes(group.id) && (
                  <div className="p-2 space-y-1 bg-gradient-to-b from-gray-50 to-white">
                    {group.components.map((component) => {
                      const Icon = component.icon;
                      return (
                        <button
                          key={component.type}
                          onClick={() => handleComponentClick(component.type)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 border border-transparent rounded-lg transition-all ${colorStyle.button}`}
                        >
                          <Icon className={`w-4 h-4 ${colorStyle.icon}`} />
                          <span className="font-medium">{component.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
