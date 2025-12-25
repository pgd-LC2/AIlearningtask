import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Undo,
  Redo
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '输入内容...',
  className = '',
  minHeight = '120px'
}: RichTextEditorProps) {
  const [activeMarks, setActiveMarks] = useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Placeholder.configure({
        placeholder
      })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      updateActiveMarks(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateActiveMarks(editor);
    },
    onTransaction: ({ editor }) => {
      updateActiveMarks(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
      },
    },
  });

  const updateActiveMarks = useCallback((editorInstance: typeof editor) => {
    if (!editorInstance) return;

    const state = editorInstance.state;
    const storedMarks = state.storedMarks;
    const $from = state.selection.$from;

    const checkMark = (markName: string) => {
      if (storedMarks) {
        return storedMarks.some(mark => mark.type.name === markName);
      }
      const marks = $from.marks();
      return marks.some(mark => mark.type.name === markName);
    };

    setActiveMarks({
      bold: checkMark('bold'),
      italic: checkMark('italic'),
      underline: checkMark('underline'),
      bulletList: editorInstance.isActive('bulletList'),
      orderedList: editorInstance.isActive('orderedList')
    });
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      updateActiveMarks(editor);
    }
  }, [editor, updateActiveMarks]);

  if (!editor) {
    return null;
  }

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const ToolbarButton = ({
    onAction,
    isActive,
    children,
    title
  }: {
    onAction: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAction();
      }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  const handleToggleBold = () => {
    editor.chain().focus().toggleBold().run();
    setTimeout(() => updateActiveMarks(editor), 0);
  };

  const handleToggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
    setTimeout(() => updateActiveMarks(editor), 0);
  };

  const handleToggleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
    setTimeout(() => updateActiveMarks(editor), 0);
  };

  return (
    <div className={`border-2 border-primary rounded-lg overflow-hidden bg-white ${className}`}>
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200"
        onMouseDown={handleToolbarMouseDown}
      >
        <ToolbarButton
          onAction={handleToggleBold}
          isActive={activeMarks.bold}
          title="加粗"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onAction={handleToggleItalic}
          isActive={activeMarks.italic}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onAction={handleToggleUnderline}
          isActive={activeMarks.underline}
          title="下划线"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().toggleBulletList().run()}
          isActive={activeMarks.bulletList}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onAction={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={activeMarks.orderedList}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().undo().run()}
          isActive={false}
          title="撤销"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onAction={() => editor.chain().focus().redo().run()}
          isActive={false}
          title="重做"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div
        className="overflow-y-auto"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
