'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, RotateCcw, X, Calendar, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { useConfirm } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';

const ENTITY_LABELS = {
  project: 'Project',
  channel: 'Channel',
  daily_task: 'Daily Task',
  user: 'User',
  automation_rule: 'Automation',
  other: 'Other'
};

const FILTERS = ['all', 'project', 'channel', 'daily_task', 'user', 'automation_rule'];

function getItemTitle(item) {
  return item?.data?.title || item?.data?.name || item?.data?.task || item?.data?.email || item.entityId;
}

export default function RecycleBinPage() {
  const confirmAction = useConfirm();
  const { user: currentUser } = useAuth();

  function userParams() {
    if (!currentUser) return '';
    const p = new URLSearchParams();
    if (currentUser.id || currentUser._id) p.set('userId', currentUser.id || currentUser._id);
    if (currentUser.name) p.set('userName', currentUser.name);
    return p.toString();
  }
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [restoringIds, setRestoringIds] = useState({});
  const [deletingIds, setDeletingIds] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // 'deleting' | 'restoring'

  const loadItems = async (type = activeFilter) => {
    try {
      setLoading(true);
      const up = userParams();
      const response = await fetchWithAuth(`/api/recycle-bin?type=${type}&limit=200${up ? `&${up}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load recycle bin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    loadItems(activeFilter);
    setSelectedIds(new Set());
  }, [activeFilter]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleRestore = async (id) => {
    setRestoringIds(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetchWithAuth('/api/recycle-bin', {
        method: 'POST',
        body: JSON.stringify({ deletedItemId: id, currentUser: currentUser })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setRestoringIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePermanentDelete = async (id) => {
    setDeletingIds(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetchWithAuth('/api/recycle-bin', {
        method: 'DELETE',
        body: JSON.stringify({ id, currentUser: currentUser })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    } catch (error) {
      console.error('Permanent delete failed:', error);
    } finally {
      setDeletingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = await confirmAction(
      'Delete Permanently?',
      `Are you sure you want to permanently delete ${ids.length} item${ids.length > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    setBulkAction('deleting');
    try {
      const response = await fetchWithAuth('/api/recycle-bin', {
        method: 'DELETE',
        body: JSON.stringify({ ids, currentUser: currentUser })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBulkAction('restoring');
    try {
      const response = await fetchWithAuth('/api/recycle-bin', {
        method: 'POST',
        body: JSON.stringify({ deletedItemIds: ids, currentUser: currentUser })
      });
      const data = await response.json();
      if (data.success) {
        const restoredIds = new Set((data.restored || []).map(r => r.id));
        setItems(prev => prev.filter(item => !restoredIds.has(item.id)));
        setSelectedIds(prev => {
          const n = new Set(prev);
          restoredIds.forEach(id => n.delete(id));
          return n;
        });
      }
    } catch (error) {
      console.error('Bulk restore failed:', error);
    } finally {
      setBulkAction(null);
    }
  };

  const groupedCounts = useMemo(() => {
    const map = { all: items.length };
    FILTERS.forEach((filter) => {
      if (filter !== 'all') {
        map[filter] = items.filter(item => item.entityType === filter).length;
      }
    });
    return map;
  }, [items]);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Recycle Bin</h1>
        <p className="text-[#888]">Deleted items stay here for 30 days. Restore anytime.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeFilter === filter
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-[#1a1a1a] border-[#2f2f2f] text-[#999] hover:text-white hover:border-[#444]'
            }`}
          >
            {filter === 'all' ? 'All' : ENTITY_LABELS[filter]}
            <span className="ml-2 text-[10px] text-[#bbb]">({groupedCounts[filter] || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : items.length === 0 ? (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <Trash2 className="w-10 h-10 text-[#555] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Recycle Bin is empty</p>
          <p className="text-[#777] text-sm">Deleted items will appear here.</p>
        </div>
      ) : (
        <>
          {/* Select All / Bulk Actions Bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-[#999] hover:text-white transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-indigo-400" />
              ) : isSomeSelected ? (
                <MinusSquare size={16} className="text-indigo-400" />
              ) : (
                <Square size={16} />
              )}
              {isAllSelected ? 'Deselect All' : `Select All (${items.length})`}
            </button>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#999]">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkRestore}
                  disabled={!!bulkAction}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/25 disabled:opacity-60 inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  {bulkAction === 'restoring' ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={!!bulkAction}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/10 border border-rose-500/30 text-rose-300 hover:bg-rose-600/20 disabled:opacity-60 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {bulkAction === 'deleting' ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-[#151515] border rounded-xl p-4 transition-colors ${
                  selectedIds.has(item.id)
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-[#2a2a2a]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="mt-1 text-[#666] hover:text-indigo-400 transition-colors"
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare size={18} className="text-indigo-400" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] border border-[#3a3a3a] text-[#bbb] uppercase">
                          {ENTITY_LABELS[item.entityType] || 'Item'}
                        </span>
                        <span className="text-[11px] text-[#666] flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{getItemTitle(item)}</h3>
                      <p className="text-[#777] text-xs mt-1">ID: {item.entityId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      disabled={!!restoringIds[item.id]}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/25 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-1">
                        <RotateCcw size={12} />
                        {restoringIds[item.id] ? 'Restoring...' : 'Restore'}
                      </span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      disabled={!!deletingIds[item.id]}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/10 border border-rose-500/30 text-rose-300 hover:bg-rose-600/20 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-1">
                        <X size={12} />
                        {deletingIds[item.id] ? 'Deleting...' : 'Delete'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
