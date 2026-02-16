import { Stage, Platform } from '@/types';

/**
 * Calculate quota progress for a single user
 * @param {Object} user - User object with quota field
 * @param {Array} allProjects - All projects in the system
 * @returns {Object|null} Progress data or null if no quota
 */
export const calculateProgress = (user, allProjects) => {
  if (!user.quota) return null;

  const now = new Date();
  let startDate = new Date();

  // Set start date based on period
  if (user.quota.period === 'weekly') {
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(1); // 1st of month
    startDate.setHours(0, 0, 0, 0);
  }

  const userProjects = allProjects.filter(p =>
    p.creator === user.name &&
    p.stage === Stage.Done &&
    p.lastUpdated >= startDate.getTime()
  );

  // In Progress for "Pipeline" check
  const pipelineProjects = allProjects.filter(p =>
    p.creator === user.name &&
    p.stage !== Stage.Done &&
    p.stage !== Stage.Backlog
  );

  const ytLongActual = userProjects.filter(p => p.platform === Platform.YouTube && (p.contentFormat === 'LongForm' || !p.contentFormat)).length;
  const ytShortActual = userProjects.filter(p => p.platform === Platform.YouTube && p.contentFormat === 'ShortForm').length;
  const instaReelActual = userProjects.filter(p => p.platform === Platform.Instagram).length;
  const courseActual = userProjects.filter(p => p.platform === Platform.Course).length;

  const ytLongPipeline = pipelineProjects.filter(p => p.platform === Platform.YouTube && (p.contentFormat === 'LongForm' || !p.contentFormat)).length;
  const ytShortPipeline = pipelineProjects.filter(p => p.platform === Platform.YouTube && p.contentFormat === 'ShortForm').length;
  const instaReelPipeline = pipelineProjects.filter(p => p.platform === Platform.Instagram).length;
  const coursePipeline = pipelineProjects.filter(p => p.platform === Platform.Course).length;

  // Default quotas to 0 if undefined (migration safety)
  const q = user.quota || { youtubeLong: 0, youtubeShort: 0, instagramReel: 0, course: 0 };

  // Calculate days remaining in period
  let endDate = new Date();
  if (user.quota.period === 'weekly') {
    const dayOfWeek = endDate.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endDate = new Date(endDate.getTime() + daysUntilSunday * 86400000);
  } else {
    endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  }
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));

  return {
    daysRemaining,
    period: user.quota.period,
    youtubeLong: {
      actual: ytLongActual,
      target: q.youtubeLong || 0,
      pipeline: ytLongPipeline,
      percent: q.youtubeLong > 0 ? Math.min(100, (ytLongActual / q.youtubeLong) * 100) : 0
    },
    youtubeShort: {
      actual: ytShortActual,
      target: q.youtubeShort || 0,
      pipeline: ytShortPipeline,
      percent: q.youtubeShort > 0 ? Math.min(100, (ytShortActual / q.youtubeShort) * 100) : 0
    },
    instagramReel: {
      actual: instaReelActual,
      target: q.instagramReel || 0,
      pipeline: instaReelPipeline,
      percent: q.instagramReel > 0 ? Math.min(100, (instaReelActual / q.instagramReel) * 100) : 0
    },
    course: {
      actual: courseActual,
      target: q.course || 0,
      pipeline: coursePipeline,
      percent: q.course > 0 ? Math.min(100, (courseActual / q.course) * 100) : 0
    }
  };
};

/**
 * Calculate team-wide aggregated metrics
 * @param {Array} users - Array of content creator users
 * @param {Array} projects - All projects
 * @returns {Object} Aggregated team metrics
 */
export const calculateTeamAggregate = (users, projects) => {
  const contentCreators = users.filter(u =>
    ['manager', 'creator', 'editor'].includes(u.role) && u.quota
  );

  let totalActual = 0;
  let totalTarget = 0;
  let totalPipeline = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;

  const contentTypeBreakdown = {
    youtubeLong: { actual: 0, target: 0, pipeline: 0 },
    youtubeShort: { actual: 0, target: 0, pipeline: 0 },
    instagramReel: { actual: 0, target: 0, pipeline: 0 },
    course: { actual: 0, target: 0, pipeline: 0 }
  };

  contentCreators.forEach(user => {
    const progress = calculateProgress(user, projects);
    if (!progress) return;

    // Aggregate totals
    ['youtubeLong', 'youtubeShort', 'instagramReel', 'course'].forEach(type => {
      totalActual += progress[type].actual;
      totalTarget += progress[type].target;
      totalPipeline += progress[type].pipeline;

      contentTypeBreakdown[type].actual += progress[type].actual;
      contentTypeBreakdown[type].target += progress[type].target;
      contentTypeBreakdown[type].pipeline += progress[type].pipeline;
    });

    // Track creator status
    const status = getCompletionStatus(totalActual, totalTarget, progress.daysRemaining);
    if (status === 'At Risk' || status === 'Behind') atRiskCount++;
    if (status === 'On Track' || status === 'Complete') onTrackCount++;
  });

  return {
    totalActual,
    totalTarget,
    totalPipeline,
    teamProgress: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
    atRiskCount,
    onTrackCount,
    totalCreators: contentCreators.length,
    contentTypeBreakdown
  };
};

/**
 * Get date range for a quota period
 * @param {string} period - 'weekly' or 'monthly'
 * @returns {Object} {startDate, endDate}
 */
export const getDateRangeForPeriod = (period) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'weekly') {
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);

    const dayOfWeek = endDate.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endDate = new Date(endDate.getTime() + daysUntilSunday * 86400000);
  } else {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  }

  return { startDate, endDate };
};

/**
 * Calculate completion velocity (rate per day)
 * @param {number} actual - Completed count
 * @param {number} target - Target count
 * @param {number} daysRemaining - Days left in period
 * @returns {number} Completions per day needed
 */
export const calculateVelocity = (actual, target, daysRemaining) => {
  if (daysRemaining === 0) return 0;
  const remaining = Math.max(0, target - actual);
  return remaining / daysRemaining;
};

/**
 * Get completion status based on progress
 * @param {number} actual - Completed count
 * @param {number} target - Target count
 * @param {number} daysRemaining - Days left in period
 * @returns {string} 'Complete' | 'On Track' | 'Behind' | 'At Risk'
 */
export const getCompletionStatus = (actual, target, daysRemaining) => {
  if (target === 0) return 'No Target';
  if (actual >= target) return 'Complete';

  const percentComplete = (actual / target) * 100;
  const percentTimeElapsed = daysRemaining === 0 ? 100 : ((7 - daysRemaining) / 7) * 100; // Assuming weekly for simplicity

  if (percentComplete >= percentTimeElapsed) return 'On Track';
  if (percentComplete >= percentTimeElapsed * 0.7) return 'Behind';
  return 'At Risk';
};

export default {
  calculateProgress,
  calculateTeamAggregate,
  getDateRangeForPeriod,
  calculateVelocity,
  getCompletionStatus
};
