'use client';

import { useEffect, useState } from 'react';
import NotionDailyTasks from '@/components/NotionDailyTasks';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createDailyTask, updateDailyTask, deleteDailyTask, fetchWithAuth } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/UIContext';
import ReminderDialog from '@/components/ReminderDialog';

export default function DailyPage() {
  const { user: currentUser } = useAuth();
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setDailyTasks(data.dailyTasks || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddTask = async (newTask) => {
    setDailyTasks(prev => [...prev, newTask]);
    try {
      const response = await createDailyTask(newTask);
      if (!response?.success) {
        console.error('Failed to create task:', response?.error);
        setDailyTasks(prev => prev.filter(t => t.id !== newTask.id));
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setDailyTasks(prev => prev.filter(t => t.id !== newTask.id));
    }
  };

  const handleToggleTask = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: newDone } : t));
    try {
      const response = await updateDailyTask(taskId, { done: newDone });
      if (!response?.success) {
        console.error('Failed to toggle task:', response?.error);
        setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !newDone } : t));
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !newDone } : t));
    }
  };

  const handleUpdateTaskText = async (taskId, newText) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    const oldText = task.task;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: newText } : t));
    try {
      const response = await updateDailyTask(taskId, { task: newText });
      if (!response?.success) {
        console.error('Failed to update task text:', response?.error);
        setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: oldText } : t));
      }
    } catch (error) {
      console.error('Failed to update task text:', error);
      setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: oldText } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    const deletedTask = dailyTasks.find(t => t.id === taskId);
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const response = await deleteDailyTask(taskId);
      if (!response?.success) {
        if (response?.error === 'Task not found') return;
        console.error('Failed to delete task:', response?.error);
        if (deletedTask) {
          setDailyTasks(prev => [...prev, deletedTask]);
        }
        return;
      }

      setUndoDelete({
        deletedItemId: response.deletedItemId,
        task: deletedTask,
        message: `Deleted "${deletedTask?.task || 'task'}"`
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      if (deletedTask) {
        setDailyTasks(prev => [...prev, deletedTask]);
      }
    }
  };

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  const handleCreateReminder = async (reminderData) => {
    try {
      const res = await fetchWithAuth('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(reminderData),
      });
      const data = await res.json();
      if (data.success) {
        setShowReminder(false);
        showToast('Reminder set successfully');
      } else {
        showToast(data.error || 'Failed to set reminder');
      }
    } catch (error) {
      showToast('Failed to set reminder');
    }
  };

  return (
    <>
      {/* Reminder button - floating */}
      <button
        onClick={() => setShowReminder(true)}
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
        />
      )}

      <NotionDailyTasks
        tasks={dailyTasks}
        users={users}
        currentUser={currentUser}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onUpdateTaskText={handleUpdateTaskText}
        onDeleteTask={handleDeleteTask}
      />
      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={async () => {
          if (!undoDelete?.deletedItemId) return;
          try {
            const response = await fetchWithAuth('/api/recycle-bin', {
              method: 'POST',
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId, currentUser })
            });
            const data = await response.json();
            if (data.success && undoDelete.task) {
              setDailyTasks(prev => {
                const exists = prev.some(t => t.id === undoDelete.task.id);
                return exists ? prev : [...prev, undoDelete.task];
              });
            }
          } catch (error) {
            console.error('Undo task restore failed:', error);
          } finally {
            setUndoDelete(null);
          }
        }}
        onClose={() => setUndoDelete(null)}
      />
    </>
  );
}
