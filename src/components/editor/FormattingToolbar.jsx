'use client';

import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';

export default function FormattingToolbar({ editor }) {
  if (!editor) return null;

  const Button = ({ onClick, isActive, children, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-[#999] hover:text-white hover:bg-[#1e1e1e]'
      }`}
      title={label}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 mb-3 p-2 bg-[#1e1e1e] rounded-lg border border-[#2f2f2f]">
      {/* Undo/Redo */}
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        label="Undo"
      >
        <Undo size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        label="Redo"
      >
        <Redo size={16} />
      </Button>

      <div className="w-px h-6 bg-[#333] mx-1"></div>

      {/* Text formatting */}
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        label="Bold (Cmd+B)"
      >
        <Bold size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        label="Italic (Cmd+I)"
      >
        <Italic size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        label="Strikethrough"
      >
        <Strikethrough size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        label="Inline Code (Cmd+E)"
      >
        <Code size={16} />
      </Button>

      <div className="w-px h-6 bg-[#333] mx-1"></div>

      {/* Headings */}
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        label="Heading 1"
      >
        <Heading1 size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        label="Heading 2"
      >
        <Heading2 size={16} />
      </Button>

      <div className="w-px h-6 bg-[#333] mx-1"></div>

      {/* Lists */}
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        label="Bullet List"
      >
        <List size={16} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        label="Numbered List"
      >
        <ListOrdered size={16} />
      </Button>

      <div className="w-px h-6 bg-[#333] mx-1"></div>

      {/* Quote */}
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        label="Quote"
      >
        <Quote size={16} />
      </Button>
    </div>
  );
}
