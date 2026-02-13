'use client';

import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { fetchState } from '@/services/api';

export default function BoardPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setChannels(data.channels || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <ProjectBoard
      projects={projects}
      channels={channels}
      onSelectProject={() => {}}
      onUpdateProject={() => {}}
      onCreateNew={() => {}}
      searchQuery=""
      selectedMonth="all"
    />
  );
}
