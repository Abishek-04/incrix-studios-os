'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, fetchWithAuth } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stateData, clientsRes, revenueRes, activityRes] = await Promise.allSettled([
          fetchState(),
          fetchWithAuth('/api/clients').then(r => r.json()),
          fetchWithAuth('/api/revenue').then(r => r.json()),
          fetchWithAuth('/api/analytics/activity?limit=20').then(r => r.json()).catch(() => ({ activities: [] })),
        ]);

        if (stateData.status === 'fulfilled') {
          setProjects(stateData.value.projects || []);
          setUsers(stateData.value.users || []);
        }
        if (clientsRes.status === 'fulfilled') {
          setClients(clientsRes.value.clients || []);
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenue(revenueRes.value.entries || []);
        }
        if (activityRes.status === 'fulfilled') {
          const acts = activityRes.value.activities || activityRes.value.logs || [];
          setActivity(acts.map(a => ({
            user: a.userName || a.user?.name || 'Unknown',
            action: a.action || a.message || '',
            time: formatTimeAgo(a.createdAt || a.timestamp),
            color: a.userColor || 'bg-indigo-600',
          })));
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !currentUser) return <LoadingScreen />;

  return (
    <Dashboard
      projects={projects}
      users={users}
      currentUser={currentUser}
      clients={clients}
      revenue={revenue}
      activity={activity}
    />
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ts = new Date(timestamp).getTime();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
