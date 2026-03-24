'use client';

import { useEffect, useState } from 'react';
import NotionDailyTasks from '@/components/NotionDailyTasks';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createDailyTask, updateDailyTask, deleteDailyTask, fetchWithAuth } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DailyPage() {
  const { user: currentUser } = useAuth();
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);

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
