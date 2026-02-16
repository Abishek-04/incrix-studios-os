'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * Permission Guard Component
 *
 * Wraps components and only renders them if user has required permissions
 *
 * Usage:
 * <PermissionGuard permission="create_projects">
 *   <CreateProjectButton />
 * </PermissionGuard>
 *
 * <PermissionGuard feature="analytics" fallback={<AccessDenied />}>
 *   <AnalyticsDashboard />
 * </PermissionGuard>
 */

export const PermissionGuard = ({
  children,
  permission,
  permissions,
  requireAll = false,
  feature,
  currentUser,
  fallback,
  showFallback = true
}) => {
  const { can, canAny, canAll, canAccess } = usePermissions(currentUser);

  let hasAccess = true;

  if (feature) {
    hasAccess = canAccess(feature);
  } else if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    if (showFallback) {
      return <AccessDenied />;
    }
    return null;
  }

  return <>{children}</>;
};

// Access Denied Component
export const AccessDenied = ({ message, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">
        <Lock size={14} />
        <span>Access Denied</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#0d0d0d]">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-[#999] mb-6">
          {message || 'You don\'t have permission to access this feature. Contact your administrator for access.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[#666]">
          <AlertCircle size={14} />
          <span>Required permissions missing</span>
        </div>
      </div>
    </div>
  );
};

// Hide Component - Renders nothing if no permission
export const HideIfNoPermission = ({ children, permission, permissions, requireAll, feature, currentUser }) => {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      feature={feature}
      currentUser={currentUser}
      showFallback={false}
    >
      {children}
    </PermissionGuard>
  );
};

// Role-based Guard
export const RoleGuard = ({ children, roles, currentUser, fallback, showFallback = true }) => {
  const userRole = currentUser?.role;
  const hasAccess = roles.includes(userRole);

  if (!hasAccess) {
    if (fallback) return fallback;
    if (showFallback) return <AccessDenied />;
    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
