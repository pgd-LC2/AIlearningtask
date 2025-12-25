import { useState, useEffect, useRef } from 'react';
import { LessonComponent } from '../../types';
import { uploadImage, pasteImageFromClipboard } from '../../utils/imageUpload';
import { Upload, Loader2, Plus, Minus } from 'lucide-react';
import { VideoHelpBanner, VideoHelpIcon, VideoHelpModal } from './VideoHelpTip';
import RichTextEditor from './RichTextEditor';

interface InlineEditorProps {
  component: LessonComponent;
  onSave: (component: LessonComponent) => void;
  onCancel: () => void;
}

export default function InlineEditor({ component, onSave, onCancel }: InlineEditorProps) {
  const [formData, setFormData] = useState(() => {
    const baseConfig = component.config;
    if (component.type === 'image') {
      return {
        url: '',
        alt: '',
        width: undefined,
        align: 'center',
        ...baseConfig
      };
    }
    if (component.type === 'video') {
      return {
        platform: 'bilibili',
        embedCode: '',
        height: 400,
        ...baseConfig
      };
    }
    return baseConfig;
  });
  const [uploading, setUploading] = useState(false);
  const [showVideoHelp, setShowVideoHelp] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.select();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formData]);

  const handleSave = () => {
    onSave({ ...component, config: formData });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    if (component.type !== 'image') return;

    setUploading(true);
    try {
      const url = await pasteImageFromClipboard(e.nativeEvent);
      if (url) {
        setFormData({ ...formData, url });
      }
    } catch (error) {
      console.error('粘贴图片失败:', error);
      alert('粘贴图片失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, url });
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const renderEditor = () => {
    switch (component.type) {
      case 'title':
        return (
          <div className="space-y-3">
            <textarea
              ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
              value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={2}
              className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 font-semibold"
              placeholder="输入标题"
            />
            <div className="flex gap-2">
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="large">大号</option>
                <option value="medium">中号</option>
                <option value="small">小号</option>
              </select>
              <select
                value={formData.align}
                onChange={(e) => setFormData({ ...formData, align: e.target.value })}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
          </div>
        );

      case 'paragraph':
        return (
          <div className="space-y-3">
            <RichTextEditor
              value={formData.text || ''}
              onChange={(value) => setFormData({ ...formData, text: value })}
              placeholder="输入段落内容..."
            />
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="normal">正常</option>
              <option value="large">大号</option>
            </select>
          </div>
        );

      case 'hyperlink':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">链接文本</label>
              <input
                ref={textInputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={formData.text || ''}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full h-9 px-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                placeholder="点击这里"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">链接地址</label>
              <input
                type="text"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
                placeholder="https://example.com"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.openInNewTab ?? true}
                onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">在新标签页打开</span>
            </label>
          </div>
        );

      case 'two-column':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">左侧内容</label>
              <textarea
                value={formData.leftContent || ''}
                onChange={(e) => setFormData({ ...formData, leftContent: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={6}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">右侧内容</label>
              <textarea
                value={formData.rightContent || ''}
                onChange={(e) => setFormData({ ...formData, rightContent: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={6}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
              />
            </div>
          </div>
        );

      case 'three-column':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">第一列</label>
              <textarea
                value={formData.content1 || ''}
                onChange={(e) => setFormData({ ...formData, content1: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={5}
                className="w-full px-2 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">第二列</label>
              <textarea
                value={formData.content2 || ''}
                onChange={(e) => setFormData({ ...formData, content2: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={5}
                className="w-full px-2 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">第三列</label>
              <textarea
                value={formData.content3 || ''}
                onChange={(e) => setFormData({ ...formData, content3: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={5}
                className="w-full px-2 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
              />
            </div>
          </div>
        );

      case 'single-choice':
      case 'multiple-choice':
        const isMultiple = component.type === 'multiple-choice';
        const currentOptions = formData.options || ['', ''];
        const canAddOption = currentOptions.length < 10;
        const canRemoveOption = currentOptions.length > 2;

        const handleAddOption = () => {
          if (canAddOption) {
            setFormData({ ...formData, options: [...currentOptions, ''] });
          }
        };

        const handleRemoveOption = (indexToRemove: number) => {
          if (canRemoveOption) {
            const newOptions = currentOptions.filter((_: string, i: number) => i !== indexToRemove);
            const updatedFormData: any = { ...formData, options: newOptions };

            if (isMultiple) {
              const newCorrectAnswers = (formData.correctAnswers || [])
                .filter((i: number) => i !== indexToRemove)
                .map((i: number) => i > indexToRemove ? i - 1 : i);
              updatedFormData.correctAnswers = newCorrectAnswers;
            } else {
              if (formData.correctAnswer === indexToRemove) {
                updatedFormData.correctAnswer = undefined;
              } else if (formData.correctAnswer > indexToRemove) {
                updatedFormData.correctAnswer = formData.correctAnswer - 1;
              }
            }

            setFormData(updatedFormData);
          }
        };

        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">题目</label>
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={2}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  选项 ({currentOptions.length}/10)
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!canAddOption}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  添加选项
                </button>
              </div>
              <div className="space-y-1.5">
                {currentOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm w-5">{String.fromCharCode(65 + index)}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...currentOptions];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      disabled={!canRemoveOption}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="删除选项"
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                ✓ 正确答案（学生不可见）
              </label>
              {isMultiple ? (
                <div className="space-y-1.5">
                  {currentOptions.map((option: string, index: number) => (
                    option.trim() && (
                      <label key={index} className="flex items-center gap-2 cursor-pointer hover:bg-green-100 p-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={(formData.correctAnswers || []).includes(index)}
                          onChange={(e) => {
                            const current = formData.correctAnswers || [];
                            const newAnswers = e.target.checked
                              ? [...current, index]
                              : current.filter((i: number) => i !== index);
                            setFormData({ ...formData, correctAnswers: newAnswers });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-900">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </label>
                    )
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentOptions.map((option: string, index: number) => (
                    option.trim() && (
                      <label key={index} className="flex items-center gap-2 cursor-pointer hover:bg-green-100 p-1.5 rounded transition-colors">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswer === index}
                          onChange={() => setFormData({ ...formData, correctAnswer: index })}
                          className="w-4 h-4 border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-900">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </label>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'fill-blank':
        const blankCount = ((formData.text || '').match(/__/g) || []).length;
        const blankAnswers = formData.correctAnswers || [];
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                填空文本 <span className="text-gray-500">（使用 __ 表示填空）</span>
              </label>
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={formData.text || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  const newBlankCount = (text.match(/__/g) || []).length;
                  const currentAnswers = formData.correctAnswers || [];
                  const newAnswers = currentAnswers.slice(0, newBlankCount);
                  while (newAnswers.length < newBlankCount) {
                    newAnswers.push('');
                  }
                  setFormData({ ...formData, text, correctAnswers: newAnswers });
                }}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={3}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900"
                placeholder="例如：水的化学式是__，冰点是__度"
              />
            </div>
            {blankCount > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  ✓ 正确答案（学生不可见）
                </label>
                <div className="space-y-1.5">
                  {Array.from({ length: blankCount }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 whitespace-nowrap">空 {index + 1}:</span>
                      <input
                        type="text"
                        value={blankAnswers[index] || ''}
                        onChange={(e) => {
                          const newAnswers = [...blankAnswers];
                          newAnswers[index] = e.target.value;
                          setFormData({ ...formData, correctAnswers: newAnswers });
                        }}
                        className="flex-1 h-8 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        placeholder={`第 ${index + 1} 空答案`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'question-answer':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">题目</label>
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={2}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900"
              />
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                📝 参考答案（选填，学生不可见）
              </label>
              <textarea
                value={formData.referenceAnswer || ''}
                onChange={(e) => setFormData({ ...formData, referenceAnswer: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                placeholder="输入参考答案，方便批改时对比"
              />
            </div>
          </div>
        );

      case 'lucky-box':
        const luckyBoxOptions = formData.options || ['', ''];
        const canAddLuckyOption = luckyBoxOptions.length < 10;
        const canRemoveLuckyOption = luckyBoxOptions.length > 2;

        const handleAddLuckyOption = () => {
          if (canAddLuckyOption) {
            setFormData({ ...formData, options: [...luckyBoxOptions, ''] });
          }
        };

        const handleRemoveLuckyOption = (indexToRemove: number) => {
          if (canRemoveLuckyOption) {
            const newOptions = luckyBoxOptions.filter((_: string, i: number) => i !== indexToRemove);
            setFormData({ ...formData, options: newOptions });
          }
        };

        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">标题</label>
              <input
                ref={textInputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
                className="w-full h-9 px-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  选项 ({luckyBoxOptions.length}/10)
                </label>
                <button
                  type="button"
                  onClick={handleAddLuckyOption}
                  disabled={!canAddLuckyOption}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  添加选项
                </button>
              </div>
              <div className="space-y-1.5">
                {luckyBoxOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...luckyBoxOptions];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder={`选项 ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLuckyOption(index)}
                      disabled={!canRemoveLuckyOption}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="删除选项"
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">模式</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="random">随机</option>
                <option value="sequential">顺序</option>
              </select>
            </div>
          </div>
        );

      case 'embed-html':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">HTML代码</label>
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={formData.htmlCode || ''}
                onChange={(e) => setFormData({ ...formData, htmlCode: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={8}
                placeholder="输入HTML代码，例如：<div>内容</div>"
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-xs text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">宽度 (px)</label>
                <input
                  type="number"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="默认100%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">高度 (px)</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="默认800"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      case 'page-break':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">分页标题（可选）</label>
            <input
              ref={textInputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="如：第二页、下半部分"
              className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="url"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                onPaste={handleImagePaste}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={uploading}
                className="w-full h-10 px-3 pr-24 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-50"
                placeholder="粘贴图片或输入URL"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute right-1 top-1 px-3 h-8 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    上传
                  </>
                )}
              </button>
            </div>
            {formData.url && (
              <div className="border border-gray-300 rounded-lg p-2">
                <img
                  src={formData.url}
                  alt="预览"
                  className="max-h-32 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.alt || ''}
                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="图片描述（选填）"
              />
              <select
                value={formData.align || 'center'}
                onChange={(e) => setFormData({ ...formData, align: e.target.value })}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                图片宽度: {formData.width || 100}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={formData.width || 100}
                onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <select
              value={formData.platform || 'bilibili'}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="bilibili">哔哩哔哩</option>
              <option value="youtube">YouTube</option>
              <option value="custom">自定义iframe</option>
            </select>
            {formData.platform === 'youtube' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <p className="text-xs text-amber-800">
                  ⚠️ YouTube视频在中国大陆需要VPN才能播放
                </p>
              </div>
            )}
            {formData.platform === 'bilibili' && showVideoHelp && (
              <VideoHelpBanner onClose={() => setShowVideoHelp(false)} />
            )}
            <div className="relative">
              {formData.platform === 'bilibili' && !showVideoHelp && (
                <VideoHelpIcon onClick={() => setShowVideoModal(true)} />
              )}
              <textarea
                value={formData.embedCode || ''}
                onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={6}
                className="w-full px-3 py-2 pr-10 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-xs text-gray-900"
                placeholder={
                  formData.platform === 'bilibili'
                    ? '<iframe src="//player.bilibili.com/player.html?..." ...></iframe>'
                    : formData.platform === 'youtube'
                    ? '<iframe src="https://www.youtube.com/embed/..." ...></iframe>'
                    : '粘贴完整的iframe代码'
                }
              />
            </div>
            {formData.platform === 'bilibili' && (
              <VideoHelpModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
            )}
          </div>
        );

      case 'ai-chatbox':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-3 h-9 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 text-sm"
                placeholder="AI 对话"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">AI 模型</label>
              <select
                value={formData.model || 'kimi-k2-thinking-251104'}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
              >
                <option value="kimi-k2-thinking-251104">Kimi K2 深度思考</option>
                <option value="deepseek-v3-1-250821">DeepSeek V3.1</option>
                <option value="doubao-seed-code-preview-251028">豆包代码预览</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">系统提示词（可选）</label>
              <textarea
                value={formData.systemPrompt || ''}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={4}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm"
                placeholder="为AI设置角色和行为规则..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">输入框占位符</label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                placeholder="输入消息..."
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.enableThinking || false}
                  onChange={(e) => setFormData({ ...formData, enableThinking: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
                />
                启用深度思考
              </label>
            </div>
            {formData.enableThinking && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">思考模式</label>
                <select
                  value={formData.thinkingType || 'auto'}
                  onChange={(e) => setFormData({ ...formData, thinkingType: e.target.value as 'disabled' | 'auto' | 'enabled' })}
                  className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                >
                  <option value="disabled">关闭</option>
                  <option value="auto">自动</option>
                  <option value="enabled">强制开启</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">深度思考模式会显示AI的思考过程</p>
              </div>
            )}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2.5">
              <p className="text-xs text-cyan-800">
                💡 使用火山引擎 AI 模型 + 流式输出
              </p>
            </div>
          </div>
        );

      case 'code-editor': {
        const sections = formData.sections || [{ id: 'section-1', title: '', color: '#3b82f6' }];

        const handleAddSection = () => {
          setFormData({
            ...formData,
            sections: [...sections, { id: `section-${Date.now()}`, title: '', color: '#10b981' }]
          });
        };

        const handleRemoveSection = (id: string) => {
          if (sections.length > 1) {
            setFormData({
              ...formData,
              sections: sections.filter(s => s.id !== id)
            });
          }
        };

        const handleSectionChange = (id: string, field: string, value: string) => {
          setFormData({
            ...formData,
            sections: sections.map(s => s.id === id ? { ...s, [field]: value } : s)
          });
        };

        return (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">便利贴部分</label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加部分
                </button>
              </div>
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div key={section.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={section.color}
                        onChange={(e) => handleSectionChange(section.id, 'color', e.target.value)}
                        className="w-10 h-9 rounded cursor-pointer"
                        title="选择颜色"
                      />
                      <span className="text-xs font-medium text-gray-600 flex-1">便利贴 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section.id)}
                        disabled={sections.length <= 1}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="删除部分"
                      >
                        <Minus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    <RichTextEditor
                      value={section.title || ''}
                      onChange={(value) => handleSectionChange(section.id, 'title', value)}
                      placeholder={`输入便利贴 ${index + 1} 内容...`}
                      minHeight="80px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">编程语言</label>
              <select
                value={formData.language || 'python'}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="python">Python</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">初始代码（可选）</label>
              <textarea
                value={formData.initialCode || ''}
                onChange={(e) => setFormData({ ...formData, initialCode: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                placeholder="# 在这里编写你的代码"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">输入框占位符</label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="请在此输入 Python 代码..."
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
              <p className="text-xs text-green-800">
                💡 学生提交的代码会自动保存，老师可以在提交页面查看
              </p>
            </div>
          </div>
        );
      }

      case 'ai-html-generator': {
        const handleAddParameter = () => {
          const newParam = {
            id: `param-${Date.now()}`,
            label: '',
            name: '',
            type: 'text' as const,
            required: false
          };
          setFormData({
            ...formData,
            parameters: [...(formData.parameters || []), newParam]
          });
        };

        const handleRemoveParameter = (id: string) => {
          setFormData({
            ...formData,
            parameters: (formData.parameters || []).filter(p => p.id !== id)
          });
        };

        const handleParameterChange = (id: string, field: string, value: any) => {
          setFormData({
            ...formData,
            parameters: (formData.parameters || []).map(p =>
              p.id === id ? { ...p, [field]: value } : p
            )
          });
        };

        const handleAddOption = (paramId: string) => {
          setFormData({
            ...formData,
            parameters: (formData.parameters || []).map(p =>
              p.id === paramId ? { ...p, options: [...(p.options || []), ''] } : p
            )
          });
        };

        const handleRemoveOption = (paramId: string, optionIndex: number) => {
          setFormData({
            ...formData,
            parameters: (formData.parameters || []).map(p =>
              p.id === paramId ? { ...p, options: (p.options || []).filter((_, i) => i !== optionIndex) } : p
            )
          });
        };

        const handleOptionChange = (paramId: string, optionIndex: number, value: string) => {
          setFormData({
            ...formData,
            parameters: (formData.parameters || []).map(p =>
              p.id === paramId ? {
                ...p,
                options: (p.options || []).map((opt, i) => i === optionIndex ? value : opt)
              } : p
            )
          });
        };

        return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 h-9 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 text-sm"
                placeholder="AI HTML 游戏生成器"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">描述</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                placeholder="填写参数后生成 HTML"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">提示词模板</label>
              <textarea
                value={formData.promptTemplate || ''}
                onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-900 text-sm font-mono"
                placeholder="使用 {{参数名}} 作为占位符，例如：游戏类型：{{gameType}}"
              />
              <p className="mt-1 text-xs text-gray-500">提示：使用双花括号包裹参数名，如 {`{{gameType}}`}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">参数字段</label>
                <button
                  type="button"
                  onClick={handleAddParameter}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加参数
                </button>
              </div>

              <div className="space-y-3">
                {(formData.parameters || []).map((param, index) => (
                  <div key={param.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">参数 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(param.id)}
                        disabled={(formData.parameters || []).length <= 1}
                        className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="删除参数"
                      >
                        <Minus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">标签</label>
                        <input
                          type="text"
                          value={param.label}
                          onChange={(e) => handleParameterChange(param.id, 'label', e.target.value)}
                          className="w-full px-2 h-8 border border-gray-300 rounded text-xs"
                          placeholder="游戏类型"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">参数名</label>
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleParameterChange(param.id, 'name', e.target.value)}
                          className="w-full px-2 h-8 border border-gray-300 rounded text-xs font-mono"
                          placeholder="gameType"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">类型</label>
                        <select
                          value={param.type}
                          onChange={(e) => handleParameterChange(param.id, 'type', e.target.value)}
                          className="w-full px-2 h-8 border border-gray-300 rounded text-xs"
                        >
                          <option value="text">文本</option>
                          <option value="select">选择</option>
                          <option value="color">颜色</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 h-full pt-5">
                          <input
                            type="checkbox"
                            checked={param.required || false}
                            onChange={(e) => handleParameterChange(param.id, 'required', e.target.checked)}
                            className="w-3 h-3"
                          />
                          <span className="text-xs text-gray-600">必填</span>
                        </label>
                      </div>
                    </div>

                    {param.type === 'text' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">占位符</label>
                        <input
                          type="text"
                          value={param.placeholder || ''}
                          onChange={(e) => handleParameterChange(param.id, 'placeholder', e.target.value)}
                          className="w-full px-2 h-8 border border-gray-300 rounded text-xs"
                          placeholder="请输入..."
                        />
                      </div>
                    )}

                    {param.type === 'select' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-600">选项</label>
                          <button
                            type="button"
                            onClick={() => handleAddOption(param.id)}
                            className="text-xs text-cyan-600 hover:text-cyan-700"
                          >
                            + 添加选项
                          </button>
                        </div>
                        <div className="space-y-1">
                          {(param.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-1">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(param.id, optIndex, e.target.value)}
                                className="flex-1 px-2 h-7 border border-gray-300 rounded text-xs"
                                placeholder={`选项 ${optIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(param.id, optIndex)}
                                disabled={(param.options || []).length <= 1}
                                className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                              >
                                <Minus className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">AI 模型</label>
              <select
                value={formData.model || 'doubao-seed-code-preview-251028'}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
              >
                <option value="doubao-seed-code-preview-251028">豆包代码预览</option>
                <option value="deepseek-v3-1-250821">DeepSeek V3.1</option>
                <option value="kimi-k2-thinking-251104">Kimi K2 深度思考</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">按钮文本</label>
              <input
                type="text"
                value={formData.buttonText || ''}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-3 h-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                placeholder="生成 HTML 游戏"
              />
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2.5">
              <p className="text-xs text-cyan-800">
                💡 学生填写参数后，AI 将根据提示词模板生成完整的 HTML 代码并自动渲染
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-xl p-4 border-2 border-primary shadow-lg"
    >
      {renderEditor()}
      <div className="mt-3 text-xs text-gray-600 text-center">
        点击空白处保存 · 按 ESC 取消
      </div>
    </div>
  );
}
