import { useMemo } from 'react';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessFeature,
  isSuperAdmin,
  isManager,
  isContentRole,
  isTaskOnlyRole
} from '@/config/permissions';

/**
 * React Hook for permission checking
 * Usage: const { can, canAny, canAll, canAccess } = usePermissions(currentUser);
 */
export function usePermissions(user) {
  const userRoles = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles
    : user?.role;

  return useMemo(() => {
    return {
      // Check single permission
      can: (permission) => hasPermission(userRoles, permission),

      // Check if user has any of the permissions
      canAny: (permissions) => hasAnyPermission(userRoles, permissions),

      // Check if user has all permissions
      canAll: (permissions) => hasAllPermissions(userRoles, permissions),

      // Check feature access
      canAccess: (feature) => canAccessFeature(userRoles, feature),

      // Role checks
      isSuperAdmin: () => isSuperAdmin(userRoles),
      isManager: () => isManager(userRoles),
      isContentRole: () => isContentRole(userRoles),
      isTaskOnlyRole: () => isTaskOnlyRole(userRoles),

      // Get user role
      getRole: () => userRoles
    };
  }, [userRoles]);
}

export default usePermissions;
