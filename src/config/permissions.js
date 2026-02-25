/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles, permissions, and access rules
 */

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  MANAGER: 'manager',
  CREATOR: 'creator',
  EDITOR: 'editor',
  DESIGNER: 'designer',
  DEVELOPER: 'developer'
};

export const PERMISSIONS = {
  // Content Management
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  ARCHIVE_PROJECTS: 'archive_projects',

  // Task Management
  VIEW_TASKS: 'view_tasks',
  CREATE_TASKS: 'create_tasks',
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  ASSIGN_TASKS: 'assign_tasks',

  // Pages & Documents
  VIEW_PAGES: 'view_pages',
  CREATE_PAGES: 'create_pages',
  EDIT_PAGES: 'edit_pages',
  DELETE_PAGES: 'delete_pages',

  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  ASSIGN_ROLES: 'assign_roles',

  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_DATA: 'export_data',

  // System Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',
  MANAGE_CHANNELS: 'manage_channels',

  // Comments & Collaboration
  VIEW_COMMENTS: 'view_comments',
  CREATE_COMMENTS: 'create_comments',
  DELETE_COMMENTS: 'delete_comments'
};

// Role Permission Mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ],

  [ROLES.MANAGER]: [
    // Content Management - Full access
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.ARCHIVE_PROJECTS,

    // Task Management - Full access
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.ASSIGN_TASKS,

    // Pages - Full access
    PERMISSIONS.VIEW_PAGES,
    PERMISSIONS.CREATE_PAGES,
    PERMISSIONS.EDIT_PAGES,
    PERMISSIONS.DELETE_PAGES,

    // Users - Management access
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.ASSIGN_ROLES,

    // Analytics - View only
    PERMISSIONS.VIEW_ANALYTICS,

    // Comments
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.CREATE_COMMENTS,
    PERMISSIONS.DELETE_COMMENTS,

    // Channels
    PERMISSIONS.MANAGE_CHANNELS
  ],

  [ROLES.CREATOR]: [
    // Content - Create and edit assigned
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,

    // Tasks - Own tasks only
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_TASKS,

    // Pages
    PERMISSIONS.VIEW_PAGES,
    PERMISSIONS.CREATE_PAGES,
    PERMISSIONS.EDIT_PAGES,

    // Comments
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.CREATE_COMMENTS,

    // Users - View only
    PERMISSIONS.VIEW_USERS
  ],

  [ROLES.EDITOR]: [
    // Content - Edit assigned
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,

    // Tasks - Own tasks only
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_TASKS,

    // Pages
    PERMISSIONS.VIEW_PAGES,
    PERMISSIONS.EDIT_PAGES,

    // Comments
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.CREATE_COMMENTS,

    // Users - View only
    PERMISSIONS.VIEW_USERS
  ],

  [ROLES.DESIGNER]: [
    // Tasks only - No content access
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_TASKS,

    // Comments
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.CREATE_COMMENTS,

    // Users - View team only
    PERMISSIONS.VIEW_USERS
  ],

  [ROLES.DEVELOPER]: [
    // Tasks only - No content access
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_TASKS,

    // Comments
    PERMISSIONS.VIEW_COMMENTS,
    PERMISSIONS.CREATE_COMMENTS,

    // Users - View team only
    PERMISSIONS.VIEW_USERS
  ]
};

// Feature Access by Role
export const FEATURE_ACCESS = {
  // Navigation Items
  projects: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR],
  board: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR],
  calendar: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR],
  pages: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR],
  tasks: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR, ROLES.DESIGNER, ROLES.DEVELOPER],
  analytics: [ROLES.SUPER_ADMIN, ROLES.MANAGER],
  reports: [ROLES.SUPER_ADMIN],
  users: [ROLES.SUPER_ADMIN, ROLES.MANAGER],
  settings: [ROLES.SUPER_ADMIN],
  channels: [ROLES.SUPER_ADMIN, ROLES.MANAGER]
};

// Permission Check Functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const canAccessFeature = (userRole, feature) => {
  if (!userRole || !feature) return false;
  const allowedRoles = FEATURE_ACCESS[feature] || [];
  return allowedRoles.includes(userRole);
};

export const isSuperAdmin = (userRole) => {
  return userRole === ROLES.SUPER_ADMIN;
};

export const isManager = (userRole) => {
  return userRole === ROLES.MANAGER || isSuperAdmin(userRole);
};

export const isContentRole = (userRole) => {
  return [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CREATOR, ROLES.EDITOR].includes(userRole);
};

export const isTaskOnlyRole = (userRole) => {
  return [ROLES.DESIGNER, ROLES.DEVELOPER].includes(userRole);
};

// Get role display info
export const getRoleInfo = (role) => {
  const roleInfo = {
    [ROLES.SUPER_ADMIN]: {
      label: 'Super Admin',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50',
      description: 'Full system access with analytics and user management'
    },
    [ROLES.MANAGER]: {
      label: 'Manager',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-500/50',
      description: 'Content and team management'
    },
    [ROLES.CREATOR]: {
      label: 'Creator',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50',
      description: 'Create and manage content projects'
    },
    [ROLES.EDITOR]: {
      label: 'Editor',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/50',
      description: 'Edit and refine content'
    },
    [ROLES.DESIGNER]: {
      label: 'Designer',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/50',
      description: 'Design tasks and creative work'
    },
    [ROLES.DEVELOPER]: {
      label: 'Developer',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/50',
      description: 'Development tasks and technical work'
    }
  };

  return roleInfo[role] || {
    label: role,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/50',
    description: 'Team member'
  };
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  FEATURE_ACCESS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessFeature,
  isSuperAdmin,
  isManager,
  isContentRole,
  isTaskOnlyRole,
  getRoleInfo
};
