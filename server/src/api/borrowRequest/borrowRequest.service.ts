import type { DrizzleClient } from "database";
import { eq, sql, schema, and, ne, gte, lte, desc } from "database";
import {
  NotFoundError,
  ConflictError,
  DatabaseError,
  ValidationError,
} from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { BorrowRequest, CreateBorrowRequest, UpdateBorrowRequest } from "./borrowRequest.model.js";

export const BorrowRequestService = {
  findAll: async (drizzle: DrizzleClient, filters?: { 
    userId?: string; 
    libraryId?: string; 
    status?: string; 
    page?: number; 
    pageSize?: number; 
  }) => {
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      let whereConditions = [];
      if (filters?.userId) {
        whereConditions.push(eq(schema.borrowRequest.userId, filters.userId));
      }
      if (filters?.status) {
        whereConditions.push(eq(schema.borrowRequest.status, filters.status as any));
      }
      if (filters?.libraryId) {
        // Join with libraryBooks to filter by library
        whereConditions.push(eq(schema.libraryBooks.libraryId, filters.libraryId));
      }

      const borrowRequestsQuery = drizzle.query.borrowRequest.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit: pageSize,
        offset,
        orderBy: [desc(schema.borrowRequest.requestDate)],
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          libraryBook: {
            with: {
              book: {
                columns: {
                  id: true,
                  title: true,
                  isbn: true,
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
          },
          approver: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      const borrowRequests = await borrowRequestsQuery;
      
      return ServiceResponse.success("Borrow requests retrieved successfully", borrowRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve borrow requests: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string) => {
    try {
      const borrowRequest = await drizzle.query.borrowRequest.findFirst({
        where: eq(schema.borrowRequest.id, id),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          libraryBook: {
            with: {
              book: {
                columns: {
                  id: true,
                  title: true,
                  isbn: true,
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
          },
          approver: {
            columns: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      if (!borrowRequest) {
        throw new NotFoundError("Borrow request not found");
      }

      return ServiceResponse.success("Borrow request retrieved successfully", borrowRequest);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve borrow request: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findByUser: async (drizzle: DrizzleClient, userId: string, page = 1, pageSize = 20) => {
    return BorrowRequestService.findAll(drizzle, { userId, page, pageSize });
  },

  findByLibrary: async (drizzle: DrizzleClient, libraryId: string, page = 1, pageSize = 20) => {
    return BorrowRequestService.findAll(drizzle, { libraryId, page, pageSize });
  },

  create: async (drizzle: DrizzleClient, userId: string, requestData: CreateBorrowRequest) => {
    try {
      // Validate library book exists and is available
      const libraryBook = await drizzle.query.libraryBooks.findFirst({
        where: eq(schema.libraryBooks.id, requestData.libraryBookId),
      });

      if (!libraryBook) {
        const validationError = new ValidationError("Library book not found");
        return ServiceResponse.failure(validationError.message, { libraryBookId: requestData.libraryBookId }, validationError.statusCode);
      }

      if (libraryBook.availableQuantity <= 0) {
        const conflictError = new ConflictError("Library book is not available for borrowing");
        return ServiceResponse.failure(conflictError.message, { availableQuantity: libraryBook.availableQuantity }, conflictError.statusCode);
      }

      // Check if user already has a pending/approved request for this book
      const existingRequest = await drizzle.query.borrowRequest.findFirst({
        where: and(
          eq(schema.borrowRequest.userId, userId),
          eq(schema.borrowRequest.libraryBookId, requestData.libraryBookId),
          schema.borrowRequest.status.in(["pending", "approved", "borrowed"])
        ),
      });

      if (existingRequest) {
        const conflictError = new ConflictError("You already have an active request for this book");
        return ServiceResponse.failure(conflictError.message, { existingRequestId: existingRequest.id }, conflictError.statusCode);
      }

      const [newBorrowRequest] = await drizzle
        .insert(schema.borrowRequest)
        .values({
          userId,
          libraryBookId: requestData.libraryBookId,
          notes: requestData.notes,
          status: "pending",
        })
        .returning();

      return ServiceResponse.success("Borrow request created successfully", newBorrowRequest, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create borrow request: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { requestData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  update: async (drizzle: DrizzleClient, id: string, updateData: UpdateBorrowRequest, updatedBy?: string) => {
    try {
      const existingRequest = await drizzle.query.borrowRequest.findFirst({
        where: eq(schema.borrowRequest.id, id),
        with: {
          libraryBook: true,
        },
      });

      if (!existingRequest) {
        throw new NotFoundError("Borrow request not found");
      }

      // Handle status transitions
      const updateFields: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      if (updateData.status) {
        switch (updateData.status) {
          case "approved":
            updateFields.approvedDate = new Date();
            updateFields.approvedBy = updatedBy;
            // Set due date to 2 weeks from approval if not specified
            if (!updateData.dueDate) {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 14);
              updateFields.dueDate = dueDate;
            }
            break;
          case "borrowed":
            // Decrease available quantity
            if (existingRequest.status === "approved") {
              await drizzle
                .update(schema.libraryBooks)
                .set({
                  availableQuantity: sql`${schema.libraryBooks.availableQuantity} - 1`,
                })
                .where(eq(schema.libraryBooks.id, existingRequest.libraryBookId));
            }
            break;
          case "returned":
            updateFields.returnDate = new Date();
            // Increase available quantity back
            if (existingRequest.status === "borrowed" || existingRequest.status === "overdue") {
              await drizzle
                .update(schema.libraryBooks)
                .set({
                  availableQuantity: sql`${schema.libraryBooks.availableQuantity} + 1`,
                })
                .where(eq(schema.libraryBooks.id, existingRequest.libraryBookId));
            }
            break;
          case "rejected":
            // No additional actions needed
            break;
        }
      }

      const [updatedRequest] = await drizzle
        .update(schema.borrowRequest)
        .set(updateFields)
        .where(eq(schema.borrowRequest.id, id))
        .returning();

      return ServiceResponse.success("Borrow request updated successfully", updatedRequest);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update borrow request: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, updateData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  delete: async (drizzle: DrizzleClient, id: string) => {
    try {
      const existingRequest = await drizzle.query.borrowRequest.findFirst({
        where: eq(schema.borrowRequest.id, id),
      });

      if (!existingRequest) {
        throw new NotFoundError("Borrow request not found");
      }

      // Only allow deletion of pending or rejected requests
      if (!["pending", "rejected"].includes(existingRequest.status)) {
        const conflictError = new ConflictError("Cannot delete active borrow request");
        return ServiceResponse.failure(conflictError.message, { status: existingRequest.status }, conflictError.statusCode);
      }

      await drizzle.delete(schema.borrowRequest).where(eq(schema.borrowRequest.id, id));

      return ServiceResponse.success("Borrow request deleted successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete borrow request: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, originalError: errorMessage }, dbError.statusCode);
    }
  },

  getStats: async (drizzle: DrizzleClient, filters?: { userId?: string; libraryId?: string }) => {
    try {
      let whereConditions = [];
      if (filters?.userId) {
        whereConditions.push(eq(schema.borrowRequest.userId, filters.userId));
      }
      if (filters?.libraryId) {
        // This would require a join - simplified for now
      }

      const stats = await drizzle
        .select({
          status: schema.borrowRequest.status,
          count: sql<number>`count(*)`,
        })
        .from(schema.borrowRequest)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .groupBy(schema.borrowRequest.status);

      const statsMap = {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        borrowedBooks: 0,
        overdueBooks: 0,
        returnedBooks: 0,
      };

      stats.forEach(stat => {
        statsMap.totalRequests += stat.count;
        switch (stat.status) {
          case "pending":
            statsMap.pendingRequests = stat.count;
            break;
          case "approved":
            statsMap.approvedRequests = stat.count;
            break;
          case "rejected":
            statsMap.rejectedRequests = stat.count;
            break;
          case "borrowed":
            statsMap.borrowedBooks = stat.count;
            break;
          case "overdue":
            statsMap.overdueBooks = stat.count;
            break;
          case "returned":
            statsMap.returnedBooks = stat.count;
            break;
        }
      });

      return ServiceResponse.success("Borrow request statistics retrieved successfully", statsMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve borrow request statistics: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  markOverdue: async (drizzle: DrizzleClient) => {
    try {
      const now = new Date();
      const [updatedRequests] = await drizzle
        .update(schema.borrowRequest)
        .set({
          status: "overdue",
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.borrowRequest.status, "borrowed"),
            lte(schema.borrowRequest.dueDate, now)
          )
        )
        .returning();

      return ServiceResponse.success("Overdue requests updated successfully", { updatedCount: updatedRequests?.length || 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to mark overdue requests: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },
};