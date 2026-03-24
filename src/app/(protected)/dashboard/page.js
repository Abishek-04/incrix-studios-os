'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  return (
    <Dashboard
      projects={projects}
      users={users}
      currentUser={currentUser}
      onSelectProject={() => {}}
    />
  );
}
