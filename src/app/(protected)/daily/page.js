'use client';

import { useEffect, useRef, useState } from 'react';
import NotionDailyTasks from '@/components/NotionDailyTasks';
import UndoToast from '@/components/ui/UndoToast';
import { fetchState, saveState } from '@/services/api';

export default function DailyPage() {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setDailyTasks(data.dailyTasks || []);
        setUsers(data.users || []);

        // Get current user from localStorage
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
      }
    };

    loadData();
  }, []);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const handleUpdateTasks = (updatedTasks) => {
    setDailyTasks(updatedTasks);
    saveState({ dailyTasks: updatedTasks });
  };

  const handleDeleteTask = (taskId) => {
    clearUndoTimer();
    const snapshot = dailyTasks;
    const deletedTask = dailyTasks.find(t => t.id === taskId);
    const updatedTasks = dailyTasks.filter(t => t.id !== taskId);

    setDailyTasks(updatedTasks);

    undoTimerRef.current = setTimeout(() => {
      saveState({ dailyTasks: updatedTasks });
      setUndoDelete(null);
      undoTimerRef.current = null;
    }, 5000);

    setUndoDelete({
      message: `Deleted "${deletedTask?.text || deletedTask?.task || 'task'}"`,
      onUndo: () => {
        clearUndoTimer();
        setDailyTasks(snapshot);
        setUndoDelete(null);
      }
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <NotionDailyTasks
        tasks={dailyTasks}
        users={users}
        currentUser={currentUser}
        onUpdateTasks={handleUpdateTasks}
        onDeleteTask={handleDeleteTask}
      />
      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={() => undoDelete?.onUndo?.()}
        onClose={() => {
          if (undoDelete) {
            clearUndoTimer();
            saveState({ dailyTasks });
            setUndoDelete(null);
          }
        }}
      />
    </>
  );
}
