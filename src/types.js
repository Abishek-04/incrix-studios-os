// Enums converted to frozen objects for immutability

export const Platform = Object.freeze({
  Instagram: 'instagram',
  YouTube: 'youtube',
  TikTok: 'tiktok',
  LinkedIn: 'linkedin',
  WhatsApp: 'whatsapp',
  Email: 'email',
  Course: 'course'
});

export const Vertical = Object.freeze({
  Automation: 'automation',
  Software: 'software',
  Branding: 'branding',
  Education: 'education'
});

export const Stage = Object.freeze({
  Backlog: 'Backlog',
  Scripting: 'Scripting',
  Shooting: 'Shooting',
  Editing: 'Editing',
  Review: 'Review',
  Done: 'Done'
});

export const Status = Object.freeze({
  NotStarted: 'Not Started',
  InProgress: 'In Progress',
  Done: 'Done',
  Blocked: 'Blocked'
});

export const Priority = Object.freeze({
  High: 'High',
  Medium: 'Medium',
  Low: 'Low'
});

// Type unions as constant arrays for validation
export const VALID_ROLES = ['manager', 'creator', 'editor', 'mograph'];
export const CONTENT_FORMATS = ['LongForm', 'ShortForm'];
export const QUOTA_PERIODS = ['weekly', 'monthly'];
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'];
export const TIME_SLOTS = ['AM', 'PM'];

// Helper function to get all enum values
export const getEnumValues = (enumObj) => Object.values(enumObj);

// Helper function to check if value is valid for enum
export const isValidEnumValue = (enumObj, value) => getEnumValues(enumObj).includes(value);

/**
 * @typedef {Object} UserQuota
 * @property {number} youtubeLong - Target count for YouTube Long Form
 * @property {number} youtubeShort - Target count for YouTube Shorts
 * @property {number} instagramReel - Target count for Instagram Reels
 * @property {number} course - Target count for Course Lectures
 * @property {'weekly'|'monthly'} period - Quota period
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {'manager'|'creator'|'editor'|'mograph'} role
 * @property {string} email
 * @property {string} [phoneNumber] - For WhatsApp
 * @property {boolean} [notifyViaWhatsapp]
 * @property {boolean} [notifyViaEmail]
 * @property {string} avatarColor
 * @property {string} [niche]
 * @property {boolean} active
 * @property {string} [password] - Not sent to frontend usually
 * @property {UserQuota} [quota]
 */

/**
 * @typedef {Object} DailyTask
 * @property {string} id
 * @property {string} date - ISO date YYYY-MM-DD
 * @property {'AM'|'PM'} timeSlot
 * @property {string} userId
 * @property {string} userName - Cached for display
 * @property {string} task
 * @property {boolean} done
 */

/**
 * @typedef {Object} Channel
 * @property {string} id
 * @property {string} platform - Platform enum value
 * @property {string} name
 * @property {string} link - The source URL
 * @property {string} [avatarUrl] - Optional real image URL
 * @property {string} email
 * @property {string} [credentials] - API Key or Token
 * @property {string} [memberId] - Assigned team member ID
 */

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} authorId - User ID for identification
 * @property {string} authorName - Display name
 * @property {string} authorRole - Role for badge color
 * @property {string} text
 * @property {number} timestamp
 * @property {boolean} [edited] - Track if comment was edited
 * @property {number} [editedAt] - When it was edited
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} views
 * @property {number} likes
 * @property {number} comments
 * @property {string} retention - e.g., "55%"
 * @property {string[]} [sources] - Grounding URLs from Gemini Search
 * @property {number} lastUpdated
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} topic
 * @property {string} vertical - Vertical enum value
 * @property {string} platform - Platform enum value
 * @property {'LongForm'|'ShortForm'} [contentFormat] - Distinguish YT Long vs Short
 * @property {string} [channelId] - Links to a specific Channel entity
 * @property {string} role - The primary role currently responsible
 * @property {string} creator - Name or ID
 * @property {string} editor - Name or ID
 * @property {string} stage - Stage enum value
 * @property {string} status - Status enum value
 * @property {string} priority - Priority enum value
 * @property {number} lastUpdated
 * @property {number} dueDate
 * @property {number} durationMinutes - For analytics
 * @property {string} script
 * @property {Array<{id: string, text: string, done: boolean}>} tasks
 * @property {string} technicalNotes
 * @property {string} [reviewLink]
 * @property {string} [publishedLink] - Final social media link
 * @property {Comment[]} comments
 * @property {PerformanceMetrics} [metrics] - Post-production data
 * @property {boolean} hasMographNeeds
 * @property {boolean} archived
 */

/**
 * @typedef {Object} KpiData
 * @property {number} totalVolume - Minutes
 * @property {number} successRate - Percentage
 * @property {number} stuckCount
 * @property {number} urgentCount
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {'info'|'success'|'warning'|'error'} type
 * @property {number} timestamp
 * @property {boolean} read
 * @property {'project'|'user'|'channel'|'task'} [relatedEntityType]
 * @property {string} [relatedEntityId] - ID of related project/user/etc for navigation
 */
