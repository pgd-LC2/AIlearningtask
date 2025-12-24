import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Minus, Send, Loader2, Brain, RefreshCw, Play, Pause, Maximize2, X, ExternalLink, Plus, Image as ImageIcon, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { LessonComponent } from '../../types';
import { callVolcengineStream } from '../../lib/volcengine';

interface ComponentRendererProps {
  component: LessonComponent;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'reasoning';
  content: string;
}

export default function ComponentRenderer({ component }: ComponentRendererProps) {
  const [luckyResult, setLuckyResult] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ type: string; content: string; name?: string }>>([]);
  const [collapsedReasoning, setCollapsedReasoning] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingIndicesRef = useRef<{ reasoning: number; assistant: number }>({ reasoning: -1, assistant: -1 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  switch (component.type) {
    case 'title':
      const titleSizes = { large: 'text-3xl', medium: 'text-2xl', small: 'text-xl' };
      const titleAligns = { left: 'text-left', center: 'text-center', right: 'text-right' };
      return (
        <h1 className={`font-bold ${titleSizes[component.config.size]} ${titleAligns[component.config.align]} ${component.config.text ? 'text-gray-900' : 'text-gray-400'}`}>
          {component.config.text || '标题文本'}
        </h1>
      );

    case 'paragraph':
      return (
        <p className={`whitespace-pre-wrap ${component.config.size === 'large' ? 'text-lg' : 'text-base'} ${component.config.text ? 'text-gray-900' : 'text-gray-400'}`}>
          {component.config.text || '段落文本'}
        </p>
      );

    case 'hyperlink':
      return (
        <div>
          {component.config.url ? (
            <a
              href={component.config.url}
              target={component.config.openInNewTab ? '_blank' : '_self'}
              rel={component.config.openInNewTab ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
            >
              {component.config.text || '链接文本'}
              {component.config.openInNewTab && <ExternalLink className="w-4 h-4" />}
            </a>
          ) : (
            <span className="text-gray-400">设置链接地址</span>
          )}
        </div>
      );

    case 'two-column':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className={`whitespace-pre-wrap ${component.config.leftContent ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.leftContent || '左侧内容'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className={`whitespace-pre-wrap ${component.config.rightContent ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.rightContent || '右侧内容'}</p>
          </div>
        </div>
      );

    case 'three-column':
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className={`whitespace-pre-wrap ${component.config.content1 ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.content1 || '第一列'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className={`whitespace-pre-wrap ${component.config.content2 ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.content2 || '第二列'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className={`whitespace-pre-wrap ${component.config.content3 ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.content3 || '第三列'}</p>
          </div>
        </div>
      );

    case 'single-choice':
      return (
        <div>
          <p className={`font-medium mb-3 ${component.config.question ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.question || '题目'}</p>
          <div className="space-y-2">
            {component.config.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-300"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                <span className={option ? 'text-gray-900' : 'text-gray-400'}>{String.fromCharCode(65 + index)}. {option || `选项${String.fromCharCode(65 + index)}`}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'multiple-choice':
      return (
        <div>
          <p className={`font-medium mb-3 ${component.config.question ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.question || '题目（多选）'}</p>
          <div className="space-y-2">
            {component.config.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-300"
              >
                <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                <span className={option ? 'text-gray-900' : 'text-gray-400'}>{String.fromCharCode(65 + index)}. {option || `选项${String.fromCharCode(65 + index)}`}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'fill-blank':
      const parts = (component.config.text || '填空题示例：__表示空格').split('__');
      return (
        <div>
          <p className={`font-medium mb-3 ${component.config.text ? 'text-gray-900' : 'text-gray-400'}`}>
            {parts.map((part, index) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <span className="inline-block mx-1 px-3 py-0.5 border-b-2 border-primary bg-primary-light/30 rounded text-sm">
                    [{index + 1}]
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
      );

    case 'question-answer':
      return (
        <div>
          <p className={`font-medium mb-3 ${component.config.question ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.question || '题目'}</p>
        </div>
      );

    case 'lucky-box':
      const drawLuckyBox = () => {
        const options = component.config.options;
        if (component.config.mode === 'random') {
          const randomIndex = Math.floor(Math.random() * options.length);
          setLuckyResult(options[randomIndex]);
        } else {
          const currentIndex = options.indexOf(luckyResult);
          const nextIndex = (currentIndex + 1) % options.length;
          setLuckyResult(options[nextIndex]);
        }
      };

      return (
        <div className="text-center p-6 bg-gradient-to-br from-primary-light to-primary/20 rounded-xl">
          <p className={`font-semibold mb-4 ${component.config.title ? 'text-gray-900' : 'text-gray-400'}`}>{component.config.title || '盲盒标题'}</p>
          <button
            onClick={drawLuckyBox}
            className="px-6 h-10 bg-primary hover:bg-primary-hover text-white font-medium rounded-capsule transition-colors"
          >
            点击抽取
          </button>
          {luckyResult && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm animate-in fade-in zoom-in duration-300">
              <p className="text-lg font-semibold text-gray-900">{luckyResult}</p>
            </div>
          )}
        </div>
      );

    case 'embed-html':
      const iframeRef = useRef<HTMLIFrameElement>(null);
      const [isPaused, setIsPaused] = useState(false);
      const [isFullscreen, setIsFullscreen] = useState(false);
      const customWidth = component.config.width ? `${component.config.width}px` : '100%';
      const customHeight = component.config.height ? parseInt(component.config.height) : 800;

      const loadIframeContent = () => {
        if (iframeRef.current && component.config.htmlCode) {
          const iframe = iframeRef.current;
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            const isFullDoc = /<!DOCTYPE|<html/i.test(component.config.htmlCode);
            if (isFullDoc) {
              doc.write(component.config.htmlCode);
            } else {
              doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; overflow: auto; }
                  </style>
                </head>
                <body>
                  ${component.config.htmlCode}
                </body>
                </html>
              `);
            }
            doc.close();
          }
        }
      };

      useEffect(() => {
        loadIframeContent();
      }, [component.config.htmlCode]);

      const handleRefresh = () => {
        loadIframeContent();
        setIsPaused(false);
      };

      const handlePausePlay = () => {
        if (iframeRef.current) {
          const iframe = iframeRef.current;
          const win = iframe.contentWindow;
          if (win) {
            if (isPaused) {
              win.location.reload();
            } else {
              const doc = iframe.contentDocument;
              if (doc) {
                const scripts = doc.querySelectorAll('script');
                scripts.forEach(script => {
                  script.remove();
                });
              }
            }
            setIsPaused(!isPaused);
          }
        }
      };

      return (
        <div>
          {component.config.htmlCode ? (
            <>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    title="刷新"
                  >
                    <RefreshCw className="w-4 h-4" />
                    刷新
                  </button>
                  <button
                    onClick={handlePausePlay}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                    title={isPaused ? '继续' : '暂停'}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? '继续' : '暂停'}
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                    title="全屏"
                  >
                    <Maximize2 className="w-4 h-4" />
                    全屏
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg bg-white overflow-auto" style={{ maxHeight: `${customHeight}px`, width: customWidth }}>
                  <iframe
                    ref={iframeRef}
                    className="w-full"
                    style={{ minHeight: '200px', border: 'none' }}
                    sandbox="allow-scripts allow-same-origin"
                    title="嵌入内容"
                  />
                </div>
              </div>
              {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                  <div className="flex items-center justify-between p-4 bg-gray-900">
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        刷新
                      </button>
                      <button
                        onClick={handlePausePlay}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {isPaused ? '继续' : '暂停'}
                      </button>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      关闭
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <iframe
                      ref={iframeRef}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                      sandbox="allow-scripts allow-same-origin"
                      title="嵌入内容"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-gray-400 text-sm">嵌入HTML代码</p>
            </div>
          )}
        </div>
      );

    case 'image':
      const imageAligns = { left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' };
      const textAligns = { left: 'text-left', center: 'text-center', right: 'text-right' };
      return (
        <div className={`${imageAligns[component.config.align || 'center']}`} style={{ width: component.config.width ? `${component.config.width}%` : '100%' }}>
          {component.config.url ? (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <img
                src={component.config.url}
                alt={component.config.alt || '图片'}
                className="w-full h-auto rounded"
              />
              {component.config.alt && (
                <p className={`mt-2 text-sm text-gray-600 ${textAligns[component.config.align || 'center']}`}>
                  {component.config.alt}
                </p>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-gray-500 text-sm">请设置图片URL</p>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="w-full">
          {component.config.embedCode ? (
            <div
              className="w-full relative overflow-hidden rounded-lg bg-gray-900"
              style={{ height: component.config.height || 400 }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: component.config.embedCode }}
                className="absolute inset-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
              />
            </div>
          ) : (
            <div className="w-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center" style={{ height: component.config.height || 400 }}>
              <p className="text-gray-500 text-sm">请粘贴视频嵌入代码</p>
            </div>
          )}
        </div>
      );

    case 'page-break':
      return (
        <div className="w-full py-4 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <Minus className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              {component.config.label || '分页符'}
            </span>
            <Minus className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      );

    case 'ai-chatbox':
      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (file.type.startsWith('image/')) {
            setAttachments(prev => [...prev, { type: 'image', content, name: file.name }]);
          }
        };

        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        }

        setShowAttachmentMenu(false);
      };

      const handleAddLink = () => {
        const url = prompt('请输入链接地址:');
        if (url) {
          setAttachments(prev => [...prev, { type: 'link', content: url, name: url }]);
        }
        setShowAttachmentMenu(false);
      };

      const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
      };

      const handleSendMessage = async () => {
        if ((!chatInput.trim() && attachments.length === 0) || isLoading) return;

        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

        if (chatInput.trim()) {
          contentParts.push({ type: 'text', text: chatInput });
        }

        let displayContent = chatInput;

        if (attachments.length > 0) {
          displayContent += '\n\n附件:\n';
          attachments.forEach(att => {
            if (att.type === 'image') {
              contentParts.push({
                type: 'image_url',
                image_url: { url: att.content }
              });
              displayContent += `[图片: ${att.name}]\n`;
            } else if (att.type === 'link') {
              contentParts.push({ type: 'text', text: `[链接: ${att.content}]` });
              displayContent += `[链接: ${att.content}]\n`;
            }
          });
        }

        const userMessage: ChatMessage = { role: 'user', content: displayContent };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setAttachments([]);
        setIsLoading(true);

        streamingIndicesRef.current = { reasoning: -1, assistant: -1 };

        try {
          const messages = [
            ...(component.config.systemPrompt ? [{ role: 'system' as const, content: component.config.systemPrompt }] : []),
            ...chatMessages
              .filter(msg => msg.role !== 'reasoning')
              .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
            { role: 'user' as const, content: contentParts.length > 1 ? contentParts : (contentParts[0]?.text || displayContent) }
          ];

          await callVolcengineStream(
            {
              model: component.config.model || 'kimi-k2-thinking-251104',
              messages,
              temperature: 0.7,
              max_tokens: 4000,
              thinking: component.config.enableThinking ? { type: component.config.thinkingType || 'auto' } : undefined,
            },
            (text: string, isThinking?: boolean) => {
              console.log('[AI聊天] 收到内容:', { isThinking, textLength: text.length, text: text.substring(0, 50) });
              setChatMessages(prev => {
                const newMessages = [...prev];

                if (isThinking) {
                  if (streamingIndicesRef.current.reasoning === -1) {
                    streamingIndicesRef.current.reasoning = newMessages.length;
                    console.log('[AI聊天] 创建思维链消息，索引:', streamingIndicesRef.current.reasoning);
                    newMessages.push({ role: 'reasoning', content: text });
                  } else {
                    const index = streamingIndicesRef.current.reasoning;
                    if (newMessages[index] && newMessages[index].role === 'reasoning') {
                      newMessages[index] = { ...newMessages[index], content: newMessages[index].content + text };
                    } else {
                      console.error('[AI聊天] 思维链索引错误，重新创建', { index, existingRole: newMessages[index]?.role });
                      streamingIndicesRef.current.reasoning = newMessages.length;
                      newMessages.push({ role: 'reasoning', content: text });
                    }
                  }
                } else {
                  if (streamingIndicesRef.current.assistant === -1) {
                    streamingIndicesRef.current.assistant = newMessages.length;
                    console.log('[AI聊天] 创建助手回复消息，索引:', streamingIndicesRef.current.assistant);
                    newMessages.push({ role: 'assistant', content: text });
                  } else {
                    const index = streamingIndicesRef.current.assistant;
                    if (newMessages[index] && newMessages[index].role === 'assistant') {
                      newMessages[index] = { ...newMessages[index], content: newMessages[index].content + text };
                    } else {
                      console.error('[AI聊天] 助手回复索引错误，重新创建', { index, existingRole: newMessages[index]?.role });
                      streamingIndicesRef.current.assistant = newMessages.length;
                      newMessages.push({ role: 'assistant', content: text });
                    }
                  }
                }

                console.log('[AI聊天] 当前消息数组:', newMessages.map(m => ({ role: m.role, contentLength: m.content.length })));
                return newMessages;
              });
            },
            () => {
              setIsLoading(false);
              streamingIndicesRef.current = { reasoning: -1, assistant: -1 };
            },
            (error: Error) => {
              console.error('AI 对话错误:', error);
              setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '抱歉，发生了错误。请稍后再试。'
              }]);
              setIsLoading(false);
              streamingIndicesRef.current = { reasoning: -1, assistant: -1 };
            }
          );
        } catch (error) {
          console.error('AI 对话错误:', error);
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: '抱歉，发生了错误。请稍后再试。'
          }]);
          setIsLoading(false);
          streamingIndicesRef.current = { reasoning: -1, assistant: -1 };
        }
      };

      const [isChatFullscreen, setIsChatFullscreen] = useState(false);

      const toggleReasoningCollapse = (index: number) => {
        setCollapsedReasoning(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) {
            newSet.delete(index);
          } else {
            newSet.add(index);
          }
          return newSet;
        });
      };

      const chatContent = (fullscreen = false) => (
        <>
          <div className={`${fullscreen ? 'flex-1' : 'h-96'} overflow-y-auto p-4 space-y-3 bg-gray-50`}>
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                开始与 AI 对话...
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'reasoning' ? (
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <button
                        onClick={() => toggleReasoningCollapse(index)}
                        className="w-full flex items-center justify-between gap-2 mb-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">思维链</span>
                        </div>
                        {collapsedReasoning.has(index) ? (
                          <ChevronDown className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                      {!collapsedReasoning.has(index) && (
                        <div className="text-sm text-amber-900 leading-relaxed prose prose-sm prose-amber max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                    {att.type === 'image' && <ImageIcon className="w-3 h-3" />}
                    {att.type === 'link' && <LinkIcon className="w-3 h-3" />}
                    <span className="max-w-[100px] truncate">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  disabled={isLoading}
                  className="w-10 h-10 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {showAttachmentMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <ImageIcon className="w-4 h-4" />
                      上传图片
                    </button>
                    <button
                      onClick={handleAddLink}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <LinkIcon className="w-4 h-4" />
                      添加链接
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={component.config.placeholder || '输入消息...'}
                disabled={isLoading}
                className="flex-1 px-4 h-10 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!chatInput.trim() && attachments.length === 0)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      );

      if (isChatFullscreen) {
        return (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-teal-500">
              <h3 className="text-white font-semibold text-lg">{component.config.title || 'AI 对话'}</h3>
              <button
                onClick={() => setIsChatFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                退出全屏
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              {chatContent(true)}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold">{component.config.title || 'AI 对话'}</h3>
            <button
              onClick={() => setIsChatFullscreen(true)}
              className="flex items-center gap-1.5 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors"
              title="全屏"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              全屏
            </button>
          </div>
          {chatContent(false)}
        </div>
      );

    case 'code-editor':
      return (
        <div className="space-y-4">
          {component.config.sections && component.config.sections.length > 0 && (
            <div className="space-y-2">
              {component.config.sections.map((section: any, index: number) => (
                <div key={section.id} className="flex items-start gap-3">
                  <div
                    className="w-1 h-full min-h-[2rem] rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-mono">{component.config.language || 'python'}</span>
            </div>
            <textarea
              className="w-full p-4 bg-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={10}
              placeholder={component.config.placeholder || '请在此输入代码...'}
              defaultValue={component.config.initialCode || ''}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const value = target.value;
                  target.value = value.substring(0, start) + '    ' + value.substring(end);
                  target.selectionStart = target.selectionEnd = start + 4;
                }
              }}
            />
          </div>
        </div>
      );

    case 'ai-html-generator':
      const [paramValues, setParamValues] = useState<Record<string, string>>({});
      const [isGenerating, setIsGenerating] = useState(false);
      const [aiOutput, setAiOutput] = useState('');
      const [generatedHtml, setGeneratedHtml] = useState('');
      const [showThinking, setShowThinking] = useState(true);
      const htmlIframeRef = useRef<HTMLIFrameElement>(null);

      const renderHtmlInIframe = (html: string) => {
        if (htmlIframeRef.current && html) {
          const iframe = htmlIframeRef.current;
          const isFullDoc = /<!DOCTYPE|<html/i.test(html);
          let finalHtml = html;

          if (!isFullDoc) {
            finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; overflow: auto; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
          }

          iframe.srcdoc = finalHtml;
        }
      };

      useEffect(() => {
        if (generatedHtml) {
          renderHtmlInIframe(generatedHtml);
        }
      }, [generatedHtml]);

      const extractHtmlFromOutput = (text: string): string => {
        const htmlBlockMatch = text.match(/```html\n([\s\S]*?)\n```/);
        if (htmlBlockMatch) {
          return htmlBlockMatch[1];
        }
        const htmlMatch = text.match(/<html[\s\S]*<\/html>/i);
        if (htmlMatch) {
          return htmlMatch[0];
        }
        return '';
      };

      const handleGenerate = async () => {
        const missingRequired = (component.config.parameters || []).filter(
          p => p.required && !paramValues[p.name]?.trim()
        );

        if (missingRequired.length > 0) {
          alert(`请填写必填项：${missingRequired.map(p => p.label).join('、')}`);
          return;
        }

        setIsGenerating(true);
        setAiOutput('');
        setGeneratedHtml('');

        let promptText = component.config.promptTemplate || '';
        Object.entries(paramValues).forEach(([key, value]) => {
          promptText = promptText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });

        try {
          await callVolcengineStream(
            {
              model: component.config.model || 'doubao-seed-code-preview-251028',
              messages: [
                { role: 'user', content: promptText }
              ],
              stream: true
            },
            (text, isThinking) => {
              if (!isThinking) {
                setAiOutput(prev => {
                  const newOutput = prev + text;
                  const extractedHtml = extractHtmlFromOutput(newOutput);
                  if (extractedHtml && extractedHtml !== generatedHtml) {
                    setGeneratedHtml(extractedHtml);
                  }
                  return newOutput;
                });
              }
            },
            () => {
              setIsGenerating(false);
            },
            (error: Error) => {
              console.error('AI 生成错误:', error);
              alert('生成失败，请重试');
              setIsGenerating(false);
            }
          );
        } catch (error) {
          console.error('AI 生成错误:', error);
          alert('生成失败，请重试');
          setIsGenerating(false);
        }
      };

      const canGenerate = !isGenerating && (component.config.parameters || []).every(
        p => !p.required || paramValues[p.name]?.trim()
      );

      return (
        <div className="space-y-4">
          {component.config.title && (
            <h3 className="text-lg font-semibold text-gray-900">{component.config.title}</h3>
          )}
          {component.config.description && (
            <p className="text-sm text-gray-600">{component.config.description}</p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            {(component.config.parameters || []).map((param) => (
              <div key={param.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {param.label}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {param.type === 'text' && (
                  <input
                    type="text"
                    value={paramValues[param.name] || ''}
                    onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                    placeholder={param.placeholder}
                    className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                )}
                {param.type === 'select' && (
                  <select
                    value={paramValues[param.name] || ''}
                    onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                    className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  >
                    <option value="">请选择...</option>
                    {(param.options || []).map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                {param.type === 'color' && (
                  <input
                    type="color"
                    value={paramValues[param.name] || '#3b82f6'}
                    onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-full hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成...
                </>
              ) : (
                <>{component.config.buttonText || '生成 HTML 游戏'}</>
              )}
            </button>
          </div>

          {aiOutput && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">AI 输出</h4>
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showThinking ? '隐藏' : '显示'}
                </button>
              </div>
              {showThinking && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{aiOutput}</pre>
                </div>
              )}
            </div>
          )}

          {generatedHtml && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 flex items-center justify-between">
                <h4 className="font-medium text-white">渲染结果</h4>
                <button
                  onClick={() => setGeneratedHtml('')}
                  className="text-xs text-white/90 hover:text-white px-2 py-1 bg-white/20 rounded"
                >
                  清除
                </button>
              </div>
              <div className="border-t border-gray-200">
                <iframe
                  ref={htmlIframeRef}
                  className="w-full border-0"
                  style={{ minHeight: '400px', height: '600px' }}
                  sandbox="allow-scripts"
                  title="Generated HTML"
                />
              </div>
            </div>
          )}
        </div>
      );

    default:
      return <div>未知组件类型</div>;
  }
}
