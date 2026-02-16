'use client';

import { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Grid3x3, Heart, MessageCircle, Zap, X, ExternalLink } from 'lucide-react';

export default function MediaBrowser({ channel, onSelectMedia }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [automationFilter, setAutomationFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (channel) {
      loadMedia();
    }
  }, [channel, selectedType, automationFilter, page]);

  async function loadMedia() {
    if (!channel) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        channelId: channel.id,
        page: page.toString(),
        limit: '20',
      });

      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      if (automationFilter === 'active') {
        params.append('automationActive', 'true');
      } else if (automationFilter === 'inactive') {
        params.append('automationActive', 'false');
      }

      const response = await fetch(`/api/instagram/media?${params}`);
      const data = await response.json();

      if (data.success) {
        setMedia(data.media || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMediaIcon(type) {
    switch (type) {
      case 'VIDEO':
        return Play;
      case 'REELS':
        return Play;
      case 'CAROUSEL_ALBUM':
        return Grid3x3;
      default:
        return ImageIcon;
    }
  }

  if (!channel) {
    return (
      <div className="text-center text-[#999] py-12">
        Select an Instagram account from the Accounts tab
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-[#999] block mb-2">Media Type</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'IMAGE', label: 'Images' },
              { value: 'VIDEO', label: 'Videos' },
              { value: 'REELS', label: 'Reels' },
              { value: 'CAROUSEL_ALBUM', label: 'Carousel' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedType(option.value);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#2a2a2a] text-[#999] hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-[#999] block mb-2">Automation</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All Posts' },
              { value: 'active', label: 'With Automation' },
              { value: 'inactive', label: 'No Automation' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setAutomationFilter(option.value);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  automationFilter === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#2a2a2a] text-[#999] hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center text-[#999] py-12">
          No media found. Try syncing your account.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map(item => {
              const Icon = getMediaIcon(item.mediaType);

              return (
                <div
                  key={item.igMediaId}
                  onClick={() => setSelectedMedia(item)}
                  className="relative aspect-square bg-[#1e1e1e] rounded-lg overflow-hidden cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.caption?.substring(0, 50)}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex items-start justify-between">
                      <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                        <Icon size={12} />
                        {item.mediaType}
                      </div>
                      {item.automationActive && (
                        <div className="px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                          <Zap size={12} />
                          Auto
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-white text-sm">
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        {item.likeCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        {item.commentCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
              >
                Previous
              </button>
              <span className="text-[#999]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#333] p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Post Details</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-[#999] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Media Preview */}
              <div className="aspect-square bg-black rounded-lg overflow-hidden">
                <img
                  src={selectedMedia.mediaUrl || selectedMedia.thumbnailUrl}
                  alt="Media"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#151515] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#999] text-sm mb-1">
                    <Heart size={14} />
                    Likes
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedMedia.likeCount || 0}</div>
                </div>
                <div className="bg-[#151515] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#999] text-sm mb-1">
                    <MessageCircle size={14} />
                    Comments
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedMedia.commentCount || 0}</div>
                </div>
                <div className="bg-[#151515] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#999] text-sm mb-1">
                    <Zap size={14} />
                    Automation
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {selectedMedia.automationActive ? (
                      <span className="text-green-400">Active</span>
                    ) : (
                      <span className="text-[#666]">Not Set</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption */}
              {selectedMedia.caption && (
                <div>
                  <h4 className="text-sm font-medium text-[#999] mb-2">Caption</h4>
                  <p className="text-white">{selectedMedia.caption}</p>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3">
                <a
                  href={selectedMedia.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  View on Instagram
                </a>
                <button
                  onClick={() => {
                    setSelectedMedia(null);
                    onSelectMedia && onSelectMedia(selectedMedia);
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  Set Up Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
