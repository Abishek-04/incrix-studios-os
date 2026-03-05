const MANAGER_ROLES = new Set(['manager', 'superadmin']);

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeRole(role) {
  return typeof role === 'string'
    ? role.trim().toLowerCase().replace(/[\s_-]+/g, '')
    : '';
}

export function normalizeRoles(roles, fallbackRole = '') {
  const list = Array.isArray(roles) ? roles : [];
  const normalized = list.map(normalizeRole).filter(Boolean);
  if (normalized.length > 0) return Array.from(new Set(normalized));
  const fallback = normalizeRole(fallbackRole);
  return fallback ? [fallback] : [];
}

export function normalizeEditors(project) {
  const list = [];
  if (Array.isArray(project?.editors)) {
    list.push(...project.editors);
  }
  if (project?.editor && project.editor !== 'Unassigned') {
    list.push(project.editor);
  }
  return Array.from(
    new Set(
      list
        .map((value) => (typeof value === 'string' ? value.trim() : value))
        .filter(Boolean)
    )
  );
}

export function buildCurrentUserContext(raw = {}) {
  const roles = normalizeRoles(raw.roles, raw.role);
  return {
    id: raw.id || raw._id || '',
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    role: normalizeRole(raw.role),
    roles
  };
}

export function canManageAllProjects(currentUser) {
  const primaryRole = normalizeRole(currentUser?.role);

  // Use active/primary role for project visibility and global project actions.
  // This prevents unintended full access from secondary roles.
  if (primaryRole) {
    return MANAGER_ROLES.has(primaryRole);
  }

  // Backward compatibility for older payloads that might not include role.
  const roles = normalizeRoles(currentUser?.roles, '');
  return roles.some((role) => MANAGER_ROLES.has(role));
}

export function canViewProject(project, currentUser) {
  if (canManageAllProjects(currentUser)) return true;

  const userName = normalizeText(currentUser?.name);
  if (!userName) return false;

  const creatorName = normalizeText(project?.creator);
  if (creatorName && creatorName === userName) return true;

  const editors = normalizeEditors(project).map(normalizeText);
  return editors.includes(userName);
}

export function filterProjectsForUser(projects = [], currentUser) {
  if (canManageAllProjects(currentUser)) return projects;
  return projects.filter((project) => canViewProject(project, currentUser));
}
