'use client';

import { useEffect, useState } from 'react';
import ProjectList from '@/components/ProjectList';
import ProjectModal from '@/components/ProjectModal';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createProject, updateProject, deleteProject } from '@/services/api';
import { useToast } from '@/contexts/UIContext';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setChannels(data.channels || []);
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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateProject = async (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject(updatedProject);

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
  };

  const handleDeleteProject = async (projectId) => {
    const deletedProject = projects.find(p => p.id === projectId);
    setProjects((prevProjects) => prevProjects.filter((p) => p.id !== projectId));
    setSelectedProject(null);
    const response = await deleteProject(projectId);

    if (!response?.success) {
      console.error('Project delete failed:', response?.error);
      // If "Project not found", it's already gone from DB — don't re-add to UI
      if (response?.error === 'Project not found') {
        return;
      }
      showToast(response?.error || 'Failed to delete project');
      if (deletedProject) {
        setProjects((prevProjects) => {
          const exists = prevProjects.some((p) => p.id === deletedProject.id);
          return exists ? prevProjects : [...prevProjects, deletedProject];
        });
      }
      return;
    }

    setUndoDelete({
      deletedItemId: response.deletedItemId,
      project: deletedProject,
      message: `Deleted "${deletedProject?.title || 'project'}"`
    });
  };

  const handleCreateProject = async (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);

    const response = await createProject(newProject);
    if (!response?.success) {
      console.error('Project create failed:', response?.error);
      showToast(response?.error || 'Failed to create project');
      setProjects((prevProjects) => prevProjects.filter((p) => p.id !== newProject.id));
      setSelectedProject(null);
      return { success: false, error: response?.error || 'Create failed' };
    }

    if (response.project) {
      const createdProject = response.project;
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === newProject.id ? createdProject : p))
      );
      setSelectedProject(createdProject);
    }

    return { success: true, project: response.project || newProject };
  };

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ProjectList
        projects={projects}
        channels={channels}
        onSelectProject={setSelectedProject}
        onCreateProject={handleCreateProject}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onDeleteProject={handleDeleteProject}
      />

      {selectedProject && currentUser && (
        <ProjectModal
          project={selectedProject}
          currentUser={currentUser}
          currentUserRole={currentUser.role}
          channels={channels}
          users={users}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
          onCreate={handleCreateProject}
          onDelete={handleDeleteProject}
          onNotification={() => {}}
        />
      )}

      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={async () => {
          if (!undoDelete?.deletedItemId) return;
          try {
            const response = await fetch('/api/recycle-bin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
