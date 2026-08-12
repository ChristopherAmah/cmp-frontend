// Permission constants matching backend
export const PERMISSIONS = {
  CONTRACTS: {
    VIEW: 'contracts:view',
    CREATE: 'contracts:create',
    UPDATE: 'contracts:update',
    DELETE: 'contracts:delete',
    ARCHIVE: 'contracts:archive',
  },
  PAYMENTS: {
    VIEW: 'payments:view',
    CREATE: 'payments:create',
    UPDATE: 'payments:update',
    DELETE: 'payments:delete',
  },
  DOCUMENTS: {
    VIEW: 'documents:view',
    UPLOAD: 'documents:upload',
    DELETE: 'documents:delete',
    DOWNLOAD: 'documents:download',
  },
  ORGANIZATIONS: {
    VIEW: 'organizations:view',
    CREATE: 'organizations:create',
    UPDATE: 'organizations:update',
    DELETE: 'organizations:delete',
  },
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    TOGGLE_STATUS: 'users:toggle_status',
  },
  PROFILE: {
    VIEW: 'profile:view',
    UPDATE: 'profile:update',
    UPLOAD_PICTURE: 'profile:upload_picture',
  },
  SYSTEM: {
    VIEW_LOGS: 'system:view_logs',
    MANAGE_SETTINGS: 'system:manage_settings',
  },
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  admin: [
    PERMISSIONS.CONTRACTS.VIEW,
    PERMISSIONS.CONTRACTS.CREATE,
    PERMISSIONS.CONTRACTS.UPDATE,
    PERMISSIONS.CONTRACTS.ARCHIVE,
    PERMISSIONS.PAYMENTS.VIEW,
    PERMISSIONS.PAYMENTS.CREATE,
    PERMISSIONS.PAYMENTS.UPDATE,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.UPLOAD,
    PERMISSIONS.DOCUMENTS.DOWNLOAD,
    PERMISSIONS.ORGANIZATIONS.VIEW,
    PERMISSIONS.ORGANIZATIONS.CREATE,
    PERMISSIONS.ORGANIZATIONS.UPDATE,
    PERMISSIONS.USERS.VIEW,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.PROFILE.VIEW,
    PERMISSIONS.PROFILE.UPDATE,
    PERMISSIONS.PROFILE.UPLOAD_PICTURE,
    PERMISSIONS.SYSTEM.VIEW_LOGS,
  ],
  developer: [
    PERMISSIONS.CONTRACTS.VIEW,
    PERMISSIONS.PAYMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.DOWNLOAD,
    PERMISSIONS.ORGANIZATIONS.VIEW,
    PERMISSIONS.PROFILE.VIEW,
    PERMISSIONS.PROFILE.UPDATE,
    PERMISSIONS.PROFILE.UPLOAD_PICTURE,
  ],
  user: [
    PERMISSIONS.CONTRACTS.VIEW,
    PERMISSIONS.PAYMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.VIEW,
    PERMISSIONS.DOCUMENTS.DOWNLOAD,
    PERMISSIONS.ORGANIZATIONS.VIEW,
    PERMISSIONS.PROFILE.VIEW,
    PERMISSIONS.PROFILE.UPDATE,
    PERMISSIONS.PROFILE.UPLOAD_PICTURE,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Super admin has all permissions
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
};

/**
 * Convenience functions for common permission checks
 */
export const canEdit = (role) => {
  return hasPermission(role, PERMISSIONS.CONTRACTS.UPDATE);
};

export const canDelete = (role) => {
  return hasPermission(role, PERMISSIONS.CONTRACTS.DELETE);
};

export const canCreate = (role) => {
  return hasPermission(role, PERMISSIONS.CONTRACTS.CREATE);
};

export const canDeleteOrganization = (role) => {
  return hasPermission(role, PERMISSIONS.ORGANIZATIONS.DELETE);
};

export const canUploadDocuments = (role) => {
  return hasPermission(role, PERMISSIONS.DOCUMENTS.UPLOAD);
};

export const canManageUsers = (role) => {
  return hasPermission(role, PERMISSIONS.USERS.VIEW);
};

