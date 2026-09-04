/**
 * Role-Based Access Control (RBAC) Matrix
 * Maps each role to its allowed permissions.
 * Centralized so frontend guards and backend middleware stay in sync.
 */

export const PERMISSIONS = {
  // Superuser — full access
  ADMIN: ['*'],

  // Head of Department — department-scoped access
  HOD: [
    'dept:read',
    'dept:analytics',
    'advisee:read',
    'advisee:intervene',
    'risk:read',
    'quality:read_own_dept',
  ],

  // Faculty — own-department access only
  FACULTY: [
    'advisee:read',
    'advisee:intervene',
    'risk:read',
  ],

  // Accounts & Finance
  ACCOUNTS: [
    'fees:read',
    'fees:write',
    'fees:receipt',
    'reminder:send',
    'revenue:read',
  ],

  // Student — self-service only
  STUDENT: [
    'self:read',
    'self:whatif',
    'self:transcript',
    'self:hallticket',
  ],
};