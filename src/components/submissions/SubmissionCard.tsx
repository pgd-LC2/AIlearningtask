import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Users, CheckCircle2, XCircle, AlertCircle, MessageSquare, Download, Trash2, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { LessonComponent } from '../../types';
import { formatDate } from '../../utils/format';
import { formatAnswer, getQuestionText, QUESTION_TYPE_LABELS } from '../../utils/answer';
import { compareAnswers, formatCorrectAnswer } from '../../utils/grading';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

interface SubmissionCardProps {
  submission: {
    id: string;
    student_name: string;
    student_class: string;
    answers: Record<string, number | number[] | string | string[]>;
    chat_history?: Record<string, Array<{ role: string; content: string }>> | null;
    created_at: string;
    review_status: 'pending' | 'approved' | 'rejected';
  };
  components: LessonComponent[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReview?: (id: string, status: 'approved' | 'rejected') => void;
}

export default function SubmissionCard({
  submission,
  components,
  isSelected = false,
  onSelect,
  onDelete,
  onReview
}: SubmissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasChatHistory = submission.chat_history && Object.keys(submission.chat_history).length > 0;
  const totalChatMessages = hasChatHistory
    ? Object.values(submission.chat_history!).reduce((sum, messages) => sum + messages.length, 0)
    : 0;

  const downloadChatHistory = () => {
    if (!submission.chat_history) return;

    let content = `学生：${submission.student_name}（${submission.student_class}班）\n`;
    content += `提交时间：${formatDate(submission.created_at)}\n`;
    content += `${'='.repeat(60)}\n\n`;

    Object.entries(submission.chat_history).forEach(([chatboxId, messages]) => {
      const chatboxComponent = components.find(c => c.id === chatboxId);
      const chatboxTitle = chatboxComponent?.type === 'ai-chatbox'
        ? (chatboxComponent.config as { title?: string }).title || 'AI 对话'
        : 'AI 对话';

      content += `【${chatboxTitle}】\n`;
      content += `${'-'.repeat(60)}\n`;

      messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? '学生' : 'AI';
        const msgContent = typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
        content += `${index + 1}. ${role}：\n${msgContent}\n\n`;
      });

      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI对话记录_${submission.student_name}_${submission.student_class}班.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除 ${submission.student_name}（${submission.student_class}班）的提交记录吗？`)) {
      onDelete?.(submission.id);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(submission.id);
  };

  const handleReview = (e: React.MouseEvent, status: 'approved' | 'rejected') => {
    e.stopPropagation();
    onReview?.(submission.id, status);
  };

  const getReviewStatusDisplay = () => {
    switch (submission.review_status) {
      case 'approved':
        return {
          icon: <ThumbsUp className="w-4 h-4" />,
          text: '通过',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        };
      case 'rejected':
        return {
          icon: <ThumbsDown className="w-4 h-4" />,
          text: '不通过',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: '待审核',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-300'
        };
    }
  };

  const reviewStatus = getReviewStatusDisplay();

  return (
    <Card
      className={`hover:border-gray-400 transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          {onSelect && (
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${reviewStatus.bgColor} ${reviewStatus.borderColor}`}>
            <span className={reviewStatus.textColor}>{reviewStatus.icon}</span>
            <span className={`text-xs font-semibold ${reviewStatus.textColor}`}>{reviewStatus.text}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[120px]">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{submission.student_class}班</span>
          </div>
          <div className="flex items-center gap-2 min-w-[100px]">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{submission.student_name}</span>
          </div>
          <div className="text-sm text-gray-600">{formatDate(submission.created_at)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{Object.keys(submission.answers).length} 题</Badge>
          {hasChatHistory && (
            <Badge variant="purple">
              <MessageSquare className="w-3 h-3" />
              {totalChatMessages} 条对话
            </Badge>
          )}
          <div className="flex items-center">
            {isHovered && onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-50 rounded transition-all mr-1 animate-in slide-in-from-right duration-200"
                title="删除提交记录"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {components
            .filter(component => ['single-choice', 'multiple-choice', 'fill-blank', 'question-answer', 'code-editor'].includes(component.type))
            .map((component, index) => {
              const answer = submission.answers[component.id];
              const questionText = getQuestionText(component);
              const formattedAnswer = formatAnswer(component, answer);
              const typeLabel = QUESTION_TYPE_LABELS[component.type] || component.type;
              const comparison = compareAnswers(component, answer);
              const correctAnswerText = formatCorrectAnswer(component);

              const badgeVariants: Record<string, 'info' | 'purple' | 'warning' | 'success'> = {
                'single-choice': 'info',
                'multiple-choice': 'purple',
                'fill-blank': 'warning',
                'question-answer': 'success',
                'code-editor': 'success'
              };

              const hasCorrectAnswer = (() => {
                const ca = comparison.correctAnswer;
                if (ca === null || ca === undefined) return false;
                if (component.type === 'single-choice' && (ca === '' || ca === -1)) return false;
                if (component.type === 'multiple-choice' && Array.isArray(ca) && ca.length === 0) return false;
                if (component.type === 'fill-blank' && Array.isArray(ca) &&
                    (ca.length === 0 || ca.every((ans: string) => !ans || ans.trim() === ''))) return false;
                if (component.type === 'question-answer' && ca === '') return false;
                return true;
              })();

              const getStatusIcon = () => {
                if (!hasCorrectAnswer) {
                  return null;
                }
                if (comparison.detail === '主观题需人工批改') {
                  return <AlertCircle className="w-5 h-5 text-blue-500" />;
                }
                return comparison.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                );
              };

              const getStatusBgColor = () => {
                if (!hasCorrectAnswer) {
                  return 'from-white to-gray-50';
                }
                if (comparison.detail === '主观题需人工批改') {
                  return 'from-blue-50 to-blue-100';
                }
                return comparison.isCorrect
                  ? 'from-green-50 to-green-100'
                  : 'from-red-50 to-red-100';
              };

              const getBorderColor = () => {
                if (!hasCorrectAnswer) {
                  return 'border-gray-200';
                }
                if (comparison.detail === '主观题需人工批改') {
                  return 'border-blue-200';
                }
                return comparison.isCorrect
                  ? 'border-green-200'
                  : 'border-red-200';
              };

              return (
                <div key={component.id} className={`bg-gradient-to-r ${getStatusBgColor()} rounded-xl p-4 border-2 ${getBorderColor()} shadow-sm`}>
                  <div className="flex items-start gap-3 mb-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={badgeVariants[component.type] || 'default'}>{typeLabel}</Badge>
                        <span className="text-sm font-semibold text-gray-900">
                          题 {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{questionText}</p>
                    </div>
                  </div>

                  <div className={`space-y-2 ${hasCorrectAnswer ? 'pl-8' : ''}`}>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">学生答案</p>
                      {component.type === 'code-editor' ? (
                        <pre className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap break-words">
                          {formattedAnswer}
                        </pre>
                      ) : (
                        <p className="text-sm text-gray-900">{formattedAnswer}</p>
                      )}
                    </div>

                    {hasCorrectAnswer && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {component.type === 'question-answer' ? '参考答案' : '正确答案'}
                        </p>
                        <p className="text-sm text-gray-900">{correctAnswerText}</p>
                      </div>
                    )}

                    {hasCorrectAnswer && comparison.detail && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>{comparison.detail}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          {onReview && (
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => handleReview(e, 'approved')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${
                    submission.review_status === 'approved'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  通过
                </button>
                <button
                  onClick={(e) => handleReview(e, 'rejected')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${
                    submission.review_status === 'rejected'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  不通过
                </button>
              </div>
            </div>
          )}

          {hasChatHistory && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChatHistory(!showChatHistory);
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  AI 对话记录（{totalChatMessages} 条）
                  {showChatHistory ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadChatHistory();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载对话记录
                </button>
              </div>

              {showChatHistory && (
                <div className="space-y-4">
                  {Object.entries(submission.chat_history!).map(([chatboxId, messages]) => {
                    const chatboxComponent = components.find(c => c.id === chatboxId);
                    const chatboxTitle = chatboxComponent?.type === 'ai-chatbox'
                      ? (chatboxComponent.config as { title?: string }).title || 'AI 对话'
                      : 'AI 对话';

                    return (
                      <div key={chatboxId} className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          <h4 className="text-sm font-bold text-purple-900">{chatboxTitle}</h4>
                          <Badge variant="purple">{messages.length} 条</Badge>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-white border border-purple-200 ml-4'
                                  : 'bg-purple-100 border border-purple-300 mr-4'
                              }`}
                            >
                              <p className="text-xs font-semibold mb-1 ${
                                msg.role === 'user' ? 'text-purple-600' : 'text-purple-800'
                              }">
                                {msg.role === 'user' ? '👤 学生' : '🤖 AI'}
                              </p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
