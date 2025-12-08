import { useState } from 'react';
import {
  Heading, Type, Columns, List, CheckSquare,
  TextCursorInput, MessageSquare, Gift, Code, ChevronDown, ChevronRight,
  Image, Video, Minus, MessageCircle, Link, Wand2
} from 'lucide-react';
import { LessonComponent } from '../../types';

interface ComponentLibraryProps {
  onAddComponent: (component: LessonComponent) => void;
}

export default function ComponentLibrary({ onAddComponent }: ComponentLibraryProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'media', 'questions', 'advanced', 'ai']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const createDefaultComponent = (type: string): LessonComponent => {
    const id = `${type}-${Date.now()}`;

    switch (type) {
      case 'title':
        return { id, type, config: { text: '', size: 'large', align: 'left' } };
      case 'paragraph':
        return { id, type, config: { text: '', size: 'normal' } };
      case 'two-column':
        return { id, type, config: { leftContent: '', rightContent: '' } };
      case 'three-column':
        return { id, type, config: { content1: '', content2: '', content3: '' } };
      case 'single-choice':
        return { id, type, config: { question: '', options: ['', ''], explanation: '' } };
      case 'multiple-choice':
        return { id, type, config: { question: '', options: ['', ''], correctAnswers: [], explanation: '' } };
      case 'fill-blank':
        return { id, type, config: { text: '', correctAnswers: [] } };
      case 'question-answer':
        return { id, type, config: { question: '', referenceAnswer: '' } };
      case 'lucky-box':
        return { id, type, config: { title: '', options: ['', ''], mode: 'random' } };
      case 'embed-html':
        return { id, type, config: { htmlCode: '' } };
      case 'image':
        return { id, type, config: { url: '', alt: '', align: 'center', width: 100 } };
      case 'video':
        return { id, type, config: { platform: 'bilibili', embedCode: '', height: 400 } };
      case 'page-break':
        return { id, type, config: { label: '' } };
      case 'ai-chatbox':
        return {
          id,
          type,
          config: {
            title: 'AI 对话',
            systemPrompt: '你是一个专门为学生设计的AI助手。你的回答应该：\n1. 使用适合学生理解的简单、清晰的语言\n2. 提供教育性的内容，避免不适当或危险的信息\n3. 鼓励学习和批判性思维，而不是直接给出作业答案\n4. 在回答技术问题时，提供基础性的解释和学习资源\n5. 保持友好、耐心和支持性的态度\n6. 如果问题超出学生学习范围或不适当，礼貌地引导到合适的话题\n\n请始终记住你的受众是学生，调整你的回答方式以最好地支持他们的学习。',
            model: 'kimi-k2-thinking-251104',
            placeholder: '输入消息...'
          }
        };
      case 'hyperlink':
        return { id, type, config: { text: '点击这里', url: '', openInNewTab: true } };
      case 'ai-html-generator':
        return {
          id,
          type,
          config: {
            title: 'AI HTML 游戏生成器',
            description: '填写下面的参数，让 AI 帮你生成自定义的 HTML 游戏',
            promptTemplate: '请创建一个完整的、可交互的 HTML 游戏。要求：\n\n游戏类型：{{gameType}}\n题目来源：{{questionSource}}\n游戏规则：每次随机从题库中抽取一道题目\n\n请生成包含完整 HTML、CSS 和 JavaScript 的代码，确保游戏可以独立运行。代码必须放在 ```html 代码块中。使用现代、美观的设计，包含适当的动画效果。',
            parameters: [
              {
                id: 'param-1',
                label: '游戏类型',
                name: 'gameType',
                type: 'select',
                options: ['选择题', '填空题', '配对游戏', '记忆翻牌'],
                required: true
              },
              {
                id: 'param-2',
                label: '题目来源',
                name: 'questionSource',
                type: 'text',
                placeholder: '例如：语文课本第一单元',
                required: true
              },
              {
                id: 'param-3',
                label: '主题色',
                name: 'themeColor',
                type: 'color',
                required: false
              }
            ],
            model: 'doubao-seed-code-preview-251028',
            buttonText: '生成 HTML 游戏'
          }
        };
      default:
        return { id, type, config: {} };
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
    {
      id: 'ai',
      title: 'AI 组件',
      color: 'cyan',
      components: [
        { type: 'ai-chatbox', icon: MessageCircle, label: 'AI 聊天框' },
        { type: 'ai-html-generator', icon: Wand2, label: 'AI HTML 生成器' },
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
    },
    cyan: {
      header: 'bg-gradient-to-r from-cyan-500 to-teal-500',
      icon: 'text-cyan-500',
      button: 'hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 hover:border-cyan-200'
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
