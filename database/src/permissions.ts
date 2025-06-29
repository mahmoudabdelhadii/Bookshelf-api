export enum ResourceType {
  USER = "user",
  BOOK = "book",
  LIBRARY = "library",
  LIBRARY_BOOK = "library_book",
  AUTHOR = "author",
  PUBLISHER = "publisher",
  SYSTEM = "system",
  AUDIT_LOG = "audit_log",
  ROLE = "role",
  PERMISSION = "permission",
}

export enum ActionType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  LIST = "list",
  SEARCH = "search",
  EXPORT = "export",
  IMPORT = "import",
  APPROVE = "approve",
  REJECT = "reject",
  ASSIGN = "assign",
  REVOKE = "revoke",
}

export const PERMISSIONS = {
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_READ_OWN: "user:read:own",
  USER_UPDATE: "user:update",
  USER_UPDATE_OWN: "user:update:own",
  USER_DELETE: "user:delete",
  USER_DELETE_OWN: "user:delete:own",
  USER_LIST: "user:list",
  USER_MANAGE: "user:manage",
  USER_SUSPEND: "user:suspend",
  USER_ACTIVATE: "user:activate",

  BOOK_CREATE: "book:create",
  BOOK_READ: "book:read",
  BOOK_UPDATE: "book:update",
  BOOK_DELETE: "book:delete",
  BOOK_LIST: "book:list",
  BOOK_SEARCH: "book:search",
  BOOK_MANAGE: "book:manage",
  BOOK_IMPORT: "book:import",
  BOOK_EXPORT: "book:export",
  BOOK_BULK_CREATE: "book:create:bulk",
  BOOK_BULK_UPDATE: "book:update:bulk",
  BOOK_BULK_DELETE: "book:delete:bulk",

  LIBRARY_CREATE: "library:create",
  LIBRARY_READ: "library:read",
  LIBRARY_UPDATE: "library:update",
  LIBRARY_DELETE: "library:delete",
  LIBRARY_LIST: "library:list",
  LIBRARY_MANAGE: "library:manage",

  LIBRARY_BOOK_ADD: "library_book:create",
  LIBRARY_BOOK_READ: "library_book:read",
  LIBRARY_BOOK_UPDATE: "library_book:update",
  LIBRARY_BOOK_REMOVE: "library_book:delete",
  LIBRARY_BOOK_LIST: "library_book:list",
  LIBRARY_BOOK_MANAGE: "library_book:manage",
  LIBRARY_BOOK_TRANSFER: "library_book:transfer",

  AUTHOR_CREATE: "author:create",
  AUTHOR_READ: "author:read",
  AUTHOR_UPDATE: "author:update",
  AUTHOR_DELETE: "author:delete",
  AUTHOR_LIST: "author:list",
  AUTHOR_SEARCH: "author:search",
  AUTHOR_MANAGE: "author:manage",

  PUBLISHER_CREATE: "publisher:create",
  PUBLISHER_READ: "publisher:read",
  PUBLISHER_UPDATE: "publisher:update",
  PUBLISHER_DELETE: "publisher:delete",
  PUBLISHER_LIST: "publisher:list",
  PUBLISHER_SEARCH: "publisher:search",
  PUBLISHER_MANAGE: "publisher:manage",

  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_LIST: "role:list",
  ROLE_MANAGE: "role:manage",
  ROLE_ASSIGN: "role:assign",
  ROLE_REVOKE: "role:revoke",

  SYSTEM_CONFIG: "system:config",
  SYSTEM_MONITOR: "system:monitor",
  SYSTEM_BACKUP: "system:backup",
  SYSTEM_RESTORE: "system:restore",
  SYSTEM_MAINTAIN: "system:maintain",
  SYSTEM_MANAGE: "system:manage",

  AUDIT_LOG_READ: "audit_log:read",
  AUDIT_LOG_EXPORT: "audit_log:export",
  AUDIT_LOG_MANAGE: "audit_log:manage",
  SECURITY_MANAGE: "security:manage",
  SECURITY_MONITOR: "security:monitor",

  API_ACCESS: "api:access",
  API_ADMIN: "api:admin",
  INTEGRATION_MANAGE: "integration:manage",
} as const;

export const ROLE_TEMPLATES = {
  SUPER_ADMIN: {
    name: "Super Administrator",
    description: "Full system access with all permissions",
    permissions: Object.values(PERMISSIONS),
  },

  ADMIN: {
    name: "Administrator",
    description: "Administrative access to most system functions",
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_LIST,
      PERMISSIONS.USER_SUSPEND,
      PERMISSIONS.USER_ACTIVATE,
      PERMISSIONS.BOOK_CREATE,
      PERMISSIONS.BOOK_READ,
      PERMISSIONS.BOOK_UPDATE,
      PERMISSIONS.BOOK_DELETE,
      PERMISSIONS.BOOK_LIST,
      PERMISSIONS.BOOK_SEARCH,
      PERMISSIONS.BOOK_IMPORT,
      PERMISSIONS.BOOK_EXPORT,
      PERMISSIONS.BOOK_BULK_CREATE,
      PERMISSIONS.BOOK_BULK_UPDATE,
      PERMISSIONS.BOOK_BULK_DELETE,
      PERMISSIONS.LIBRARY_CREATE,
      PERMISSIONS.LIBRARY_READ,
      PERMISSIONS.LIBRARY_UPDATE,
      PERMISSIONS.LIBRARY_DELETE,
      PERMISSIONS.LIBRARY_LIST,
      PERMISSIONS.LIBRARY_BOOK_ADD,
      PERMISSIONS.LIBRARY_BOOK_READ,
      PERMISSIONS.LIBRARY_BOOK_UPDATE,
      PERMISSIONS.LIBRARY_BOOK_REMOVE,
      PERMISSIONS.LIBRARY_BOOK_LIST,
      PERMISSIONS.LIBRARY_BOOK_TRANSFER,
      PERMISSIONS.AUTHOR_CREATE,
      PERMISSIONS.AUTHOR_READ,
      PERMISSIONS.AUTHOR_UPDATE,
      PERMISSIONS.AUTHOR_DELETE,
      PERMISSIONS.AUTHOR_LIST,
      PERMISSIONS.AUTHOR_SEARCH,
      PERMISSIONS.PUBLISHER_CREATE,
      PERMISSIONS.PUBLISHER_READ,
      PERMISSIONS.PUBLISHER_UPDATE,
      PERMISSIONS.PUBLISHER_DELETE,
      PERMISSIONS.PUBLISHER_LIST,
      PERMISSIONS.PUBLISHER_SEARCH,
      PERMISSIONS.AUDIT_LOG_READ,
      PERMISSIONS.AUDIT_LOG_EXPORT,
      PERMISSIONS.SECURITY_MONITOR,
      PERMISSIONS.API_ACCESS,
    ],
  },

  LIBRARIAN: {
    name: "Librarian",
    description: "Manages library operations and book catalog",
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_LIST,
      PERMISSIONS.BOOK_CREATE,
      PERMISSIONS.BOOK_READ,
      PERMISSIONS.BOOK_UPDATE,
      PERMISSIONS.BOOK_DELETE,
      PERMISSIONS.BOOK_LIST,
      PERMISSIONS.BOOK_SEARCH,
      PERMISSIONS.BOOK_IMPORT,
      PERMISSIONS.BOOK_EXPORT,
      PERMISSIONS.LIBRARY_CREATE,
      PERMISSIONS.LIBRARY_READ,
      PERMISSIONS.LIBRARY_UPDATE,
      PERMISSIONS.LIBRARY_DELETE,
      PERMISSIONS.LIBRARY_LIST,
      PERMISSIONS.LIBRARY_BOOK_ADD,
      PERMISSIONS.LIBRARY_BOOK_READ,
      PERMISSIONS.LIBRARY_BOOK_UPDATE,
      PERMISSIONS.LIBRARY_BOOK_REMOVE,
      PERMISSIONS.LIBRARY_BOOK_LIST,
      PERMISSIONS.LIBRARY_BOOK_TRANSFER,
      PERMISSIONS.AUTHOR_CREATE,
      PERMISSIONS.AUTHOR_READ,
      PERMISSIONS.AUTHOR_UPDATE,
      PERMISSIONS.AUTHOR_DELETE,
      PERMISSIONS.AUTHOR_LIST,
      PERMISSIONS.AUTHOR_SEARCH,
      PERMISSIONS.PUBLISHER_CREATE,
      PERMISSIONS.PUBLISHER_READ,
      PERMISSIONS.PUBLISHER_UPDATE,
      PERMISSIONS.PUBLISHER_DELETE,
      PERMISSIONS.PUBLISHER_LIST,
      PERMISSIONS.PUBLISHER_SEARCH,
      PERMISSIONS.AUDIT_LOG_READ,
      PERMISSIONS.API_ACCESS,
    ],
  },

  CONTENT_MANAGER: {
    name: "Content Manager",
    description: "Manages books, authors, and publishers",
    permissions: [
      PERMISSIONS.USER_READ_OWN,
      PERMISSIONS.USER_UPDATE_OWN,
      PERMISSIONS.BOOK_CREATE,
      PERMISSIONS.BOOK_READ,
      PERMISSIONS.BOOK_UPDATE,
      PERMISSIONS.BOOK_DELETE,
      PERMISSIONS.BOOK_LIST,
      PERMISSIONS.BOOK_SEARCH,
      PERMISSIONS.BOOK_IMPORT,
      PERMISSIONS.BOOK_EXPORT,
      PERMISSIONS.AUTHOR_CREATE,
      PERMISSIONS.AUTHOR_READ,
      PERMISSIONS.AUTHOR_UPDATE,
      PERMISSIONS.AUTHOR_DELETE,
      PERMISSIONS.AUTHOR_LIST,
      PERMISSIONS.AUTHOR_SEARCH,
      PERMISSIONS.PUBLISHER_CREATE,
      PERMISSIONS.PUBLISHER_READ,
      PERMISSIONS.PUBLISHER_UPDATE,
      PERMISSIONS.PUBLISHER_DELETE,
      PERMISSIONS.PUBLISHER_LIST,
      PERMISSIONS.PUBLISHER_SEARCH,
      PERMISSIONS.LIBRARY_READ,
      PERMISSIONS.LIBRARY_LIST,
      PERMISSIONS.LIBRARY_BOOK_READ,
      PERMISSIONS.LIBRARY_BOOK_LIST,
      PERMISSIONS.API_ACCESS,
    ],
  },

  READER: {
    name: "Reader",
    description: "Basic read access to library content",
    permissions: [
      PERMISSIONS.USER_READ_OWN,
      PERMISSIONS.USER_UPDATE_OWN,
      PERMISSIONS.BOOK_READ,
      PERMISSIONS.BOOK_LIST,
      PERMISSIONS.BOOK_SEARCH,
      PERMISSIONS.AUTHOR_READ,
      PERMISSIONS.AUTHOR_LIST,
      PERMISSIONS.AUTHOR_SEARCH,
      PERMISSIONS.PUBLISHER_READ,
      PERMISSIONS.PUBLISHER_LIST,
      PERMISSIONS.PUBLISHER_SEARCH,
      PERMISSIONS.LIBRARY_READ,
      PERMISSIONS.LIBRARY_LIST,
      PERMISSIONS.LIBRARY_BOOK_READ,
      PERMISSIONS.LIBRARY_BOOK_LIST,
      PERMISSIONS.API_ACCESS,
    ],
  },

  GUEST: {
    name: "Guest",
    description: "Limited read-only access",
    permissions: [
      PERMISSIONS.BOOK_READ,
      PERMISSIONS.BOOK_LIST,
      PERMISSIONS.BOOK_SEARCH,
      PERMISSIONS.AUTHOR_READ,
      PERMISSIONS.AUTHOR_SEARCH,
      PERMISSIONS.PUBLISHER_READ,
      PERMISSIONS.PUBLISHER_SEARCH,
      PERMISSIONS.LIBRARY_READ,
      PERMISSIONS.LIBRARY_LIST,
    ],
  },
} as const;

export class PermissionValidator {
  static isValidPermission(permission: string): boolean {
    return Object.values(PERMISSIONS).includes(permission as any);
  }

  static parsePermission(permission: string): {
    resource: string;
    action: string;
    scope?: string;
  } | null {
    const parts = permission.split(":");
    if (parts.length < 2 || parts.length > 3) {
      return null;
    }

    return {
      resource: parts[0],
      action: parts[1],
      scope: parts[2],
    };
  }

  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    const parsed = this.parsePermission(requiredPermission);
    if (!parsed) return false;

    const managePermission = `${parsed.resource}:manage`;
    if (userPermissions.includes(managePermission)) {
      return true;
    }

    if (userPermissions.includes(PERMISSIONS.SYSTEM_MANAGE)) {
      return true;
    }

    return false;
  }

  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some((permission) => this.hasPermission(userPermissions, permission));
  }

  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every((permission) => this.hasPermission(userPermissions, permission));
  }
}

export type Permission = keyof typeof PERMISSIONS;
export type PermissionString = (typeof PERMISSIONS)[Permission];
export type RoleTemplate = keyof typeof ROLE_TEMPLATES;
