'use client';

import { useEffect, useState } from 'react';
import ManageChannels from '@/components/ManageChannels';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createChannel, updateChannel, deleteChannel } from '@/services/api';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setChannels(data.channels || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateChannel = async (newChannel) => {
    setChannels(prev => [...prev, newChannel]);
    try {
      const response = await createChannel(newChannel);
      if (!response?.success) {
        console.error('Failed to create channel:', response?.error);
        setChannels(prev => prev.filter(c => c.id !== newChannel.id));
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      setChannels(prev => prev.filter(c => c.id !== newChannel.id));
    }
  };

  const handleUpdateChannelMember = async (channelId, memberId) => {
    const oldChannel = channels.find(c => c.id === channelId);
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, memberId: memberId || undefined } : c));
    try {
      const response = await updateChannel(channelId, { memberId: memberId || undefined });
      if (!response?.success) {
        console.error('Failed to update channel:', response?.error);
        if (oldChannel) {
          setChannels(prev => prev.map(c => c.id === channelId ? oldChannel : c));
        }
      }
    } catch (error) {
      console.error('Failed to update channel:', error);
      if (oldChannel) {
        setChannels(prev => prev.map(c => c.id === channelId ? oldChannel : c));
      }
    }
  };

  const handleDeleteChannel = async (channelId) => {
    const deletedChannel = channels.find(c => c.id === channelId);
    setChannels(prev => prev.filter(c => c.id !== channelId));

    try {
      const response = await deleteChannel(channelId);
      if (!response?.success) {
        if (response?.error === 'Channel not found') return;
        console.error('Failed to delete channel:', response?.error);
        if (deletedChannel) {
          setChannels(prev => [...prev, deletedChannel]);
        }
        return;
      }

      setUndoDelete({
        deletedItemId: response.deletedItemId,
        channel: deletedChannel,
        message: `Deleted "${deletedChannel?.name || 'channel'}"`
      });
    } catch (error) {
      console.error('Failed to delete channel:', error);
      if (deletedChannel) {
        setChannels(prev => [...prev, deletedChannel]);
      }
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ManageChannels
        channels={channels}
        users={users}
        onCreateChannel={handleCreateChannel}
        onUpdateChannelMember={handleUpdateChannelMember}
        onDeleteChannel={handleDeleteChannel}
      />
      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={async () => {
          if (!undoDelete?.deletedItemId) return;
          try {
            const response = await fetch('/api/recycle-bin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId, currentUser: JSON.parse(localStorage.getItem('auth_user') || '{}') })
            });
            const data = await response.json();
            if (data.success && undoDelete.channel) {
              setChannels(prev => {
                const exists = prev.some(c => c.id === undoDelete.channel.id);
                return exists ? prev : [...prev, undoDelete.channel];
              });
            }
          } catch (error) {
            console.error('Undo channel restore failed:', error);
          } finally {
            setUndoDelete(null);
          }
        }}
        onClose={() => setUndoDelete(null)}
      />
    </>
  );
}
