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
  const userRole = user?.role;

  return useMemo(() => {
    return {
      // Check single permission
      can: (permission) => hasPermission(userRole, permission),

      // Check if user has any of the permissions
      canAny: (permissions) => hasAnyPermission(userRole, permissions),

      // Check if user has all permissions
      canAll: (permissions) => hasAllPermissions(userRole, permissions),

      // Check feature access
      canAccess: (feature) => canAccessFeature(userRole, feature),

      // Role checks
      isSuperAdmin: () => isSuperAdmin(userRole),
      isManager: () => isManager(userRole),
      isContentRole: () => isContentRole(userRole),
      isTaskOnlyRole: () => isTaskOnlyRole(userRole),

      // Get user role
      getRole: () => userRole
    };
  }, [userRole]);
}

export default usePermissions;
