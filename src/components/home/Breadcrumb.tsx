import { ChevronRight, Home } from 'lucide-react';
import { Folder } from '../../types';

interface BreadcrumbProps {
  folders: Folder[];
  currentFolder: Folder | null;
  onNavigate: (folderId: string | null) => void;
}

export default function Breadcrumb({ folders, currentFolder, onNavigate }: BreadcrumbProps) {
  const getFolderPath = (folder: Folder | null): Folder[] => {
    if (!folder) return [];
    const path: Folder[] = [];
    let current: Folder | undefined = folder;

    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current!.parent_id);
    }

    return path;
  };

  const path = getFolderPath(currentFolder);

  return (
    <div className="flex items-center gap-2 text-sm mb-4">
      <button
        onClick={() => onNavigate(null)}
        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-white/50 transition-colors ${
          !currentFolder ? 'text-gray-900 font-medium' : 'text-gray-600'
        }`}
      >
        <Home className="w-4 h-4" />
        全部学习单
      </button>

      {path.map((folder) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded hover:bg-white/50 transition-colors ${
              folder.id === currentFolder?.id ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </div>
  );
}
