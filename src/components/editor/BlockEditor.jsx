'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { useEditorStore } from '@/stores/editorStore';
import { useEffect } from 'react';
import FormattingToolbar from './FormattingToolbar';

// Create lowlight instance
const lowlight = createLowlight();

export default function BlockEditor({ pageId, initialContent, editable = true, onUpdate }) {
  const { updateBlock, addBlock, currentPage } = useEditorStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: false // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading';
          }
          return "Type '/' for commands";
        }
      }),
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      CodeBlockLowlight.configure({
        lowlight
      })
    ],
    content: initialContent || '',
    editable,
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-2'
      }
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        const content = editor.getHTML();
        onUpdate(content);
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-[#1e1e1e] rounded-lg h-32"></div>;
  }

  return (
    <div className="relative w-full">
      {editable && <FormattingToolbar editor={editor} />}
      <div className="bg-[#0d0d0d] rounded-lg border border-[#2f2f2f] overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
