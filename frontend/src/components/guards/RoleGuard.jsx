import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RoleGuard({ roles = [], permissions = [], children }) {
  const { user, isAuth } = useAuth();
  const location = useLocation();

  if (!isAuth || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ADMIN and superusers have universal access
  if (user.role === 'ADMIN' || (user.permissions && user.permissions.includes('*'))) {
    return children;
  }

  // Check role match
  if (roles && roles.length > 0) {
    const isRoleAllowed = roles.includes(user.role);
    if (!isRoleAllowed) {
      return (
        <Navigate
          to="/forbidden"
          state={{ attemptedPath: location.pathname, requiredRoles: roles }}
          replace
        />
      );
    }
  }

  return children;
}

export default RoleGuard;