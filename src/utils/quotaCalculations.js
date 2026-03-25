import { Stage, Platform } from '@/types';

/**
 * Get the start and end dates for a quota period.
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

    // End of week = next Sunday 23:59:59
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

/**
 * Determine the content type of a project based on platform + contentFormat.
 * Returns one of: 'youtubeLong', 'youtubeShort', 'instagramReel', 'instagramPost', 'course', 'other'
 */
function getContentType(project) {
  const platform = project.platform;
  const format = project.contentFormat;

  if (platform === Platform.YouTube) {
    if (format === 'YTShorts' || format === 'ShortForm') return 'youtubeShort';
    if (format === 'YTLongVideo' || format === 'LongForm') return 'youtubeLong';
    // If no format set, check if it looks like a short based on other signals
    return 'youtubeLong'; // default for YouTube
  }

  if (platform === Platform.Instagram) {
    if (format === 'InstaPost') return 'instagramPost';
    return 'instagramReel'; // default for Instagram
  }

  if (platform === Platform.Course || platform === 'course') {
    return 'course';
  }

  return 'other';
}

/**
 * Match a project to a user.
 * Checks both name and ID for backward compatibility.
 */
function isProjectByUser(project, user, field = 'creator') {
  const value = project[field];
  if (!value) return false;
  // Match by name (legacy) or by user ID
  return value === user.name || value === user.id || value === String(user._id || '');
}

/**
 * Calculate quota progress for a single user.
 */
export const calculateProgress = (user, allProjects) => {
  if (!user.quota) return null;

  const { startDate, endDate } = getDateRangeForPeriod(user.quota.period || 'weekly');

  // Completed projects in current period
  const completedProjects = allProjects.filter(p =>
    isProjectByUser(p, user) &&
    p.stage === Stage.Done &&
    p.lastUpdated >= startDate.getTime()
  );

  // In-progress projects (pipeline)
  const pipelineProjects = allProjects.filter(p =>
    isProjectByUser(p, user) &&
    p.stage !== Stage.Done &&
    p.stage !== Stage.Backlog &&
    !p.archived
  );

  // Count by content type
  const count = (projects, type) => projects.filter(p => getContentType(p) === type).length;

  const q = user.quota || {};

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));
  const totalDays = user.quota.period === 'weekly' ? 7 : new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();

  const makeMetric = (actual, target, pipeline) => ({
    actual,
    target: target || 0,
    pipeline,
    percent: target > 0 ? Math.min(100, (actual / target) * 100) : 0
  });

  return {
    daysRemaining,
    totalDays,
    period: user.quota.period || 'weekly',
    youtubeLong: makeMetric(count(completedProjects, 'youtubeLong'), q.youtubeLong, count(pipelineProjects, 'youtubeLong')),
    youtubeShort: makeMetric(count(completedProjects, 'youtubeShort'), q.youtubeShort, count(pipelineProjects, 'youtubeShort')),
    instagramReel: makeMetric(count(completedProjects, 'instagramReel'), q.instagramReel, count(pipelineProjects, 'instagramReel')),
    course: makeMetric(count(completedProjects, 'course'), q.course, count(pipelineProjects, 'course')),
  };
};

/**
 * Get completion status based on progress vs time elapsed.
 * Now correctly handles both weekly and monthly periods.
 */
export const getCompletionStatus = (actual, target, daysRemaining, totalDays) => {
  if (target === 0) return 'No Target';
  if (actual >= target) return 'Complete';

  const daysElapsed = totalDays - daysRemaining;
  const percentComplete = (actual / target) * 100;
  const percentTimeElapsed = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 100;

  if (percentComplete >= percentTimeElapsed) return 'On Track';
  if (percentComplete >= percentTimeElapsed * 0.7) return 'Behind';
  return 'At Risk';
};

/**
 * Calculate team-wide aggregated metrics.
 * Evaluates status per-creator independently, then aggregates.
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

    // Per-creator totals for status evaluation
    let creatorActual = 0;
    let creatorTarget = 0;

    ['youtubeLong', 'youtubeShort', 'instagramReel', 'course'].forEach(type => {
      totalActual += progress[type].actual;
      totalTarget += progress[type].target;
      totalPipeline += progress[type].pipeline;

      creatorActual += progress[type].actual;
      creatorTarget += progress[type].target;

      contentTypeBreakdown[type].actual += progress[type].actual;
      contentTypeBreakdown[type].target += progress[type].target;
      contentTypeBreakdown[type].pipeline += progress[type].pipeline;
    });

    // Evaluate status per-creator independently
    const status = getCompletionStatus(creatorActual, creatorTarget, progress.daysRemaining, progress.totalDays);
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
 * Calculate completion velocity (completions per day needed to meet target).
 */
export const calculateVelocity = (actual, target, daysRemaining) => {
  if (daysRemaining === 0) return 0;
  const remaining = Math.max(0, target - actual);
  return remaining / daysRemaining;
};

export default {
  calculateProgress,
  calculateTeamAggregate,
  getDateRangeForPeriod,
  calculateVelocity,
  getCompletionStatus
};
