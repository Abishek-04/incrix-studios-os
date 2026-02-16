'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Users as UsersIcon, SplitSquareVertical, Filter } from 'lucide-react';
import CreatorCard from './performance/CreatorCard';
import TeamOverview from './performance/TeamOverview';
import { calculateProgress, calculateTeamAggregate } from '@/utils/quotaCalculations';

/**
 * Main Performance View Component
 * Shows quota tracking for content creators with team/individual toggle
 */
const PerformanceView = ({ users, projects, currentUser }) => {
  const [viewMode, setViewMode] = useState('split'); // 'team' | 'individual' | 'split'
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'completion' | 'status'

  // Filter to content creators only (manager, creator, editor)
  const contentCreators = useMemo(() => {
    return users.filter(u =>
      ['manager', 'creator', 'editor'].includes(u.role) &&
      u.isActive !== false &&
      u.quota
    );
  }, [users]);

  // Calculate progress for each creator
  const creatorsWithProgress = useMemo(() => {
    return contentCreators.map(user => ({
      user,
      progress: calculateProgress(user, projects)
    })).filter(item => item.progress !== null);
  }, [contentCreators, projects]);

  // Calculate team aggregate metrics
  const teamMetrics = useMemo(() => {
    return calculateTeamAggregate(contentCreators, projects);
  }, [contentCreators, projects]);

  // Apply filters
  const filteredCreators = useMemo(() => {
    let filtered = [...creatorsWithProgress];

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(item => item.user.role === filterRole);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.user.name.localeCompare(b.user.name));
    } else if (sortBy === 'completion') {
      filtered.sort((a, b) => {
        const aTotal = a.progress.youtubeLong.actual + a.progress.youtubeShort.actual +
                      a.progress.instagramReel.actual + a.progress.course.actual;
        const bTotal = b.progress.youtubeLong.actual + b.progress.youtubeShort.actual +
                      b.progress.instagramReel.actual + b.progress.course.actual;
        return bTotal - aTotal;
      });
    }

    return filtered;
  }, [creatorsWithProgress, filterRole, sortBy]);

  // Access check - only content roles can view this page
  if (!currentUser || !['manager', 'creator', 'editor'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-rose-400 text-lg font-bold mb-2">Access Denied</div>
          <div className="text-[#666]">Only content creators can access performance metrics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0d0d0d] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Team Performance</h1>
            <p className="text-sm text-[#999]">
              Track quota progress and content output across your team
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#2f2f2f]">
            <button
              onClick={() => setViewMode('team')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'team'
                  ? 'bg-indigo-600 text-white'
                  : 'text-[#999] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <LayoutGrid size={16} />
              Team
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'individual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-[#999] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <UsersIcon size={16} />
              Individual
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white'
                  : 'text-[#999] hover:text-white hover:bg-[#252525]'
              }`}
            >
              <SplitSquareVertical size={16} />
              Split
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        {(viewMode === 'individual' || viewMode === 'split') && (
          <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#666]" />
              <span className="text-sm text-[#999]">Filters:</span>
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-1.5 bg-[#151515] border border-[#2f2f2f] rounded-lg text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="manager">Manager</option>
              <option value="creator">Creator</option>
              <option value="editor">Editor</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-[#151515] border border-[#2f2f2f] rounded-lg text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="name">Sort by Name</option>
              <option value="completion">Sort by Completion</option>
            </select>

            <div className="ml-auto text-xs text-[#666]">
              {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Team Overview Section */}
        {(viewMode === 'team' || viewMode === 'split') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TeamOverview
              teamMetrics={teamMetrics}
              contentCreators={contentCreators}
            />
          </motion.div>
        )}

        {/* Individual Creators Section */}
        {(viewMode === 'individual' || viewMode === 'split') && (
          <div className="space-y-4">
            {viewMode === 'split' && (
              <div className="text-xs font-bold text-[#999] uppercase tracking-wider mt-8">
                Individual Creators
              </div>
            )}

            {filteredCreators.length === 0 ? (
              <div className="text-center py-12 text-[#666]">
                <UsersIcon size={48} className="mx-auto mb-3 opacity-50" />
                <div>No content creators with quotas found</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCreators.map((item, index) => (
                  <CreatorCard
                    key={item.user.id}
                    user={item.user}
                    progress={item.progress}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceView;
