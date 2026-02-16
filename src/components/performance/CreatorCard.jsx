import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import QuotaProgressBar from './QuotaProgressBar';
import { getRoleInfo } from '@/config/permissions';

/**
 * Individual creator performance card
 * Shows quota progress for all 4 content types
 */
const CreatorCard = ({ user, progress }) => {
  const [expanded, setExpanded] = useState(false);

  if (!progress) return null;

  const roleInfo = getRoleInfo(user.role);

  // Calculate total completion
  const totalActual = progress.youtubeLong.actual + progress.youtubeShort.actual +
                      progress.instagramReel.actual + progress.course.actual;
  const totalTarget = progress.youtubeLong.target + progress.youtubeShort.target +
                      progress.instagramReel.target + progress.course.target;
  const totalPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Determine status
  let status = 'No Target';
  let statusColor = 'text-[#666]';
  let StatusIcon = Activity;

  if (totalTarget > 0) {
    if (totalActual >= totalTarget) {
      status = 'Complete';
      statusColor = 'text-emerald-400';
      StatusIcon = TrendingUp;
    } else if (totalPercent >= 70) {
      status = 'On Track';
      statusColor = 'text-indigo-400';
      StatusIcon = TrendingUp;
    } else if (totalPercent >= 40) {
      status = 'Behind';
      statusColor = 'text-amber-400';
      StatusIcon = TrendingDown;
    } else {
      status = 'At Risk';
      statusColor = 'text-rose-400';
      StatusIcon = TrendingDown;
    }
  }

  return (
    <motion.div
      layout
      className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg overflow-hidden hover:border-[#444] transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Name and Role */}
            <div>
              <div className="text-white font-semibold">{user.name}</div>
              <div className={`text-xs px-2 py-0.5 rounded ${roleInfo.bgColor} ${roleInfo.color} inline-block`}>
                {roleInfo.label}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151515] ${statusColor}`}>
              <StatusIcon size={14} />
              <span className="text-xs font-medium">{status}</span>
            </div>
            <ChevronDown
              size={18}
              className={`text-[#666] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-3 p-3 bg-[#151515] rounded-lg">
          <div>
            <div className="text-xs text-[#666] mb-1">Period</div>
            <div className="text-sm text-white font-medium capitalize">{progress.period}</div>
          </div>
          <div>
            <div className="text-xs text-[#666] mb-1">Days Left</div>
            <div className="text-sm text-white font-medium">{progress.daysRemaining} days</div>
          </div>
          <div>
            <div className="text-xs text-[#666] mb-1">Completion</div>
            <div className={`text-sm font-bold ${statusColor}`}>
              {totalTarget > 0 ? `${Math.round(totalPercent)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#2f2f2f]"
          >
            <div className="p-4 space-y-3">
              <div className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3">
                Content Breakdown
              </div>

              <QuotaProgressBar
                label="YouTube Long Form"
                actual={progress.youtubeLong.actual}
                target={progress.youtubeLong.target}
                pipeline={progress.youtubeLong.pipeline}
                percent={progress.youtubeLong.percent}
                color="indigo"
              />

              <QuotaProgressBar
                label="YouTube Shorts"
                actual={progress.youtubeShort.actual}
                target={progress.youtubeShort.target}
                pipeline={progress.youtubeShort.pipeline}
                percent={progress.youtubeShort.percent}
                color="red"
              />

              <QuotaProgressBar
                label="Instagram Reels"
                actual={progress.instagramReel.actual}
                target={progress.instagramReel.target}
                pipeline={progress.instagramReel.pipeline}
                percent={progress.instagramReel.percent}
                color="pink"
              />

              <QuotaProgressBar
                label="Course Lectures"
                actual={progress.course.actual}
                target={progress.course.target}
                pipeline={progress.course.pipeline}
                percent={progress.course.percent}
                color="purple"
              />

              {/* Mini Stats */}
              <div className="mt-4 pt-3 border-t border-[#2f2f2f] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#666]">Total Completed: </span>
                  <span className="text-white font-medium">{totalActual}</span>
                </div>
                <div>
                  <span className="text-[#666]">Total Target: </span>
                  <span className="text-white font-medium">{totalTarget}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreatorCard;
