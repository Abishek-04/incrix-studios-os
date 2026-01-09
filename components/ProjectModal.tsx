import React, { useState, useEffect } from 'react';
import { Project, Role, Stage, Status, Channel, Platform } from '../types';
import { fetchSocialMetrics } from '../services/socialService';
import { X, Sparkles, CheckSquare, MessageSquare, FileText, Send, Loader2, Plus, Archive, RefreshCw, Link as LinkIcon, ExternalLink, ChevronDown, Globe, Share2, MessageCircle, BarChart2, TrendingUp, Copy, RefreshCcw, Info } from 'lucide-react';

interface ProjectModalProps {
  project: Project;
  currentUserRole: Role;
  channels: Channel[];
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, currentUserRole, channels, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'discussion' | 'performance'>('overview');
  const [localProject, setLocalProject] = useState<Project>(project);
  const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  const handleSave = () => {
    onUpdate({
      ...localProject,
      lastUpdated: Date.now()
    });
  };

  const handleToggleArchive = () => {
    const updated = { ...localProject, archived: !localProject.archived, lastUpdated: Date.now() };
    setLocalProject(updated);
    onUpdate(updated);
    if (updated.archived) {
      onClose(); // Close modal if archiving
    }
  };

  const handleChannelChange = (channelId: string) => {
    const selectedChannel = channels.find(c => c.id === channelId);
    if (selectedChannel) {
      const updated = {
        ...localProject,
        channelId: selectedChannel.id,
        platform: selectedChannel.platform,
        lastUpdated: Date.now()
      };
      setLocalProject(updated);
      onUpdate(updated);
    }
  };



  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `manual-${Date.now()}`,
      text: newTaskText.trim(),
      done: false
    };
    const updated = {
      ...localProject,
      tasks: [...localProject.tasks, newTask],
      lastUpdated: Date.now()
    };
    setLocalProject(updated);
    onUpdate(updated);
    setNewTaskText('');
  };



  const toggleTask = (taskId: string) => {
    const updatedTasks = localProject.tasks.map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    const updated = { ...localProject, tasks: updatedTasks, lastUpdated: Date.now() };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const comment = {
      id: Date.now().toString(),
      author: currentUserRole,
      text: newMessage,
      timestamp: Date.now()
    };
    const updated = {
      ...localProject,
      comments: [...localProject.comments, comment],
      lastUpdated: Date.now()
    };
    setLocalProject(updated);
    onUpdate(updated);
    setNewMessage('');
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      alert(`📢 Broadcast Sent!\n\nStatus: ${localProject.status}\nStage: ${localProject.stage}\n\nDelivered to: WhatsApp Group & Email List.`);
    }, 1500);
  };

  const handleMetricUpdate = (field: keyof typeof localProject.metrics, value: string) => {
    const currentMetrics = localProject.metrics || { views: 0, likes: 0, comments: 0, retention: '0%', lastUpdated: Date.now() };

    let updatedMetrics;
    if (field === 'retention') {
      updatedMetrics = { ...currentMetrics, [field]: value, lastUpdated: Date.now() };
    } else {
      updatedMetrics = { ...currentMetrics, [field]: parseInt(value) || 0, lastUpdated: Date.now() };
    }

    const updated = { ...localProject, metrics: updatedMetrics };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const handleFetchMetrics = async () => {
    if (!localProject.publishedLink) {
      alert("Please add a Published Link to fetch data.");
      return;
    }

    setIsFetchingMetrics(true);
    try {
      const data = await fetchSocialMetrics(localProject.publishedLink, localProject.platform);
      const updatedMetrics = {
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        retention: data.retention,
        sources: data.sources, // Store grounding sources
        lastUpdated: Date.now()
      };
      const updated = { ...localProject, metrics: updatedMetrics };
      setLocalProject(updated);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
      alert("Could not fetch metrics. Please check the URL.");
    } finally {
      setIsFetchingMetrics(false);
    }
  };

  const handleRepurpose = () => {
    alert("🚀 Repurposing Started!\n\nA new project 'Short: " + localProject.title + "' has been added to the Backlog.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#191919] border border-[#2f2f2f] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-[#2f2f2f] flex justify-between items-start bg-[#1e1e1e]">
          <div className="flex-1 mr-8">
            <div className="flex items-center space-x-3 mb-3">
              {/* Channel Selector */}
              <div className="relative group min-w-[200px]">
                <div className="absolute left-2.5 top-2 text-[#888] pointer-events-none">
                  <Globe size={14} />
                </div>
                <select
                  value={localProject.channelId || ''}
                  onChange={(e) => handleChannelChange(e.target.value)}
                  className="w-full appearance-none bg-[#252525] border border-[#333] text-white text-xs font-medium rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-[#2a2a2a] transition-colors uppercase tracking-wide"
                >
                  <option value="" disabled>Select Channel</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.platform})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-2 pointer-events-none text-[#666]">
                  <ChevronDown size={14} />
                </div>
              </div>

              <span className="text-[#555] text-xs font-mono">{localProject.id}</span>
              {localProject.archived && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-[#333] text-[#888] font-mono uppercase">Archived</span>
              )}
            </div>

            <input
              type="text"
              value={localProject.title}
              onChange={(e) => setLocalProject({ ...localProject, title: e.target.value })}
              onBlur={handleSave}
              className="bg-transparent text-2xl font-bold text-white w-full border-none focus:outline-none focus:ring-0 p-0 placeholder-[#444]"
              placeholder="Project Title"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBroadcast}
              className="p-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all flex items-center space-x-2 text-xs font-medium"
              title="Send Update to WhatsApp/Email"
            >
              {isBroadcasting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              <span className="hidden sm:inline">Broadcast</span>
            </button>
            <div className="w-px h-6 bg-[#2f2f2f] mx-2"></div>
            <button
              onClick={handleToggleArchive}
              className={`p-2 rounded-lg transition-colors flex items-center space-x-2 text-xs font-medium
                    ${localProject.archived ? 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20' : 'bg-[#252525] text-[#666] hover:text-white hover:bg-[#333]'}
                `}
              title={localProject.archived ? "Unarchive Project" : "Archive Project"}
            >
              {localProject.archived ? <RefreshCw size={18} /> : <Archive size={18} />}
              <span className="hidden sm:inline">{localProject.archived ? 'Unarchive' : 'Archive'}</span>
            </button>
            <div className="w-px h-6 bg-[#2f2f2f] mx-2"></div>
            <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2f2f2f] bg-[#191919] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-all border-b-2 min-w-[120px]
            ${activeTab === 'overview' ? 'border-indigo-500 text-white bg-[#222]' : 'border-transparent text-[#666] hover:text-[#999]'}`}>
            <FileText size={16} /> <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-all border-b-2 min-w-[120px]
            ${activeTab === 'production' ? 'border-indigo-500 text-white bg-[#222]' : 'border-transparent text-[#666] hover:text-[#999]'}`}>
            <CheckSquare size={16} /> <span>Production</span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-all border-b-2 min-w-[120px]
            ${activeTab === 'discussion' ? 'border-indigo-500 text-white bg-[#222]' : 'border-transparent text-[#666] hover:text-[#999]'}`}>
            <MessageSquare size={16} /> <span>Discussion</span>
          </button>
          {localProject.stage === Stage.Done && (
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-all border-b-2 min-w-[120px] animate-in slide-in-from-right-4
                ${activeTab === 'performance' ? 'border-emerald-500 text-emerald-400 bg-[#222]' : 'border-transparent text-emerald-600/70 hover:text-emerald-500'}`}>
              <BarChart2 size={16} /> <span>Performance</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#151515]">

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase">Topic / Brief</label>
                <textarea
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-[#ddd] focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
                  value={localProject.topic}
                  onChange={(e) => setLocalProject({ ...localProject, topic: e.target.value })}
                  onBlur={handleSave}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-[#666] uppercase">Script Editor</label>
                </div>
                <textarea
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-4 text-sm text-[#eee] font-sans leading-relaxed min-h-[300px] focus:border-indigo-500 focus:outline-none"
                  value={localProject.script}
                  onChange={(e) => setLocalProject({ ...localProject, script: e.target.value })}
                  onBlur={handleSave}
                  placeholder="Script content will appear here..."
                />
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-8">
              {/* MoGraph Callout */}
              <div className="flex items-center space-x-3 p-4 border border-[#2f2f2f] rounded-xl bg-[#1a1a1a]">
                <input
                  type="checkbox"
                  checked={localProject.hasMographNeeds}
                  onChange={(e) => {
                    const updated = { ...localProject, hasMographNeeds: e.target.checked, lastUpdated: Date.now() };
                    setLocalProject(updated);
                    onUpdate(updated);
                  }}
                  className="w-5 h-5 rounded bg-[#333] border-[#444] text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <div>
                  <h4 className="text-sm font-medium text-white">Motion Graphics Required</h4>
                  <p className="text-xs text-[#666]">Enable to flag this project for the MoGraph team.</p>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-white">Stage Checklist</h3>
                </div>
                <div className="space-y-2">
                  {localProject.tasks.map(task => (
                    <div key={task.id} className="flex items-start space-x-3 group">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors
                                ${task.done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-[#444] hover:border-[#666]'}`}>
                        {task.done && <div className="w-2 h-2 bg-current rounded-sm" />}
                      </button>
                      <span className={`text-sm ${task.done ? 'text-[#444] line-through' : 'text-[#ccc]'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}

                  {/* Manual Task Input */}
                  <div className="flex items-center space-x-3 group pt-1">
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskText.trim()}
                      className="w-4 h-4 rounded border border-[#333] flex items-center justify-center transition-colors hover:border-[#666] text-[#666] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-[#666]">
                      <Plus size={10} />
                    </button>
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="Add a new task..."
                      className="flex-1 bg-transparent border-none text-sm text-[#eee] placeholder-[#444] focus:outline-none focus:placeholder-[#666] h-6"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Notes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-white">Technical Notes</h3>
                </div>
                <textarea
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-[#ccc] focus:border-indigo-500 focus:outline-none min-h-[150px]"
                  placeholder="Enter technical specifications, color codes, or assembly notes..."
                  value={localProject.technicalNotes}
                  onChange={(e) => setLocalProject({ ...localProject, technicalNotes: e.target.value })}
                  onBlur={handleSave}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2f2f2f]">
                {/* Review Link Validation */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white flex items-center"><LinkIcon size={14} className="mr-2" /> Review Link</h3>
                  <input
                    type="text"
                    placeholder="Frame.io / Drive Link..."
                    className={`w-full bg-[#1e1e1e] border rounded-lg p-3 text-sm text-[#eee] focus:outline-none transition-colors
                            ${!localProject.reviewLink && localProject.stage === Stage.Review ? 'border-rose-500/50' : 'border-[#333] focus:border-indigo-500'}`}
                    value={localProject.reviewLink || ''}
                    onChange={(e) => {
                      const updated = { ...localProject, reviewLink: e.target.value, lastUpdated: Date.now() };
                      setLocalProject(updated);
                      onUpdate(updated);
                    }}
                  />
                  {!localProject.reviewLink && localProject.stage === Stage.Review && (
                    <p className="text-xs text-rose-500">Required to complete Review stage.</p>
                  )}
                </div>

                {/* Published Link */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white flex items-center"><ExternalLink size={14} className="mr-2" /> Published Link</h3>
                  <input
                    type="text"
                    placeholder="Instagram / YouTube URL..."
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-[#eee] focus:border-indigo-500 focus:outline-none transition-colors"
                    value={localProject.publishedLink || ''}
                    onChange={(e) => {
                      const updated = { ...localProject, publishedLink: e.target.value, lastUpdated: Date.now() };
                      setLocalProject(updated);
                      onUpdate(updated);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 p-6 rounded-2xl border border-emerald-500/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-emerald-400 font-semibold text-lg flex items-center mb-1">
                      <TrendingUp size={20} className="mr-2" /> Performance Tracker
                    </h3>
                    <p className="text-emerald-200/60 text-sm">Track real-time engagement and growth.</p>
                  </div>
                  {localProject.metrics?.lastUpdated && (
                    <span className="text-[10px] text-emerald-500/50 font-mono">Last updated: {new Date(localProject.metrics.lastUpdated).toLocaleDateString()} {new Date(localProject.metrics.lastUpdated).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>

              {/* Metric Source Control */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-[#666] uppercase tracking-wide flex items-center">
                    <ExternalLink size={12} className="mr-1" /> Published Link (Source)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Paste live video URL..."
                      className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-[#eee] focus:border-indigo-500 outline-none"
                      value={localProject.publishedLink || ''}
                      onChange={(e) => {
                        const updated = { ...localProject, publishedLink: e.target.value, lastUpdated: Date.now() };
                        setLocalProject(updated);
                        onUpdate(updated);
                      }}
                    />
                    <button
                      onClick={handleFetchMetrics}
                      disabled={isFetchingMetrics || !localProject.publishedLink}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#333] disabled:text-[#666] text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      {isFetchingMetrics ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                      <span>{isFetchingMetrics ? 'Fetching...' : 'Fetch Live Data'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#666] uppercase tracking-wide">Total Views</label>
                  <input
                    type="number"
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-xl font-bold text-white focus:border-indigo-500 outline-none transition-all focus:bg-[#222]"
                    placeholder="0"
                    value={localProject.metrics?.views || ''}
                    onChange={(e) => handleMetricUpdate('views', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#666] uppercase tracking-wide">Likes</label>
                  <input
                    type="number"
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-xl font-bold text-white focus:border-indigo-500 outline-none transition-all focus:bg-[#222]"
                    placeholder="0"
                    value={localProject.metrics?.likes || ''}
                    onChange={(e) => handleMetricUpdate('likes', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#666] uppercase tracking-wide">Comments</label>
                  <input
                    type="number"
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-xl font-bold text-white focus:border-indigo-500 outline-none transition-all focus:bg-[#222]"
                    placeholder="0"
                    value={localProject.metrics?.comments || ''}
                    onChange={(e) => handleMetricUpdate('comments', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#666] uppercase tracking-wide">Retention %</label>
                  <input
                    type="text"
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-xl font-bold text-white focus:border-indigo-500 outline-none transition-all focus:bg-[#222]"
                    placeholder="0%"
                    value={localProject.metrics?.retention || ''}
                    onChange={(e) => handleMetricUpdate('retention', e.target.value)}
                  />
                </div>
              </div>

              {localProject.metrics?.sources && localProject.metrics.sources.length > 0 && (
                <div className="bg-[#151515] rounded-xl border border-[#2a2a2a] p-4">
                  <h5 className="text-xs font-medium text-[#888] flex items-center mb-2"><Info size={12} className="mr-1.5" /> Verified Sources</h5>
                  <ul className="space-y-1">
                    {localProject.metrics.sources.map((source, idx) => (
                      <li key={idx} className="text-xs truncate">
                        <a href={source} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                          {source}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-8 border-t border-[#2f2f2f] flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-medium mb-1">Repurpose Content</h4>
                  <p className="text-sm text-[#666]">Convert this high-performing asset into Shorts/Reels.</p>
                </div>
                <button
                  onClick={handleRepurpose}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#252525] hover:bg-[#333] text-white rounded-lg transition-colors border border-[#333]">
                  <Copy size={16} /> <span>Create Short from this</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                {localProject.comments.length === 0 ? (
                  <div className="text-center text-[#444] mt-10 text-sm">No discussion yet.</div>
                ) : (
                  localProject.comments.map(comment => (
                    <div key={comment.id} className={`flex flex-col ${comment.author === currentUserRole ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="text-xs font-bold text-[#888] uppercase tracking-wider">{comment.author}</span>
                        <span className="text-[10px] text-[#444] font-mono">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`max-w-[80%] rounded-lg p-3 text-sm ${comment.author === currentUserRole ? 'bg-indigo-600 text-white' : 'bg-[#222] text-[#ccc]'}`}>
                        {comment.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center space-x-2 pt-4 border-t border-[#2f2f2f]">
                <input
                  type="text"
                  className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProjectModal;