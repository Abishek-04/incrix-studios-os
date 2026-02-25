'use client';

import { useEffect, useState } from 'react';
import ProjectList from '@/components/ProjectList';
import ProjectModal from '@/components/ProjectModal';
import UndoToast from '@/components/ui/UndoToast';
import { fetchState, saveState } from '@/services/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);

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
      }
    };

    loadData();
  }, []);

  const handleUpdateProject = (updatedProject) => {
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      );
      saveState({ projects: updatedProjects });
      return updatedProjects;
    });
    setSelectedProject(updatedProject);
  };

  const handleDeleteProject = (projectId) => {
    const snapshot = projects;
    const deletedProject = projects.find(p => p.id === projectId);
    const updatedProjects = projects.filter(p => p.id !== projectId);

    setProjects(updatedProjects);
    setSelectedProject(null);
    saveState({ projects: updatedProjects });

    setUndoDelete({
      message: `Deleted "${deletedProject?.title || 'project'}"`,
      onUndo: () => {
        setProjects(snapshot);
        saveState({ projects: snapshot });
        setUndoDelete(null);
      }
    });
  };

  return (
    <>
      <ProjectList
        projects={projects}
        channels={channels}
        onSelectProject={setSelectedProject}
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
          onCreate={(newProject) => {
            setProjects(prevProjects => {
              const updatedProjects = [...prevProjects, newProject];
              saveState({ projects: updatedProjects });
              return updatedProjects;
            });
            setSelectedProject(newProject);
          }}
          onDelete={handleDeleteProject}
          onNotification={() => {}}
        />
      )}

      <UndoToast
        isVisible={!!undoDelete}
        message={undoDelete?.message || ''}
        onUndo={() => undoDelete?.onUndo?.()}
        onClose={() => setUndoDelete(null)}
      />
    </>
  );
}
