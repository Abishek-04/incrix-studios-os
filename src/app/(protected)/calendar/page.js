'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState } from '@/services/api';

export default function CalendarPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setChannels(data.channels || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return <CalendarView projects={projects} channels={channels} onSelectProject={() => {}} />;
}
