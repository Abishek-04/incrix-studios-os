'use client';

import { useEffect, useState } from 'react';
import ProjectList from '@/components/ProjectList';
import { fetchState } from '@/services/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    <ProjectList
      projects={projects}
      channels={channels}
      onSelectProject={() => {}}
      searchQuery={searchQuery}
      onDeleteProject={() => {}}
    />
  );
}
