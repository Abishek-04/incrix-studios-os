'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import BlockEditor from '../editor/BlockEditor';
import { Save, Clock, Users } from 'lucide-react';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import PresenceAvatars from '../collaboration/PresenceAvatars';
import TypingIndicator from '../collaboration/TypingIndicator';

export default function PageView({ pageId }) {
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const { setCurrentPage, isDirty, markSaved } = useEditorStore();

  // Get current user from localStorage
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  // Real-time collaboration
  const {
    isConnected,
    activeUsers,
    cursors,
    typingUsers,
    emitBlockUpdate,
    emitTitleUpdate,
    emitTypingStart,
    emitTypingStop
  } = useRealtimeCollaboration(pageId, currentUser?.id, currentUser?.name);

  // Listen for remote updates
  useEffect(() => {
    const handleRemoteBlockUpdate = (event) => {
      const { blockId, content: newContent } = event.detail;
      // Update content from remote user
      setContent(newContent);
    };

    const handleRemoteTitleUpdate = (event) => {
      const { title } = event.detail;
      setPage(prev => prev ? { ...prev, title } : null);
    };

    window.addEventListener('remote-block-update', handleRemoteBlockUpdate);
    window.addEventListener('remote-title-update', handleRemoteTitleUpdate);

    return () => {
      window.removeEventListener('remote-block-update', handleRemoteBlockUpdate);
      window.removeEventListener('remote-title-update', handleRemoteTitleUpdate);
    };
  }, []);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}`);
        const data = await response.json();

        if (data.success) {
          setPage(data.page);
          setCurrentPage(data.page);

          // Convert blocks to HTML for editor
          const initialContent = data.page.blocks
            ?.map(block => block.content)
            .join('<br/>') || '';
          setContent(initialContent);
        }
      } catch (error) {
        console.error('Failed to fetch page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageId) {
      fetchPage();
    }
  }, [pageId, setCurrentPage]);

  // Auto-save on content change
  useEffect(() => {
    if (!isDirty || !page) return;

    const saveTimeout = setTimeout(async () => {
      setIsSaving(true);

      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks: [{
              id: `block-${Date.now()}`,
              type: 'paragraph',
              content: content,
              order: 0
            }],
            updatedAt: Date.now()
          })
        });

        if (response.ok) {
          markSaved();
          // Emit block update to other users
          emitBlockUpdate(`block-${Date.now()}`, content, {});
        }
      } catch (error) {
        console.error('Failed to save:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [isDirty, content, pageId, page, markSaved, emitBlockUpdate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
          <p className="text-[#999]">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 p-8 pb-4 border-b border-[#1f1f1f]">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <input
            type="text"
            value={page.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setPage({ ...page, title: newTitle });
              // Emit title update to other users
              emitTitleUpdate(newTitle);
            }}
            className="text-4xl font-bold text-white bg-transparent border-none outline-none w-full mb-4 placeholder-[#666]"
            placeholder="Untitled"
          />

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-[#999]">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>
                Last edited {new Date(page.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {page.editors?.length > 0 && (
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>{page.editors.length} contributor{page.editors.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Real-time presence */}
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <PresenceAvatars activeUsers={activeUsers} currentUser={currentUser} />
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {isSaving ? (
                <span className="text-amber-500">Saving...</span>
              ) : isDirty ? (
                <span className="text-[#666]">Unsaved changes</span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <Save size={14} />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content - Editor */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <BlockEditor
            pageId={pageId}
            initialContent={content}
            editable={true}
            onUpdate={(newContent) => {
              setContent(newContent);
              // Emit typing indicator
              emitTypingStart('main-block');
            }}
          />

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} blockId="main-block" />
        </div>
      </div>
    </div>
  );
}
