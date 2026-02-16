import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable quota progress bar component
 * Shows actual/target, percentage, and pipeline count
 */
const QuotaProgressBar = ({
  label,
  actual,
  target,
  pipeline,
  percent,
  color = 'indigo',
  size = 'normal' // 'small' | 'normal' | 'large'
}) => {
  // Color mapping
  const colorClasses = {
    indigo: 'bg-indigo-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };

  const textColorClasses = {
    indigo: 'text-indigo-400',
    red: 'text-red-400',
    pink: 'text-pink-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400'
  };

  // Size variants
  const heights = {
    small: 'h-1.5',
    normal: 'h-2',
    large: 'h-3'
  };

  const textSizes = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base'
  };

  // Status color based on progress
  let statusColor = color;
  if (target > 0) {
    if (actual >= target) statusColor = 'emerald';
    else if (percent >= 70) statusColor = color;
    else if (percent >= 40) statusColor = 'amber';
    else statusColor = 'rose';
  }

  return (
    <div className="space-y-1.5">
      {/* Label and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${textSizes[size]} text-white`}>
            {label}
          </span>
          {pipeline > 0 && (
            <span className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-0.5 rounded">
              {pipeline} in pipeline
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`${textSizes[size]} ${textColorClasses[statusColor]} font-bold`}>
            {actual}/{target}
          </span>
          {target > 0 && (
            <span className="text-xs text-[#666]">
              ({Math.round(percent)}%)
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full bg-[#1a1a1a] rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className={`${heights[size]} ${colorClasses[statusColor]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default QuotaProgressBar;
