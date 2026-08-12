import { useAuth } from "../contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "../utils/permissions";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role;

  return {
    // Permission checks
    hasPermission: (permission) => hasPermission(role, permission),

    // Contract permissions
    canViewContracts: hasPermission(role, PERMISSIONS.CONTRACTS.VIEW),
    canCreateContracts: hasPermission(role, PERMISSIONS.CONTRACTS.CREATE),
    canUpdateContracts: hasPermission(role, PERMISSIONS.CONTRACTS.UPDATE),
    canDeleteContracts: hasPermission(role, PERMISSIONS.CONTRACTS.DELETE),
    canArchiveContracts: hasPermission(role, PERMISSIONS.CONTRACTS.ARCHIVE),

    // Payment permissions
    canViewPayments: hasPermission(role, PERMISSIONS.PAYMENTS.VIEW),
    canCreatePayments: hasPermission(role, PERMISSIONS.PAYMENTS.CREATE),
    canUpdatePayments: hasPermission(role, PERMISSIONS.PAYMENTS.UPDATE),

    // Document permissions
    canViewDocuments: hasPermission(role, PERMISSIONS.DOCUMENTS.VIEW),
    canUploadDocuments: hasPermission(role, PERMISSIONS.DOCUMENTS.UPLOAD),
    canDeleteDocuments: hasPermission(role, PERMISSIONS.DOCUMENTS.DELETE),
    canDownloadDocuments: hasPermission(role, PERMISSIONS.DOCUMENTS.DOWNLOAD),

    // Organization permissions
    canViewOrganizations: hasPermission(role, PERMISSIONS.ORGANIZATIONS.VIEW),
    canCreateOrganizations: hasPermission(
      role,
      PERMISSIONS.ORGANIZATIONS.CREATE
    ),
    canUpdateOrganizations: hasPermission(
      role,
      PERMISSIONS.ORGANIZATIONS.UPDATE
    ),
    canDeleteOrganizations: hasPermission(
      role,
      PERMISSIONS.ORGANIZATIONS.DELETE
    ),

    // User permissions
    canViewUsers: hasPermission(role, PERMISSIONS.USERS.VIEW),
    canCreateUsers: hasPermission(role, PERMISSIONS.USERS.CREATE),
    canUpdateUsers: hasPermission(role, PERMISSIONS.USERS.UPDATE),
    canDeleteUsers: hasPermission(role, PERMISSIONS.USERS.DELETE),

    // Profile permissions
    canUpdateProfile: hasPermission(role, PERMISSIONS.PROFILE.UPDATE),
    canUploadProfilePicture: hasPermission(
      role,
      PERMISSIONS.PROFILE.UPLOAD_PICTURE
    ),

    // System permissions
    canViewAuditLogs: hasPermission(role, PERMISSIONS.SYSTEM.VIEW_LOGS),

    // Role checks
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin" || role === "super_admin",
    isDeveloper: role === "developer",
    isUser: role === "user",

    // Convenience methods
    canEdit: hasPermission(role, PERMISSIONS.CONTRACTS.UPDATE),
    canDelete: hasPermission(role, PERMISSIONS.CONTRACTS.DELETE),
    canCreate: hasPermission(role, PERMISSIONS.CONTRACTS.CREATE),
  };
};
