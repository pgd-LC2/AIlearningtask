import { X, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface DraftRecoveryBannerProps {
  draftTime: Date;
  onRestore: () => void;
  onDiscard: () => void;
}

export default function DraftRecoveryBanner({
  draftTime,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return `${diffDays}天前`;
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">
              发现本地草稿（{formatTime(draftTime)}保存），是否恢复？
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              放弃
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onRestore}
            >
              恢复草稿
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
