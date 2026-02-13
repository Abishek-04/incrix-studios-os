'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { fetchState } from '@/services/api';

export default function CalendarPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  return <CalendarView projects={projects} onSelectProject={() => {}} />;
}
