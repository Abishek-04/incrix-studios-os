import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

/**
 * Team-wide aggregate metrics and visualizations
 */
const TeamOverview = ({ teamMetrics, contentCreators }) => {
  if (!teamMetrics) return null;

  const {
    totalActual,
    totalTarget,
    totalPipeline,
    teamProgress,
    atRiskCount,
    onTrackCount,
    totalCreators,
    contentTypeBreakdown
  } = teamMetrics;

  // Pie chart data for content type distribution
  const contentDistribution = [
    { name: 'YouTube Long', value: contentTypeBreakdown.youtubeLong.actual, color: '#6366f1' },
    { name: 'YouTube Shorts', value: contentTypeBreakdown.youtubeShort.actual, color: '#ef4444' },
    { name: 'Instagram Reels', value: contentTypeBreakdown.instagramReel.actual, color: '#ec4899' },
    { name: 'Course Lectures', value: contentTypeBreakdown.course.actual, color: '#a855f7' }
  ].filter(item => item.value > 0);

  // Bar chart data for content breakdown
  const contentBarData = [
    {
      name: 'YT Long',
      Completed: contentTypeBreakdown.youtubeLong.actual,
      Target: contentTypeBreakdown.youtubeLong.target,
      Pipeline: contentTypeBreakdown.youtubeLong.pipeline
    },
    {
      name: 'YT Shorts',
      Completed: contentTypeBreakdown.youtubeShort.actual,
      Target: contentTypeBreakdown.youtubeShort.target,
      Pipeline: contentTypeBreakdown.youtubeShort.pipeline
    },
    {
      name: 'IG Reels',
      Completed: contentTypeBreakdown.instagramReel.actual,
      Target: contentTypeBreakdown.instagramReel.target,
      Pipeline: contentTypeBreakdown.instagramReel.pipeline
    },
    {
      name: 'Course',
      Completed: contentTypeBreakdown.course.actual,
      Target: contentTypeBreakdown.course.target,
      Pipeline: contentTypeBreakdown.course.pipeline
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completions */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[#999] uppercase tracking-wider">
              Total Completed
            </div>
            <Target size={16} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalActual}<span className="text-lg text-[#666]">/{totalTarget}</span>
          </div>
          <div className="text-xs text-[#666]">
            {totalPipeline} in pipeline
          </div>
        </motion.div>

        {/* Team Progress */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[#999] uppercase tracking-wider">
              Team Progress
            </div>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {Math.round(teamProgress)}%
          </div>
          <div className="text-xs text-[#666]">
            Overall completion rate
          </div>
        </motion.div>

        {/* At Risk */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[#999] uppercase tracking-wider">
              At Risk
            </div>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-400 mb-1">
            {atRiskCount}
          </div>
          <div className="text-xs text-[#666]">
            Creators behind quota
          </div>
        </motion.div>

        {/* Active Creators */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[#999] uppercase tracking-wider">
              Content Creators
            </div>
            <Users size={16} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalCreators}
          </div>
          <div className="text-xs text-emerald-400">
            {onTrackCount} on track
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Distribution (Pie Chart) */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={18} className="text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Content Distribution</h3>
          </div>

          {contentDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2f2f2f',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#666]">
              No completed content yet
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {contentDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-[#999]">{item.name}</span>
                <span className="text-xs text-white font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content Breakdown (Bar Chart) */}
        <motion.div
          className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Content Breakdown</h3>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contentBarData}>
              <XAxis
                dataKey="name"
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2f2f2f',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#999' }}
              />
              <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pipeline" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Target" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamOverview;
