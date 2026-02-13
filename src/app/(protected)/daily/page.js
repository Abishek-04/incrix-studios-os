'use client';

import { useEffect, useState } from 'react';
import DailyTasks from '@/components/DailyTasks';
import { fetchState } from '@/services/api';

export default function DailyPage() {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setDailyTasks(data.dailyTasks || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  return <DailyTasks dailyTasks={dailyTasks} users={users} onUpdate={() => {}} />;
}
