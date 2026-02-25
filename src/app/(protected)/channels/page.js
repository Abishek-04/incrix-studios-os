'use client';

import { useEffect, useRef, useState } from 'react';
import ManageChannels from '@/components/ManageChannels';
import UndoToast from '@/components/ui/UndoToast';
import { fetchState, saveState } from '@/services/api';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [undoDelete, setUndoDelete] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setChannels(data.channels || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const handleUpdateChannels = (updatedChannels) => {
    setChannels(updatedChannels);
    saveState({ channels: updatedChannels });
  };

  const handleDeleteChannel = (channelId) => {
    clearUndoTimer();

    const snapshot = channels;
    const deletedChannel = channels.find(c => c.id === channelId);
    const updatedChannels = channels.filter(c => c.id !== channelId);

    setChannels(updatedChannels);

    undoTimerRef.current = setTimeout(() => {
      saveState({ channels: updatedChannels });
      setUndoDelete(null);
      undoTimerRef.current = null;
    }, 5000);

    setUndoDelete({
      message: `Deleted "${deletedChannel?.name || 'channel'}"`,
      onUndo: () => {
        clearUndoTimer();
        setChannels(snapshot);
        setUndoDelete(null);
      }
    });
  };

  return (
    <>
      <ManageChannels
        channels={channels}
        users={users}
        onUpdateChannels={handleUpdateChannels}
        onDeleteChannel={handleDeleteChannel}
      />
      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={() => undoDelete?.onUndo?.()}
        onClose={() => {
          if (undoDelete) {
            clearUndoTimer();
            saveState({ channels });
            setUndoDelete(null);
          }
        }}
      />
    </>
  );
}
