'use client';

import { useEffect, useState } from 'react';
import { fetchState, saveState } from '@/services/api';
import { getProjectConfig } from '@/config/projectConfig';
import { ProjectType, DesignStage, Priority, Status } from '@/types';
import { Plus, Palette, Calendar, User, Filter, Search, Archive, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DesignProjectsPage() {
  const [allProjects, setAllProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterDesigner, setFilterDesigner] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const config = getProjectConfig('design');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchState();
        setAllProjects(data.projects || []);
        setUsers(data.users || []);

        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load design projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter only design projects
  const designProjects = allProjects.filter(p => p.projectType === ProjectType.Design);

  // Filter and search
  const filteredProjects = designProjects.filter(p => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.assignedDesigner?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Stage filter
    if (filterStage !== 'all' && p.stage !== filterStage) return false;

    // Designer filter
    if (filterDesigner !== 'all' && p.assignedDesigner !== filterDesigner) return false;

    // Don't show archived
    if (p.archived) return false;

    return true;
  });

  const handleCreateProject = () => {
    const newProject = {
      id: `design-${Date.now()}`,
      projectType: ProjectType.Design,
      title: '',
      description: '',
      assignedTo: currentUser?.name || '',
      assignedDesigner: currentUser?.name || '',
      status: Status.NotStarted,
      priority: Priority.Medium,
      stage: DesignStage.Briefing,
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
      lastUpdated: Date.now(),
      tasks: [],
      comments: [],
      archived: false,
      // Design-specific fields
      type: '',
      briefing: '',
      conceptNotes: '',
      reviewNotes: '',
      designFiles: [],
      dimensions: '',
      colorScheme: '',
      brandGuidelines: ''
    };

    setSelectedProject(newProject);
    setShowModal(true);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleSaveProject = async (project) => {
    let updatedProjects;
    const existingIndex = allProjects.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
      // Update existing
      updatedProjects = [...allProjects];
      updatedProjects[existingIndex] = { ...project, lastUpdated: Date.now() };
    } else {
      // Create new
      updatedProjects = [...allProjects, { ...project, lastUpdated: Date.now() }];
    }

    setAllProjects(updatedProjects);
    await saveState({ projects: updatedProjects });
    setShowModal(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this design project?')) return;

    const updatedProjects = allProjects.filter(p => p.id !== projectId);
    setAllProjects(updatedProjects);
    await saveState({ projects: updatedProjects });
    setShowModal(false);
    setSelectedProject(null);
  };

  const designers = users.filter(u => u.role === 'designer' || u.role === 'manager');
  const uniqueDesigners = [...new Set(designProjects.map(p => p.assignedDesigner))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading design projects...</div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Check permission
  if (!['superadmin', 'manager', 'designer'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Palette className="w-16 h-16 text-[#666] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#999]">You don't have permission to view design projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Palette className="w-8 h-8 text-purple-400" />
            Design Projects
          </h1>
          <p className="text-[#666]">Manage design work, mockups, and creative assets.</p>
        </div>

        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Design Project</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="flex items-center bg-[#151515] border border-[#222] rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-[#999]" />
          <input
            type="text"
            placeholder="Search design projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-[#999]"
          />
        </div>

        {/* Stage Filter */}
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Stages</option>
          {config.stages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>

        {/* Designer Filter */}
        <select
          value={filterDesigner}
          onChange={(e) => setFilterDesigner(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2f2f2f] text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Designers</option>
          {uniqueDesigners.map(designer => (
            <option key={designer} value={designer}>{designer}</option>
          ))}
        </select>
      </div>

      {/* Project Count */}
      <div className="text-[#999] text-sm mb-4">
        Showing {filteredProjects.length} of {designProjects.length} design projects
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Palette className="w-16 h-16 text-[#333] mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No design projects found</h3>
            <p className="text-[#666] mb-4">
              {searchQuery || filterStage !== 'all' || filterDesigner !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first design project to get started'}
            </p>
            {!(searchQuery || filterStage !== 'all' || filterDesigner !== 'all') && (
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Create Design Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProjects.map(project => (
                <DesignProjectCard
                  key={project.id}
                  project={project}
                  config={config}
                  onClick={() => handleSelectProject(project)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedProject && (
        <DesignProjectModal
          project={selectedProject}
          config={config}
          designers={designers}
          currentUser={currentUser}
          allProjects={allProjects}
          onClose={() => {
            setShowModal(false);
            setSelectedProject(null);
          }}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />
      )}
    </div>
  );
}

// Design Project Card Component
function DesignProjectCard({ project, config, onClick }) {
  const stageColor = config.stageColors[project.stage] || 'gray';
  const colorMap = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const daysUntilDue = Math.ceil((project.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">
            {project.title || 'Untitled Design'}
          </h3>
          {project.type && (
            <span className="text-xs text-[#999] capitalize">{project.type.replace('-', ' ')}</span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-md border ${colorMap[stageColor]}`}>
          {project.stage}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-[#666] mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-xs text-[#999] mb-3">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>{project.assignedDesigner}</span>
        </div>
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400' : isUrgent ? 'text-amber-400' : ''}`}>
          <Calendar size={12} />
          <span>
            {isOverdue
              ? `${Math.abs(daysUntilDue)}d overdue`
              : daysUntilDue === 0
              ? 'Due today'
              : `${daysUntilDue}d left`
            }
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#2f2f2f]">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-md ${
            project.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
            project.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {project.priority}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-md ${
            project.status === 'Done' ? 'bg-emerald-500/20 text-emerald-400' :
            project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
            project.status === 'Blocked' ? 'bg-rose-500/20 text-rose-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {project.status}
          </span>
        </div>
        {project.designFiles?.length > 0 && (
          <span className="text-xs text-purple-400">{project.designFiles.length} files</span>
        )}
      </div>
    </motion.div>
  );
}

// Simplified Design Project Modal (placeholder - will enhance later)
function DesignProjectModal({ project, config, designers, currentUser, allProjects, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({ ...project });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isNew = !allProjects.some(p => p.id === project.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2f2f2f] p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-purple-400" />
              {isNew ? 'New Design Project' : 'Edit Design Project'}
            </h2>
            <button type="button" onClick={onClose} className="text-[#999] hover:text-white">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Design Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select type...</option>
                {config.fields.type.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Designer */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Designer *</label>
              <select
                value={formData.assignedDesigner}
                onChange={(e) => setFormData({ ...formData, assignedDesigner: e.target.value, assignedTo: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {designers.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Stage, Priority, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {config.stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {config.fields.priority.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {config.fields.status.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Due Date *</label>
              <input
                type="date"
                value={new Date(formData.dueDate).toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value).getTime() })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Briefing */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Design Brief</label>
              <textarea
                value={formData.briefing}
                onChange={(e) => setFormData({ ...formData, briefing: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Client requirements, target audience, purpose..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#2f2f2f] p-6 flex items-center justify-between">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => onDelete(project.id)}
                  className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[#999] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {isNew ? 'Create Project' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
