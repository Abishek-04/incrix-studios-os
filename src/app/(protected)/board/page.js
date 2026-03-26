'use client';

import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import ProjectModal from '@/components/ProjectModal';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createProject, updateProject, deleteProject, fetchWithAuth } from '@/services/api';
import { useToast } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';

export default function BoardPage() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const loadData = async () => {
    try {
      const data = await fetchState();
      setProjects(data.projects || []);
      setChannels(data.channels || []);
      setUsers(data.users || []);
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProject = async (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject((prev) => prev?.id === updatedProject.id ? updatedProject : prev);

    try {
      const response = await updateProject(updatedProject.id, updatedProject);
      if (!response?.success) {
        if (response?.error === 'Project not found') {
          const isDraftProject = !updatedProject?.createdAt;
          if (isDraftProject) {
            const createResponse = await createProject(updatedProject);
            if (createResponse?.success) {
              const persistedProject = createResponse.project || updatedProject;
              setProjects((prevProjects) => {
                const exists = prevProjects.some((p) => p.id === persistedProject.id);
                if (exists) {
                  return prevProjects.map((p) => (p.id === persistedProject.id ? persistedProject : p));
                }
                return [...prevProjects, persistedProject];
              });
              setSelectedProject(persistedProject);
              return { success: true, project: persistedProject };
            }
          }

          setProjects((prevProjects) => prevProjects.filter((p) => p.id !== updatedProject.id));
          setSelectedProject((prevSelected) => (prevSelected?.id === updatedProject.id ? null : prevSelected));
        }

        console.error('Project update failed:', response?.error);
        showToast(response?.error || 'Failed to save project changes');
        return { success: false, error: response?.error || 'Update failed' };
      }

      if (response.project) {
        setProjects((prevProjects) =>
          prevProjects.map((p) => (p.id === response.project.id ? response.project : p))
        );
        setSelectedProject((prevSelected) =>
          prevSelected?.id === response.project.id ? response.project : prevSelected
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Project update error:', error);
      showToast('Failed to save project changes');
      await loadData();
      return { success: false, error: 'Update failed' };
    }
  };

  const handleDeleteProject = async (projectId) => {
    const deletedProject = projects.find(p => p.id === projectId);
    setProjects((prevProjects) => prevProjects.filter((p) => p.id !== projectId));
    setSelectedProject(null);

    try {
      const response = await deleteProject(projectId);

      if (!response?.success) {
        console.error('Project delete failed:', response?.error);
        // If already gone from DB, just keep it removed from UI
        if (response?.error === 'Project not found') {
          return;
        }
        // Real failure — refetch DB state to get truth
        showToast(response?.error || 'Failed to delete project');
        await loadData();
        return;
      }

      setUndoDelete({
        deletedItemId: response.deletedItemId,
        project: deletedProject,
        message: `Deleted "${deletedProject?.title || 'project'}"`
      });
    } catch (error) {
      console.error('Project delete error:', error);
      showToast('Failed to delete project');
      await loadData();
    }
  };

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ProjectBoard
        projects={projects}
        channels={channels}
        onSelectProject={setSelectedProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onCreateProject={() => {
          const newProject = {
            id: `PRJ-${Date.now().toString().slice(-6)}`,
            title: 'New Untitled Project',
            topic: 'To be decided',
            vertical: 'software',
            platform: 'youtube',
            creator: 'Unassigned',
            editors: [],
            stage: 'Backlog',
            status: 'Not Started',
            priority: 'Medium',
            dueDate: Date.now() + 7 * 86400000,
            lastUpdated: Date.now(),
            role: currentUser?.role || 'creator',
          };
          setSelectedProject(newProject);
        }}
      />

      {selectedProject && currentUser && (
        <ProjectModal
          project={selectedProject}
          currentUser={currentUser}
          currentUserRole={currentUser.role}
          channels={channels}
          users={users}
          courses={courses}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
          onCreate={(newProject) => {
            return createProject(newProject).then((response) => {
              if (!response?.success) {
                showToast(response?.error || 'Failed to create project');
                return { success: false, error: response?.error || 'Create failed' };
              }
              const createdProject = response.project || newProject;
              setProjects(prevProjects => {
                const exists = prevProjects.some((p) => p.id === createdProject.id);
                return exists ? prevProjects : [...prevProjects, createdProject];
              });
              setSelectedProject(createdProject);
              return { success: true, project: createdProject };
            });
          }}
          onDelete={handleDeleteProject}
          onNotification={async (notif) => {
            try {
              await fetchWithAuth('/api/notifications', {
                method: 'POST',
                body: JSON.stringify({
                  title: notif.type === 'mention' ? `${notif.commenterName} mentioned you` : `New comment on ${notif.projectTitle}`,
                  message: `${notif.commenterName} ${notif.type === 'mention' ? 'mentioned you in' : 'commented on'} "${notif.projectTitle}"`,
                  type: 'info',
                  targetUserIds: [notif.userId],
                }),
              });
            } catch (e) { console.error('Notification failed:', e); }
          }}
        />
      )}

      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={async () => {
          if (!undoDelete?.deletedItemId) return;
          try {
            const response = await fetchWithAuth('/api/recycle-bin', {
              method: 'POST',
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId })
            });
            const data = await response.json();
            if (data.success && undoDelete.project) {
              setProjects(prevProjects => {
                const exists = prevProjects.some(p => p.id === undoDelete.project.id);
                return exists ? prevProjects : [undoDelete.project, ...prevProjects];
              });
            }
          } catch (error) {
            console.error('Undo project restore failed:', error);
          } finally {
            setUndoDelete(null);
          }
        }}
        onClose={() => setUndoDelete(null)}
      />
    </>
  );
}
