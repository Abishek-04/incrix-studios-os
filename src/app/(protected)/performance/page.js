'use client';

import { useEffect, useState } from 'react';
import PerformanceView from '@/components/PerformanceView';
import { fetchState } from '@/services/api';

export default function PerformancePage() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current user
    const user = localStorage.getItem('auth_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

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

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading performance data...</div>
      </div>
    );
  }

  return (
    <PerformanceView
      users={users}
      projects={projects}
      currentUser={currentUser}
    />
  );
}
