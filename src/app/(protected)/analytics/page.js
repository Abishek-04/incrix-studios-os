'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  CheckSquare,
  Instagram,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  MessageSquare,
  Shield,
  LogIn,
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4'
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AnalyticsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      // Check if user is Super Admin
      if (user.role !== 'superadmin') {
        window.location.href = '/dashboard';
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, timeRange]);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/overview?role=${currentUser.role}&range=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }

      // Load activity logs
      await loadActivityLogs();
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivityLogs(userId = null) {
    try {
      setActivityLoading(true);
      const params = new URLSearchParams({
        role: currentUser.role,
        limit: '50'
      });

      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/analytics/activity?${params}`);
      const result = await response.json();

      if (result.success) {
        setActivityLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  }

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#999]">This page is only accessible to Super Admins</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[#999]">Failed to load analytics data</div>
      </div>
    );
  }

  const roleColors = {
    superadmin: COLORS.danger,
    manager: COLORS.purple,
    creator: COLORS.primary,
    editor: COLORS.info,
    designer: COLORS.pink,
    developer: COLORS.success
  };

  const roleChartData = data.users.byRole.map(item => ({
    name: item._id || 'Unknown',
    value: item.count,
    active: item.active
  }));

  const projectTypeData = data.projects.byType.map(item => ({
    name: item._id || 'content',
    value: item.count
  }));

  const projectStatusData = data.projects.byStatus.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
            <p className="text-[#999] text-sm">
              Comprehensive overview of user activity and platform metrics
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#999]">Time Range:</span>
          {[
            { value: '7', label: '7 Days' },
            { value: '30', label: '30 Days' },
            { value: '90', label: '90 Days' },
            { value: '365', label: '1 Year' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#2a2a2a] text-[#999] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-sm text-[#999]">Total Users</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.users.total}</div>
          <div className="text-xs text-[#666] mt-1">
            {data.users.active} active, {data.users.inactive} inactive
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-sm text-[#999]">Total Projects</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.projects.total}</div>
          <div className="text-xs text-green-400 mt-1">
            +{data.projects.recent} in last {timeRange} days
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-sm text-[#999]">Tasks</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.tasks.total}</div>
          <div className="text-xs text-[#666] mt-1">
            {data.tasks.completionRate}% completion rate
          </div>
        </div>

        {/* Instagram DMs */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Instagram className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-sm text-[#999]">Instagram DMs</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.instagram.dmsSent}</div>
          <div className="text-xs text-[#666] mt-1">
            {data.instagram.activeAutomations} active automations
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Users by Role
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={roleChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Projects by Type */}
        <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Projects by Type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Activity Timeline (Last {timeRange} Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timelines.projects}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="_id" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="projects"
              stroke={COLORS.primary}
              strokeWidth={2}
              name="Projects Created"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1e1e] border border-amber-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div className="text-sm text-amber-400">Overdue Projects</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.projects.overdue}</div>
        </div>

        <div className="bg-[#1e1e1e] border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="text-sm text-red-400">Blocked Projects</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.projects.blocked}</div>
        </div>

        <div className="bg-[#1e1e1e] border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <div className="text-sm text-green-400">WhatsApp Users</div>
          </div>
          <div className="text-3xl font-bold text-white">{data.users.withWhatsApp}</div>
        </div>
      </div>

      {/* User Activity Table */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          User Activity Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="text-left p-3 text-sm font-medium text-[#999]">User</th>
                <th className="text-left p-3 text-sm font-medium text-[#999]">Role</th>
                <th className="text-left p-3 text-sm font-medium text-[#999]">Status</th>
                <th className="text-right p-3 text-sm font-medium text-[#999]">Projects</th>
                <th className="text-right p-3 text-sm font-medium text-[#999]">Tasks</th>
                <th className="text-right p-3 text-sm font-medium text-[#999]">Completed</th>
                <th className="text-center p-3 text-sm font-medium text-[#999]">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {data.userActivity.map(user => (
                <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#252525]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: user.avatarColor || '#666' }}
                      >
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-xs text-[#666]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs font-medium capitalize" style={{
                      backgroundColor: roleColors[user.role] + '20',
                      color: roleColors[user.role]
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {user.isActive ? (
                      <span className="text-green-400 text-sm">● Active</span>
                    ) : (
                      <span className="text-[#666] text-sm">● Inactive</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-white">{user.projectCount}</td>
                  <td className="p-3 text-right text-white">{user.taskCount}</td>
                  <td className="p-3 text-right text-green-400">{user.completedTasks}</td>
                  <td className="p-3 text-center">
                    {user.whatsappEnabled ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-[#666]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Recent Activity Logs
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedUserId || ''}
              onChange={(e) => {
                setSelectedUserId(e.target.value || null);
                loadActivityLogs(e.target.value || null);
              }}
              className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg text-sm border border-[#333] focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Users</option>
              {data?.userActivity?.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {activityLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center text-[#999] py-8">No activity logs found</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {activityLogs.map(log => {
              const actionIcons = {
                login: LogIn,
                logout: LogIn,
                login_failed: Shield,
                password_changed: Shield,
                settings_updated: SettingsIcon,
                notification_settings_updated: SettingsIcon,
                whatsapp_enabled: MessageSquare,
                user_created: Users,
                user_updated: Users,
                profile_updated: Users,
                instagram_connected: Instagram,
                automation_created: Activity,
                project_created: Briefcase,
                project_updated: Briefcase
              };

              const actionColors = {
                login: 'text-green-400 bg-green-500/10',
                logout: 'text-amber-400 bg-amber-500/10',
                login_failed: 'text-red-400 bg-red-500/10',
                password_changed: 'text-purple-400 bg-purple-500/10',
                settings_updated: 'text-blue-400 bg-blue-500/10',
                notification_settings_updated: 'text-blue-400 bg-blue-500/10',
                whatsapp_enabled: 'text-green-400 bg-green-500/10',
                user_created: 'text-indigo-400 bg-indigo-500/10',
                user_updated: 'text-indigo-400 bg-indigo-500/10',
                profile_updated: 'text-cyan-400 bg-cyan-500/10',
                instagram_connected: 'text-pink-400 bg-pink-500/10',
                automation_created: 'text-purple-400 bg-purple-500/10',
                project_created: 'text-green-400 bg-green-500/10',
                project_updated: 'text-blue-400 bg-blue-500/10'
              };

              const Icon = actionIcons[log.action] || Activity;
              const colorClass = actionColors[log.action] || 'text-[#999] bg-[#2a2a2a]';

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-[#151515] rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-white text-sm">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#666]">{log.userName}</span>
                          <span className="text-xs text-[#444]">•</span>
                          <span className="text-xs text-[#666] capitalize">{log.userRole}</span>
                          {log.ipAddress && log.ipAddress !== 'unknown' && (
                            <>
                              <span className="text-xs text-[#444]">•</span>
                              <span className="text-xs text-[#666]">{log.ipAddress}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-[#999]">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-[#666]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-[#666] font-mono bg-[#0a0a0a] p-2 rounded">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
