'use client';

import { useEffect, useState } from 'react';
import ManageChannels from '@/components/ManageChannels';
import { fetchState, saveState } from '@/services/api';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);

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

  const handleUpdateChannels = (updatedChannels) => {
    setChannels(updatedChannels);
    saveState({ channels: updatedChannels });
  };

  return (
    <ManageChannels
      channels={channels}
      users={users}
      onUpdateChannels={handleUpdateChannels}
    />
  );
}
