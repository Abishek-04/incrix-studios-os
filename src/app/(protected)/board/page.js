'use client';

import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import ProjectModal from '@/components/ProjectModal';
import { fetchState, saveState } from '@/services/api';

export default function BoardPage() {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

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
    const updatedProjects = projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    saveState({ projects: updatedProjects });
  };

  const handleDeleteProject = (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    setSelectedProject(null);
    saveState({ projects: updatedProjects });
  };

  return (
    <>
      <ProjectBoard
        projects={projects}
        channels={channels}
        onSelectProject={setSelectedProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onCreateProject={(newProject) => {
          setProjects([...projects, newProject]);
          saveState({ projects: [...projects, newProject] });
          setSelectedProject(newProject);
        }}
        searchQuery=""
        selectedMonth="all"
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
            setProjects([...projects, newProject]);
            saveState({ projects: [...projects, newProject] });
          }}
          onDelete={handleDeleteProject}
          onNotification={() => {}}
        />
      )}
    </>
  );
}
