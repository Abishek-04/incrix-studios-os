'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, BarChart3, Zap, MessageSquare, Filter, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AutomationBuilder({ channel, selectedMedia, currentUser }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [viewingLogs, setViewingLogs] = useState(null);

  useEffect(() => {
    if (channel) {
      loadRules();
    }
  }, [channel]);

  async function loadRules() {
    if (!channel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/instagram/automations?channelId=${channel.id}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingRule({
      id: null,
      channelId: channel.id,
      mediaId: selectedMedia?.igMediaId || null,
      name: '',
      status: 'draft',
      trigger: {
        type: 'new_comment',
        keywords: [],
        excludeKeywords: [],
      },
      response: {
        messageTemplate: '',
        includeFiles: [],
        delaySeconds: 5,
      },
      deduplication: {
        enabled: true,
        windowHours: 24,
      },
      dailyLimit: 100,
    });
    setShowBuilder(true);
  }

  function handleEdit(rule) {
    setEditingRule({ ...rule });
    setShowBuilder(true);
  }

  async function handleSave(ruleData) {
    try {
      const isNew = !ruleData.id;
      const url = isNew ? '/api/instagram/automations' : `/api/instagram/automations/${ruleData.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const body = isNew
        ? { ...ruleData, createdBy: currentUser.id }
        : ruleData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadRules();
        setShowBuilder(false);
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  }

  async function handleDelete(ruleId) {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/instagram/automations/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  }

  async function handleToggleStatus(rule) {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch(`/api/instagram/automations/${rule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  }

  if (!channel) {
    return (
      <div className="text-center text-[#999] py-12">
        Select an Instagram account from the Accounts tab
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Automation Rules</h3>
          <p className="text-sm text-[#999]">Automatically send DMs when users comment</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Automation
        </button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-12 text-center">
          <Zap className="w-16 h-16 text-[#666] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Automations Yet</h3>
          <p className="text-[#999] mb-6">
            Create your first automation to start responding to comments automatically
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Create Automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="bg-[#1e1e1e] border border-[#333] rounded-lg p-4 hover:border-[#444] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-semibold">{rule.name}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : rule.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-[#2a2a2a] text-[#666]'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#999] mb-3">
                    {rule.mediaId ? 'Specific post' : 'All posts'} •{' '}
                    {rule.trigger.type === 'keyword_comment'
                      ? `Keywords: ${rule.trigger.keywords.join(', ')}`
                      : 'Any comment'}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-[#666]">Triggered:</span>{' '}
                      <span className="text-white font-medium">{rule.stats?.totalTriggered || 0}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">Sent:</span>{' '}
                      <span className="text-green-400 font-medium">{rule.stats?.totalSent || 0}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">Failed:</span>{' '}
                      <span className="text-red-400 font-medium">{rule.stats?.totalFailed || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingLogs(rule)}
                    className="p-2 text-[#999] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                    title="View logs"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-[#999] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(rule)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.status === 'active'
                        ? 'text-amber-400 hover:bg-amber-500/10'
                        : 'text-green-400 hover:bg-green-500/10'
                    }`}
                    title={rule.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {rule.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Automation Builder Modal */}
      {showBuilder && editingRule && (
        <AutomationBuilderModal
          rule={editingRule}
          onSave={handleSave}
          onClose={() => {
            setShowBuilder(false);
            setEditingRule(null);
          }}
        />
      )}

      {/* Logs Viewer */}
      {viewingLogs && (
        <LogsViewer
          rule={viewingLogs}
          onClose={() => setViewingLogs(null)}
        />
      )}
    </div>
  );
}

// Automation Builder Modal Component
function AutomationBuilderModal({ rule, onSave, onClose }) {
  const [formData, setFormData] = useState(rule);
  const [currentStep, setCurrentStep] = useState(1);

  function handleNext() {
    setCurrentStep(s => Math.min(4, s + 1));
  }

  function handleBack() {
    setCurrentStep(s => Math.max(1, s - 1));
  }

  function handleSubmit() {
    onSave(formData);
  }

  function addKeyword(keyword) {
    if (keyword && !formData.trigger.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        trigger: {
          ...formData.trigger,
          keywords: [...formData.trigger.keywords, keyword],
        },
      });
    }
  }

  function removeKeyword(keyword) {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        keywords: formData.trigger.keywords.filter(k => k !== keyword),
      },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#333] p-6">
          <h3 className="text-xl font-semibold text-white">
            {rule.id ? 'Edit Automation' : 'Create Automation'}
          </h3>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`flex-1 h-1 rounded ${
                  step <= currentStep ? 'bg-indigo-600' : 'bg-[#333]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Step 1: Basic Info</h4>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Message for Product Posts"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Apply to
                </label>
                <div className="text-sm text-white">
                  {formData.mediaId ? 'Selected post only' : 'All posts on this account'}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Step 2: Trigger</h4>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Trigger Type
                </label>
                <select
                  value={formData.trigger.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trigger: { ...formData.trigger, type: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="new_comment">Any new comment</option>
                  <option value="keyword_comment">Comments containing keywords</option>
                </select>
              </div>

              {formData.trigger.type === 'keyword_comment' && (
                <div>
                  <label className="block text-sm font-medium text-[#999] mb-2">
                    Keywords (trigger if comment contains any)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Type a keyword and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addKeyword(e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.trigger.keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm flex items-center gap-2"
                      >
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Step 3: DM Response</h4>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Message Template
                </label>
                <textarea
                  value={formData.response.messageTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      response: { ...formData.response, messageTemplate: e.target.value },
                    })
                  }
                  placeholder="Hi {{username}}! Thanks for commenting on {{post_link}}..."
                  rows={6}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="mt-2 text-xs text-[#666]">
                  Variables: {`{{username}}, {{comment_text}}, {{post_link}}, {{post_caption}}`}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Delay before sending (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.response.delaySeconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      response: { ...formData.response, delaySeconds: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Step 4: Settings</h4>
              <div>
                <label className="block text-sm font-medium text-[#999] mb-2">
                  Daily Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.deduplication.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deduplication: { ...formData.deduplication, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-white">Enable deduplication</span>
                </label>
                {formData.deduplication.enabled && (
                  <div className="mt-2 ml-6">
                    <label className="block text-sm text-[#999] mb-1">
                      Don't message same user within (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={formData.deduplication.windowHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deduplication: {
                            ...formData.deduplication,
                            windowHours: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1e1e1e] border-t border-[#333] p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#999] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !formData.name) ||
                  (currentStep === 3 && !formData.response.messageTemplate)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                {rule.id ? 'Update' : 'Create'} Automation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Logs Viewer Component
function LogsViewer({ rule, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/instagram/automations/${rule.id}/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusColors = {
    sent: 'text-green-400 bg-green-500/10',
    failed: 'text-red-400 bg-red-500/10',
    queued: 'text-blue-400 bg-blue-500/10',
    deduped: 'text-amber-400 bg-amber-500/10',
    rate_limited: 'text-orange-400 bg-orange-500/10',
    keyword_filtered: 'text-gray-400 bg-gray-500/10',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#333] p-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Activity Logs: {rule.name}</h3>
          <button onClick={onClose} className="text-[#999] hover:text-white text-2xl">×</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-[#333] flex gap-2">
          {['', 'sent', 'failed', 'queued', 'deduped', 'rate_limited', 'keyword_filtered'].map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#2a2a2a] text-[#999] hover:text-white'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-[#999]">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-[#999]">No logs found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#151515] sticky top-0">
                <tr className="text-left text-[#999]">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Comment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {logs.map(log => (
                  <tr key={log.id || log._id} className="hover:bg-[#222]">
                    <td className="px-6 py-3 text-[#999] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-white">
                      @{log.igUsername || 'unknown'}
                    </td>
                    <td className="px-6 py-3 text-[#ccc] max-w-[200px] truncate">
                      {log.commentText || '-'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[log.dmStatus] || 'text-gray-400 bg-gray-500/10'}`}>
                        {log.dmStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#999] whitespace-nowrap">
                      {log.responseTimeMs ? `${log.responseTimeMs}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="border-t border-[#333] px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-[#999]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-[#2a2a2a] text-white rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1 bg-[#2a2a2a] text-white rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
