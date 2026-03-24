'use client';

import { useEffect, useState } from 'react';
import PerformanceView from '@/components/PerformanceView';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PerformancePage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchState();
        setUsers(data.users || []);
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  if (!currentUser || loading) {
    return <LoadingScreen />;
  }

  return (
    <PerformanceView
      users={users}
      projects={projects}
      currentUser={currentUser}
    />
  );
}
