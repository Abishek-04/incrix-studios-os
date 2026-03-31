'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '@/components/ProjectList';
import ProjectModal from '@/components/ProjectModal';
import UndoToast from '@/components/ui/UndoToast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { fetchState, createProject, updateProject, deleteProject, fetchWithAuth } from '@/services/api';
import { useToast } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCsv } from '@/utils/exportCsv';
import { Download } from 'lucide-react';

export default function ProjectsPage() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [devDesignProjects, setDevDesignProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [undoDelete, setUndoDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const showToast = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchState();
        setProjects(data.projects || []);
        setDevDesignProjects(data.devDesignProjects || []);
        setChannels(data.channels || []);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Merge all projects based on type filter
  const allProjects = (() => {
    if (typeFilter === 'mywork') {
      return projects.filter(p =>
        p.creator === currentUser?.name ||
        p.editor === currentUser?.name ||
        (Array.isArray(p.editors) && p.editors.includes(currentUser?.name))
      );
    }
    if (typeFilter === 'content') return projects;
    if (typeFilter === 'dev') return devDesignProjects.filter(p => p.projectType === 'dev');
    if (typeFilter === 'design') return devDesignProjects.filter(p => p.projectType === 'design');
    // 'all' — merge content + dev + design, normalize dev/design to look like content projects
    return [
      ...projects,
      ...devDesignProjects.map(p => ({
        ...p,
        creator: p.assignedTo || p.assignedDeveloper || p.assignedDesigner || '',
        editor: '',
        platform: p.projectType === 'dev' ? 'dev' : 'design',
        contentFormat: p.projectType,
        _isDevDesign: true,
      }))
    ];
  })();

  const handleUpdateProject = async (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject(updatedProject);

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
    } catch (error) {
      console.error('Project delete error:', error);
      showToast('Failed to delete project');
      if (deletedProject) {
        setProjects((prevProjects) => {
          const exists = prevProjects.some((p) => p.id === deletedProject.id);
          return exists ? prevProjects : [...prevProjects, deletedProject];
        });
      }
    }
  };

  const handleCreateProject = async (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);

    try {
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
    } catch (error) {
      console.error('Project create error:', error);
      showToast('Failed to create project');
      setProjects((prevProjects) => prevProjects.filter((p) => p.id !== newProject.id));
      setSelectedProject(null);
      return { success: false, error: 'Create failed' };
    }
  };

  if (loading || !currentUser) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Type Filter + Export */}
      <div className="px-4 md:px-8 pt-4 flex gap-2 flex-wrap items-center">
        <button
            onClick={() => setTypeFilter(typeFilter === 'mywork' ? 'all' : 'mywork')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'mywork'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1e1e1e] text-[#888] hover:text-white border border-[#333]'
            }`}
        >
            My Work
        </button>
        {[
          { value: 'all', label: 'All' },
          { value: 'content', label: 'Content' },
          { value: 'dev', label: 'Dev' },
          { value: 'design', label: 'Design' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1e1e1e] text-[#888] hover:text-white border border-[#333]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {currentUser?.role === 'superadmin' && (
          <button onClick={() => {
            const all = [...projects, ...devDesignProjects];
            exportToCsv(all.map(p => ({
              title: p.title, stage: p.stage, platform: p.platform, creator: p.creator,
              editor: p.editor || '', status: p.status, priority: p.priority,
              dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '',
              type: p.projectType || 'content',
            })), 'projects', [
              { key: 'title', label: 'Title' }, { key: 'stage', label: 'Stage' }, { key: 'platform', label: 'Platform' },
              { key: 'creator', label: 'Creator' }, { key: 'editor', label: 'Editor' }, { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' }, { key: 'dueDate', label: 'Due Date' }, { key: 'type', label: 'Type' },
            ]);
          }} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      <ProjectList
        projects={(() => {
          const r = Array.isArray(currentUser.roles) && currentUser.roles.length ? currentUser.roles : [currentUser.role];
          if (r.some(x => ['superadmin', 'manager'].includes(x))) return allProjects;
          return allProjects.filter(p => p.creator === currentUser.name || (p.editors || []).includes(currentUser.name) || p.editor === currentUser.name || p.assignedTo === currentUser.id || p.assignedDesigner === currentUser.name || p.assignedDeveloper === currentUser.name);
        })()}
        channels={channels}
        onSelectProject={(project) => {
          if (project._isDevDesign) return;
          router.push(`/projects/${project.id}`);
        }}
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
              body: JSON.stringify({ deletedItemId: undoDelete.deletedItemId, currentUser })
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
