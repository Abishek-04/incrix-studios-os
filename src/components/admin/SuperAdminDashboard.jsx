'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, CheckCircle, Clock, TrendingUp, Download,
  Calendar, FileText, Activity, AlertCircle, Award, Target,
  ArrowUp, ArrowDown, Minus, Filter, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SuperAdminDashboard = ({ projects = [], tasks = [], users = [], activityLogs = [] }) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Filter data by time range
    const filteredProjects = projects.filter(p => new Date(p.createdAt || p.lastUpdated) >= startDate);
    const filteredTasks = tasks.filter(t => new Date(t.createdAt || Date.now()) >= startDate);
    const filteredActivities = activityLogs.filter(a => new Date(a.timestamp) >= startDate);

    // Project Analytics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.stage === 'Done').length;
    const inProgressProjects = projects.filter(p => ['Scripting', 'Shooting', 'Editing', 'Review'].includes(p.stage)).length;
    const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects * 100).toFixed(1) : 0;

    // Task Analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done || t.status === 'done').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now && !t.done && t.status !== 'done';
    }).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    // User Analytics
    const activeUsers = users.filter(u => {
      // Check if user has activity in the time range
      return filteredActivities.some(a => a.userId === u.id);
    }).length;

    // Team Performance by Role
    const performanceByRole = {};
    users.forEach(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id || t.userId === user.id);
      const userCompletedTasks = userTasks.filter(t => t.done || t.status === 'done');

      if (!performanceByRole[user.role]) {
        performanceByRole[user.role] = {
          role: user.role,
          totalTasks: 0,
          completedTasks: 0,
          users: 0
        };
      }

      performanceByRole[user.role].totalTasks += userTasks.length;
      performanceByRole[user.role].completedTasks += userCompletedTasks.length;
      performanceByRole[user.role].users += 1;
    });

    const rolePerformance = Object.values(performanceByRole).map(rp => ({
      ...rp,
      completionRate: rp.totalTasks > 0 ? (rp.completedTasks / rp.totalTasks * 100).toFixed(1) : 0
    }));

    // Daily Activity (last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivities = activityLogs.filter(a => {
        const activityDate = new Date(a.timestamp).toISOString().split('T')[0];
        return activityDate === dateStr;
      });

      dailyActivity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        activities: dayActivities.length,
        tasks: dayActivities.filter(a => a.type === 'task').length,
        projects: dayActivities.filter(a => a.type === 'project').length
      });
    }

    // Project Status Distribution
    const statusDistribution = [
      { name: 'Backlog', value: projects.filter(p => p.stage === 'Backlog').length, color: '#6b7280' },
      { name: 'Scripting', value: projects.filter(p => p.stage === 'Scripting').length, color: '#3b82f6' },
      { name: 'Shooting', value: projects.filter(p => p.stage === 'Shooting').length, color: '#f59e0b' },
      { name: 'Editing', value: projects.filter(p => p.stage === 'Editing').length, color: '#8b5cf6' },
      { name: 'Review', value: projects.filter(p => p.stage === 'Review').length, color: '#ec4899' },
      { name: 'Done', value: projects.filter(p => p.stage === 'Done').length, color: '#10b981' }
    ];

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      projectCompletionRate,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate,
      activeUsers,
      totalUsers: users.length,
      rolePerformance,
      dailyActivity,
      statusDistribution,
      filteredProjects,
      filteredTasks
    };
  }, [projects, tasks, users, activityLogs, timeRange]);

  const handleExportReport = (format) => {
    // TODO: Implement export functionality
    console.log(`Exporting ${timeRange} report as ${format}`);
    alert(`Report export as ${format} - Feature coming soon!`);
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1f1f1f] bg-[#151515] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Award className="text-purple-400" size={28} />
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-[#999]">Analytics, Reports & Team Management</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#1a1a1a] text-white text-sm border border-[#2f2f2f] rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>

            {/* Export Buttons */}
            <button
              onClick={() => handleExportReport('pdf')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export PDF
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm rounded-lg transition-colors border border-[#2f2f2f] flex items-center gap-2"
            >
              <FileText size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Projects"
              value={analytics.totalProjects}
              subtitle={`${analytics.completedProjects} completed`}
              icon={<BarChart3 size={20} />}
              color="indigo"
              trend={{ value: analytics.projectCompletionRate, label: 'Completion Rate' }}
            />
            <KPICard
              title="Active Tasks"
              value={analytics.totalTasks - analytics.completedTasks}
              subtitle={`${analytics.completedTasks} completed`}
              icon={<CheckCircle size={20} />}
              color="emerald"
              trend={{ value: analytics.taskCompletionRate, label: 'Completion Rate' }}
            />
            <KPICard
              title="Overdue Tasks"
              value={analytics.overdueTasks}
              subtitle="Needs attention"
              icon={<AlertCircle size={20} />}
              color="rose"
              alert={analytics.overdueTasks > 0}
            />
            <KPICard
              title="Active Users"
              value={analytics.activeUsers}
              subtitle={`of ${analytics.totalUsers} total`}
              icon={<Users size={20} />}
              color="purple"
              trend={{ value: ((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(0), label: 'Activity Rate' }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" />
                Daily Activity
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: '8px' }}
                    labelStyle={{ color: '#999' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="activities" stroke="#6366f1" strokeWidth={2} name="Total Activity" />
                  <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tasks" />
                  <Line type="monotone" dataKey="projects" stroke="#f59e0b" strokeWidth={2} name="Projects" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Project Status Distribution */}
            <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-indigo-400" />
                Project Status
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              Team Performance by Role
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.rolePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="role" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: '8px' }}
                  labelStyle={{ color: '#999' }}
                />
                <Legend />
                <Bar dataKey="totalTasks" fill="#6366f1" name="Total Tasks" />
                <Bar dataKey="completedTasks" fill="#10b981" name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activityLogs.slice(0, 20).map((log, idx) => (
                <ActivityLogItem key={idx} log={log} />
              ))}
              {activityLogs.length === 0 && (
                <div className="text-center py-8 text-[#666]">
                  No recent activity to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, subtitle, icon, color, trend, alert }) => {
  const colors = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
  };

  const colorScheme = colors[color] || colors.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#151515] border ${colorScheme.border} rounded-lg p-4 ${alert ? 'ring-2 ring-rose-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorScheme.bg}`}>
          <div className={colorScheme.text}>{icon}</div>
        </div>
        {trend && (
          <div className={`text-xs ${colorScheme.text} flex items-center gap-1`}>
            <TrendingUp size={12} />
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-xs text-[#999]">{title}</div>
        {subtitle && (
          <div className="text-xs text-[#666] mt-1">{subtitle}</div>
        )}
        {trend && (
          <div className="text-xs text-[#666] mt-1">{trend.label}</div>
        )}
      </div>
    </motion.div>
  );
};

// Activity Log Item Component
const ActivityLogItem = ({ log }) => {
  const getActionColor = (action) => {
    const colors = {
      created: 'text-emerald-400',
      updated: 'text-blue-400',
      deleted: 'text-rose-400',
      completed: 'text-green-400',
      assigned: 'text-purple-400'
    };
    return colors[action] || 'text-gray-400';
  };

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
      <div className={`w-2 h-2 rounded-full ${getActionColor(log.action)}`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          <span className="font-medium">{log.userName || 'User'}</span>
          {' '}
          <span className={getActionColor(log.action)}>{log.action}</span>
          {' '}
          <span className="text-[#999]">{log.entityType}</span>
          {log.entityTitle && (
            <>
              {' '}
              <span className="text-white">"{log.entityTitle}"</span>
            </>
          )}
        </p>
        <p className="text-xs text-[#666]">
          {new Date(log.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
