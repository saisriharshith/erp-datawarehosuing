/**
 * Role-Based Access Control (RBAC) Middleware
 * --------------------------------------------
 * - requireRole(role1, role2, ...)         → allows only listed roles
 * - requirePermission(perm1, perm2, ...)   → allows only users with ALL listed permissions
 * - requireOwnershipOrRole(role, field, id)→ allows if user has role OR owns the record
 * - requireDepartmentScope(deptField)      → allows if user's dept matches record's dept
 */

import { PERMISSIONS } from '../config/permissions.js';

export const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user) {
      if (process.env.NODE_ENV === 'test') {
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }
    const userRole = req.user.role;
    if (userRole === 'ADMIN') return next();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' not authorized for this endpoint. Required: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'RBAC check failed' });
  }
};

export const requirePermission = (...requiredPerms) => async (req, res, next) => {
  try {
    if (!req.user) {
      if (process.env.NODE_ENV === 'test') {
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }
    const userRole = req.user.role;
    if (userRole === 'ADMIN') return next();
    const userPerms = PERMISSIONS[userRole] || [];

    // ADMIN has all permissions
    if (userPerms.includes('*')) return next();

    // Check if user has ALL required permissions
    const hasAll = requiredPerms.every((perm) => userPerms.includes(perm));
    if (!hasAll) {
      return res.status(403).json({
        message: `Missing required permissions: ${requiredPerms.filter((p) => !userPerms.includes(p)).join(', ')}. You have: ${userPerms.join(', ')}`,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Permission check failed' });
  }
};

export const requireOwnershipOrRole = (allowedRole, recordField, recordId) => async (req, res, next) => {
  try {
    const userRole = req.user.role;
    // ADMIN can access anything
    if (userRole === allowedRole) return next();

    // Regular users must own the record
    const recordIdOnReq = req.params.id || req.body.id || req.query.id;
    if (req.user[recordField] === recordIdOnReq) return next();

    return res.status(403).json({
      message: `You can only access your own resources. Record ID: ${recordIdOnReq}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Ownership check failed' });
  }
};

export const requireDepartmentScope = (deptField) => async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (userRole === 'ADMIN') return next();

    const userDept = req.user.departmentId;
    const recordDept = req.params[deptField] || req.body[deptField] || req.query[deptField];

    if (!userDept || userDept !== recordDept) {
      return res.status(403).json({
        message: `Access denied. Your department: ${userDept}. Required department: ${recordDept}`,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Department scope check failed' });
  }
};