import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface VideoHelpTipProps {
  onVisibilityChange?: (visible: boolean) => void;
}

function ImagePreviewModal({ isOpen, onClose, src, alt }: { isOpen: boolean; onClose: () => void; src: string; alt: string }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg"
        title="关闭"
      >
        <X className="w-6 h-6 text-gray-900" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function VideoHelpBanner({ onClose }: { onClose: () => void }) {
  const [showImagePreview, setShowImagePreview] = useState(false);

  return (
    <>
      <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-3">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded transition-colors"
          title="关闭提示"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex items-start gap-3">
          <img
            src="/bilibilivideoimage.png"
            alt="B站嵌入代码获取教程"
            className="w-48 h-auto rounded-lg border border-gray-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowImagePreview(true)}
            title="点击查看大图"
          />
          <div className="flex-1 text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-2">如何获取B站嵌入代码：</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>点击视频左下角"分享"按钮</li>
              <li>选择"嵌入代码"</li>
              <li>粘贴到此输入框</li>
            </ol>
          </div>
        </div>
      </div>
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        src="/bilibilivideoimage.png"
        alt="B站嵌入代码获取教程"
      />
    </>
  );
}

export function VideoHelpIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-2 top-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
      title="查看帮助"
    >
      <HelpCircle className="w-5 h-5 text-gray-500" />
    </button>
  );
}

export function VideoHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [showImagePreview, setShowImagePreview] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">获取B站嵌入代码</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-start gap-3">
            <img
              src="/bilibilivideoimage.png"
              alt="B站嵌入代码获取教程"
              className="w-48 h-auto rounded-lg border border-gray-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowImagePreview(true)}
              title="点击查看大图"
            />
            <div className="flex-1 text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-2">如何获取B站嵌入代码：</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>点击视频左下角"分享"按钮</li>
                <li>选择"嵌入代码"</li>
                <li>粘贴到此输入框</li>
              </ol>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        src="/bilibilivideoimage.png"
        alt="B站嵌入代码获取教程"
      />
    </>
  );
}

export default function VideoHelpTip({ onVisibilityChange }: VideoHelpTipProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    onVisibilityChange?.(false);
  };

  const handleIconClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {isVisible && <VideoHelpBanner onClose={handleClose} />}
      {!isVisible && <VideoHelpIcon onClick={handleIconClick} />}
      <VideoHelpModal isOpen={isModalOpen} onClose={handleModalClose} />
    </>
  );
}
