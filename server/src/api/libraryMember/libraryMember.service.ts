import type { DrizzleClient } from "database";
import { eq, sql, schema, and, ne, desc, count } from "database";
import {
  NotFoundError,
  ConflictError,
  DatabaseError,
  ValidationError,
  ForbiddenError,
} from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { LibraryMember, CreateLibraryMember, UpdateLibraryMember } from "./libraryMember.model.js";

export const LibraryMemberService = {
  findAll: async (drizzle: DrizzleClient, filters?: {
    libraryId?: string;
    userId?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      let whereConditions = [];
      if (filters?.libraryId) {
        whereConditions.push(eq(schema.libraryMember.libraryId, filters.libraryId));
      }
      if (filters?.userId) {
        whereConditions.push(eq(schema.libraryMember.userId, filters.userId));
      }
      if (filters?.role) {
        whereConditions.push(eq(schema.libraryMember.role, filters.role as any));
      }
      if (filters?.isActive !== undefined) {
        whereConditions.push(eq(schema.libraryMember.isActive, filters.isActive));
      }

      const members = await drizzle.query.libraryMember.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit: pageSize,
        offset,
        orderBy: [desc(schema.libraryMember.joinDate)],
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          library: {
            columns: {
              id: true,
              name: true,
              address: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      return ServiceResponse.success("Library members retrieved successfully", members);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve library members: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string) => {
    try {
      const member = await drizzle.query.libraryMember.findFirst({
        where: eq(schema.libraryMember.id, id),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          library: {
            columns: {
              id: true,
              name: true,
              address: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      if (!member) {
        throw new NotFoundError("Library member not found");
      }

      return ServiceResponse.success("Library member retrieved successfully", member);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve library member: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findByLibrary: async (drizzle: DrizzleClient, libraryId: string, page = 1, pageSize = 20) => {
    return LibraryMemberService.findAll(drizzle, { libraryId, page, pageSize });
  },

  findByUser: async (drizzle: DrizzleClient, userId: string, page = 1, pageSize = 20) => {
    return LibraryMemberService.findAll(drizzle, { userId, page, pageSize });
  },

  findUserInLibrary: async (drizzle: DrizzleClient, userId: string, libraryId: string) => {
    try {
      const member = await drizzle.query.libraryMember.findFirst({
        where: and(
          eq(schema.libraryMember.userId, userId),
          eq(schema.libraryMember.libraryId, libraryId)
        ),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          library: {
            columns: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      if (!member) {
        throw new NotFoundError("User is not a member of this library");
      }

      return ServiceResponse.success("Library member retrieved successfully", member);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve library member: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  create: async (drizzle: DrizzleClient, memberData: CreateLibraryMember, invitedBy?: string) => {
    try {
      // Check if user exists
      const user = await drizzle.query.user.findFirst({
        where: eq(schema.user.id, memberData.userId),
      });

      if (!user) {
        const validationError = new ValidationError("User not found");
        return ServiceResponse.failure(validationError.message, { userId: memberData.userId }, validationError.statusCode);
      }

      // Check if library exists
      const library = await drizzle.query.library.findFirst({
        where: eq(schema.library.id, memberData.libraryId),
      });

      if (!library) {
        const validationError = new ValidationError("Library not found");
        return ServiceResponse.failure(validationError.message, { libraryId: memberData.libraryId }, validationError.statusCode);
      }

      // Check if user is already a member of this library
      const existingMember = await drizzle.query.libraryMember.findFirst({
        where: and(
          eq(schema.libraryMember.userId, memberData.userId),
          eq(schema.libraryMember.libraryId, memberData.libraryId)
        ),
      });

      if (existingMember) {
        const conflictError = new ConflictError("User is already a member of this library");
        return ServiceResponse.failure(conflictError.message, { existingMemberId: existingMember.id }, conflictError.statusCode);
      }

      // Validate role permissions if inviter specified
      if (invitedBy && memberData.role && ["owner", "manager"].includes(memberData.role)) {
        const inviterMembership = await drizzle.query.libraryMember.findFirst({
          where: and(
            eq(schema.libraryMember.userId, invitedBy),
            eq(schema.libraryMember.libraryId, memberData.libraryId)
          ),
        });

        if (!inviterMembership || !["owner", "manager"].includes(inviterMembership.role)) {
          const forbiddenError = new ForbiddenError("Insufficient permissions to assign this role");
          return ServiceResponse.failure(forbiddenError.message, { requiredRole: ["owner", "manager"] }, forbiddenError.statusCode);
        }
      }

      const [newMember] = await drizzle
        .insert(schema.libraryMember)
        .values({
          ...memberData,
          invitedBy: invitedBy || memberData.invitedBy,
        })
        .returning();

      return ServiceResponse.success("Library member created successfully", newMember, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create library member: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { memberData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  update: async (drizzle: DrizzleClient, id: string, updateData: UpdateLibraryMember, updatedBy?: string) => {
    try {
      const existingMember = await drizzle.query.libraryMember.findFirst({
        where: eq(schema.libraryMember.id, id),
      });

      if (!existingMember) {
        throw new NotFoundError("Library member not found");
      }

      // Validate role change permissions
      if (updateData.role && updatedBy) {
        const updaterMembership = await drizzle.query.libraryMember.findFirst({
          where: and(
            eq(schema.libraryMember.userId, updatedBy),
            eq(schema.libraryMember.libraryId, existingMember.libraryId)
          ),
        });

        if (!updaterMembership || !["owner", "manager"].includes(updaterMembership.role)) {
          const forbiddenError = new ForbiddenError("Insufficient permissions to update member role");
          return ServiceResponse.failure(forbiddenError.message, { requiredRole: ["owner", "manager"] }, forbiddenError.statusCode);
        }

        // Prevent non-owners from creating/demoting owners
        if (updateData.role === "owner" && updaterMembership.role !== "owner") {
          const forbiddenError = new ForbiddenError("Only owners can assign owner role");
          return ServiceResponse.failure(forbiddenError.message, null, forbiddenError.statusCode);
        }

        if (existingMember.role === "owner" && updaterMembership.role !== "owner") {
          const forbiddenError = new ForbiddenError("Only owners can modify owner memberships");
          return ServiceResponse.failure(forbiddenError.message, null, forbiddenError.statusCode);
        }
      }

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const [updatedMember] = await drizzle
        .update(schema.libraryMember)
        .set(updateFields)
        .where(eq(schema.libraryMember.id, id))
        .returning();

      return ServiceResponse.success("Library member updated successfully", updatedMember);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update library member: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, updateData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  delete: async (drizzle: DrizzleClient, id: string, deletedBy?: string) => {
    try {
      const existingMember = await drizzle.query.libraryMember.findFirst({
        where: eq(schema.libraryMember.id, id),
      });

      if (!existingMember) {
        throw new NotFoundError("Library member not found");
      }

      // Validate permissions for deletion
      if (deletedBy) {
        const deleterMembership = await drizzle.query.libraryMember.findFirst({
          where: and(
            eq(schema.libraryMember.userId, deletedBy),
            eq(schema.libraryMember.libraryId, existingMember.libraryId)
          ),
        });

        if (!deleterMembership || !["owner", "manager"].includes(deleterMembership.role)) {
          const forbiddenError = new ForbiddenError("Insufficient permissions to remove member");
          return ServiceResponse.failure(forbiddenError.message, { requiredRole: ["owner", "manager"] }, forbiddenError.statusCode);
        }

        // Prevent non-owners from removing owners
        if (existingMember.role === "owner" && deleterMembership.role !== "owner") {
          const forbiddenError = new ForbiddenError("Only owners can remove owner memberships");
          return ServiceResponse.failure(forbiddenError.message, null, forbiddenError.statusCode);
        }
      }

      // Check if member has active borrow requests
      const activeBorrows = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.borrowRequest)
        .where(and(
          eq(schema.borrowRequest.userId, existingMember.userId),
          schema.borrowRequest.status.in(["pending", "approved", "borrowed", "overdue"])
        ));

      if (activeBorrows[0].count > 0) {
        const conflictError = new ConflictError("Cannot remove member with active borrow requests");
        return ServiceResponse.failure(conflictError.message, { activeBorrows: activeBorrows[0].count }, conflictError.statusCode);
      }

      await drizzle.delete(schema.libraryMember).where(eq(schema.libraryMember.id, id));

      return ServiceResponse.success("Library member removed successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError || err instanceof ForbiddenError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to remove library member: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, originalError: errorMessage }, dbError.statusCode);
    }
  },

  getWithStats: async (drizzle: DrizzleClient, id: string) => {
    try {
      const member = await drizzle.query.libraryMember.findFirst({
        where: eq(schema.libraryMember.id, id),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          library: {
            columns: {
              id: true,
              name: true,
              address: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      if (!member) {
        throw new NotFoundError("Library member not found");
      }

      // Get borrow statistics
      const borrowStats = await drizzle
        .select({
          status: schema.borrowRequest.status,
          count: sql<number>`count(*)`,
        })
        .from(schema.borrowRequest)
        .where(eq(schema.borrowRequest.userId, member.userId))
        .groupBy(schema.borrowRequest.status);

      let borrowsCount = 0;
      let activeBorrows = 0;
      let overdueBorrows = 0;

      borrowStats.forEach(stat => {
        borrowsCount += stat.count;
        if (["approved", "borrowed"].includes(stat.status)) {
          activeBorrows += stat.count;
        }
        if (stat.status === "overdue") {
          overdueBorrows += stat.count;
        }
      });

      // Get last activity (latest borrow request)
      const lastActivityResult = await drizzle
        .select({
          lastActivity: sql<Date>`MAX(${schema.borrowRequest.requestDate})`,
        })
        .from(schema.borrowRequest)
        .where(eq(schema.borrowRequest.userId, member.userId));

      const memberWithStats = {
        ...member,
        borrowsCount,
        activeBorrows,
        overdueBorrows,
        lastActivity: lastActivityResult[0]?.lastActivity || null,
      };

      return ServiceResponse.success("Library member with stats retrieved successfully", memberWithStats);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve library member stats: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  getLibraryStats: async (drizzle: DrizzleClient, libraryId: string) => {
    try {
      // Get member counts by role
      const memberStats = await drizzle
        .select({
          role: schema.libraryMember.role,
          isActive: schema.libraryMember.isActive,
          count: sql<number>`count(*)`,
        })
        .from(schema.libraryMember)
        .where(eq(schema.libraryMember.libraryId, libraryId))
        .groupBy(schema.libraryMember.role, schema.libraryMember.isActive);

      const stats = {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        owners: 0,
        managers: 0,
        staff: 0,
        members: 0,
      };

      memberStats.forEach(stat => {
        stats.totalMembers += stat.count;
        if (stat.isActive) {
          stats.activeMembers += stat.count;
        } else {
          stats.inactiveMembers += stat.count;
        }

        switch (stat.role) {
          case "owner":
            stats.owners += stat.count;
            break;
          case "manager":
            stats.managers += stat.count;
            break;
          case "staff":
            stats.staff += stat.count;
            break;
          case "member":
            stats.members += stat.count;
            break;
        }
      });

      return ServiceResponse.success("Library member statistics retrieved successfully", stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve library member statistics: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },
};