'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import { fetchState } from '@/services/api';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setUsers(data.users || []);

        // Get current user from localStorage first
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else if (data.users && data.users.length > 0) {
          // Fallback: use first manager or first user if no stored user
          const fallbackUser = data.users.find(u => u.role === 'manager') || data.users[0];
          setCurrentUser(fallbackUser);
          // Optionally store it
          localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
        }
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
      users={users}
      currentUser={currentUser}
      onSelectProject={() => {}}
    />
  );
}
