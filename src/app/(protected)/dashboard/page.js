'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import { fetchState } from '@/services/api';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user from localStorage
    const user = localStorage.getItem('auth_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    // Fetch data from API
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Dashboard
      projects={projects}
      currentUser={currentUser}
      onSelectProject={() => {}}
    />
  );
}
