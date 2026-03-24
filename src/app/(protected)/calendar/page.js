'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ReminderDialog from '@/components/ReminderDialog';
import { fetchState, fetchWithAuth } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/UIContext';

export default function CalendarPage() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDefaultDate, setReminderDefaultDate] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stateData, remindersRes] = await Promise.all([
          fetchState(),
          fetchWithAuth('/api/reminders'),
        ]);
        setProjects(stateData.projects || []);
        setChannels(stateData.channels || []);
        setUsers(stateData.users || []);

        const remindersData = await remindersRes.json();
        setReminders(remindersData.reminders || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateReminder = async (reminderData) => {
    try {
      const res = await fetchWithAuth('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(reminderData),
      });
      const data = await res.json();
      if (data.success) {
        setReminders((prev) => [...prev, data.reminder]);
        setShowReminder(false);
        showToast('Reminder set successfully');
      } else {
        showToast(data.error || 'Failed to set reminder');
      }
    } catch (error) {
      showToast('Failed to set reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${reminderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      }
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const handleDateClick = (dateStr) => {
    setReminderDefaultDate(dateStr);
    setShowReminder(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <CalendarView
        projects={projects}
        channels={channels}
        reminders={reminders}
        onSelectProject={() => {}}
        onDateClick={handleDateClick}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* Floating reminder button */}
      <button
        onClick={() => { setReminderDefaultDate(null); setShowReminder(true); }}
        className="fixed bottom-24 md:bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl shadow-lg transition-colors"
        title="Set a reminder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <span className="hidden sm:inline">Reminder</span>
      </button>

      {showReminder && (
        <ReminderDialog
          users={users}
          currentUser={currentUser}
          onClose={() => setShowReminder(false)}
          onSubmit={handleCreateReminder}
          defaultDate={reminderDefaultDate}
        />
      )}
    </>
  );
}
