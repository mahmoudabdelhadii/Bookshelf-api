import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const userRoleEnum = z.enum(["user", "admin"]).openapi({ description: "User role in the system" });

export const libraryMemberRoleEnum = z
  .enum(["owner", "manager", "staff", "member"])
  .openapi({ description: "User role within a specific library" });

export const borrowRequestStatusEnum = z
  .enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"])
  .openapi({ description: "Status of a borrow request" });

export const bookConditionEnum = z
  .enum(["new", "excellent", "good", "fair", "poor"])
  .openapi({ description: "Physical condition of a book" });

export const bookLanguageEnum = z
  .enum(["en", "ar", "other"])
  .openapi({ description: "Language of the book" });

export const searchTypeEnum = z
  .enum(["books", "authors", "publishers", "libraries", "all"])
  .openapi({ description: "Type of entity to search for" });

export const importSourceEnum = z
  .enum(["isbn", "csv", "json"])
  .openapi({ description: "Source type for book imports" });

export const auditActionEnum = z
  .enum(["create", "read", "update", "delete", "login", "logout", "borrow", "return", "approve", "reject"])
  .openapi({ description: "Type of action for audit logging" });

export const notificationTypeEnum = z
  .enum([
    "borrow_request",
    "borrow_approved",
    "borrow_rejected",
    "due_reminder",
    "overdue_notice",
    "return_confirmation",
    "library_invitation",
    "system_announcement",
  ])
  .openapi({ description: "Type of notification" });

export const permissionEnum = z
  .enum([
    "read_books",
    "add_books",
    "edit_books",
    "delete_books",
    "manage_members",
    "manage_requests",
    "view_stats",
    "manage_library",
    "admin_access",
  ])
  .openapi({ description: "Available permissions for library members" });

// Re-export individual enum types for TypeScript
export type UserRole = z.infer<typeof userRoleEnum>;
export type LibraryMemberRole = z.infer<typeof libraryMemberRoleEnum>;
export type BorrowRequestStatus = z.infer<typeof borrowRequestStatusEnum>;
export type BookCondition = z.infer<typeof bookConditionEnum>;
export type BookLanguage = z.infer<typeof bookLanguageEnum>;
export type SearchType = z.infer<typeof searchTypeEnum>;
export type ImportSource = z.infer<typeof importSourceEnum>;
export type AuditAction = z.infer<typeof auditActionEnum>;
export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type Permission = z.infer<typeof permissionEnum>;

// Grouped enum exports for convenience
export const enums = {
  userRole: userRoleEnum,
  libraryMemberRole: libraryMemberRoleEnum,
  borrowRequestStatus: borrowRequestStatusEnum,
  bookCondition: bookConditionEnum,
  bookLanguage: bookLanguageEnum,
  searchType: searchTypeEnum,
  importSource: importSourceEnum,
  auditAction: auditActionEnum,
  notificationType: notificationTypeEnum,
  permission: permissionEnum,
} as const;
