'use client';

import { useEffect, useState } from 'react';
import TeamManagement from '@/components/TeamManagement';
import { fetchState } from '@/services/api';

export default function TeamPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  return <TeamManagement users={users} onUpdate={() => {}} />;
}
