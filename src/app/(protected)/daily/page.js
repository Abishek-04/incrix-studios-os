'use client';

import { useEffect, useState } from 'react';
import NotionDailyTasks from '@/components/NotionDailyTasks';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createDailyTask, updateDailyTask, deleteDailyTask } from '@/services/api';

export default function DailyPage() {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setDailyTasks(data.dailyTasks || []);
        setUsers(data.users || []);

        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else if (data.users && data.users.length > 0) {
          const fallbackUser = data.users.find(u => u.role === 'manager') || data.users[0];
          setCurrentUser(fallbackUser);
          localStorage.setItem('auth_user', JSON.stringify(fallbackUser));
        }
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
    const response = await createDailyTask(newTask);
    if (!response?.success) {
      console.error('Failed to create task:', response?.error);
      setDailyTasks(prev => prev.filter(t => t.id !== newTask.id));
    }
  };

  const handleToggleTask = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: newDone } : t));
    const response = await updateDailyTask(taskId, { done: newDone });
    if (!response?.success) {
      console.error('Failed to toggle task:', response?.error);
      setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !newDone } : t));
    }
  };

  const handleUpdateTaskText = async (taskId, newText) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    const oldText = task.task;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: newText } : t));
    const response = await updateDailyTask(taskId, { task: newText });
    if (!response?.success) {
      console.error('Failed to update task text:', response?.error);
      setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: oldText } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    const deletedTask = dailyTasks.find(t => t.id === taskId);
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));

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
  };

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  return (
    <>
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
            const response = await fetch('/api/recycle-bin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId, currentUser: JSON.parse(localStorage.getItem('auth_user') || '{}') })
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
