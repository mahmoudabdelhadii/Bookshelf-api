import type { DrizzleClient } from "database";
import { eq, sql, schema, and, lte, desc, inArray, count } from "database";
import { NotFoundError, ConflictError, DatabaseError, ValidationError } from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { CreateBorrowRequest, UpdateBorrowRequest } from "./borrowRequest.model.js";

export const BorrowRequestService = {
  findAll: async (
    drizzle: DrizzleClient,
    filters?: {
      userId?: string;
      libraryId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ) => {
    try {
      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const whereConditions = [];
      if (filters?.userId) {
        whereConditions.push(eq(schema.borrowRequest.userId, filters.userId));
      }
      if (filters?.status) {
        whereConditions.push(eq(schema.borrowRequest.status, filters.status as any));
      }
      if (filters?.libraryId) {
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
              firstName: true,
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
              firstName: true,
            },
          },
          rejecter: {
            columns: {
              id: true,
              email: true,
              firstName: true,
            },
          },
          returner: {
            columns: {
              id: true,
              email: true,
              firstName: true,
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
              firstName: true,
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
              firstName: true,
            },
          },
          rejecter: {
            columns: {
              id: true,
              email: true,
              firstName: true,
            },
          },
          returner: {
            columns: {
              id: true,
              email: true,
              firstName: true,
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
      const libraryBook = await drizzle.query.libraryBooks.findFirst({
        where: eq(schema.libraryBooks.id, requestData.libraryBookId),
      });

      if (!libraryBook) {
        const validationError = new ValidationError("Library book not found");
        return ServiceResponse.failure(
          validationError.message,
          { libraryBookId: requestData.libraryBookId },
          validationError.statusCode,
        );
      }

      const [borrowedCount] = await drizzle
        .select({ count: count() })
        .from(schema.borrowRequest)
        .where(
          and(
            eq(schema.borrowRequest.libraryBookId, requestData.libraryBookId),
            inArray(schema.borrowRequest.status, ["borrowed", "overdue"]),
          ),
        );

      const availableQuantity = libraryBook.quantity - (borrowedCount.count ?? 0);

      if (availableQuantity <= 0) {
        const conflictError = new ConflictError("Library book is not available for borrowing");
        return ServiceResponse.failure(
          conflictError.message,
          { availableQuantity },
          conflictError.statusCode,
        );
      }

      const existingRequest = await drizzle.query.borrowRequest.findFirst({
        where: and(
          eq(schema.borrowRequest.userId, userId),
          eq(schema.borrowRequest.libraryBookId, requestData.libraryBookId),
          inArray(schema.borrowRequest.status, ["pending", "approved", "borrowed"]),
        ),
      });

      if (existingRequest) {
        const conflictError = new ConflictError("You already have an active request for this book");
        return ServiceResponse.failure(
          conflictError.message,
          { existingRequestId: existingRequest.id },
          conflictError.statusCode,
        );
      }

      // Calculate due date (default 14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const [newBorrowRequest] = await drizzle
        .insert(schema.borrowRequest)
        .values({
          userId,
          libraryBookId: requestData.libraryBookId,
          dueDate,
          notes: requestData.notes,
          status: "pending",
        })
        .returning();

      return ServiceResponse.success("Borrow request created successfully", newBorrowRequest, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create borrow request: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { requestData, originalError: errorMessage },
        dbError.statusCode,
      );
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

      const updateFields: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      if (updateData.status) {
        switch (updateData.status) {
          case "approved":
            updateFields.approvedBy = updatedBy;
            // dueDate should already be set when creating the request
            if (updateData.dueDate) {
              updateFields.dueDate = updateData.dueDate;
            }
            break;
          case "borrowed":
            // No additional fields needed for borrowed status
            break;
          case "returned":
            updateFields.returnDate = new Date();
            updateFields.returnedBy = updatedBy;
            break;
          case "rejected":
            updateFields.rejectedBy = updatedBy;
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
      return ServiceResponse.failure(
        dbError.message,
        { id, updateData, originalError: errorMessage },
        dbError.statusCode,
      );
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

      if (!["pending", "rejected"].includes(existingRequest.status)) {
        const conflictError = new ConflictError("Cannot delete active borrow request");
        return ServiceResponse.failure(
          conflictError.message,
          { status: existingRequest.status },
          conflictError.statusCode,
        );
      }

      await drizzle.delete(schema.borrowRequest).where(eq(schema.borrowRequest.id, id));

      return ServiceResponse.success("Borrow request deleted successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete borrow request: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  getStats: async (drizzle: DrizzleClient, filters?: { userId?: string; libraryId?: string }) => {
    try {
      const whereConditions = [];
      if (filters?.userId) {
        whereConditions.push(eq(schema.borrowRequest.userId, filters.userId));
      }
      if (filters?.libraryId) {
        whereConditions.push(eq(schema.libraryBooks.libraryId, filters.libraryId));
      }

      let statsQuery = drizzle
        .select({
          status: schema.borrowRequest.status,
          count: sql<number>`count(*)`,
        })
        .from(schema.borrowRequest)
        .$dynamic();

      if (filters?.libraryId) {
        statsQuery = statsQuery.innerJoin(
          schema.libraryBooks,
          eq(schema.borrowRequest.libraryBookId, schema.libraryBooks.id),
        );
      }

      const stats = await statsQuery
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

      for (const stat of stats) {
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
      }

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
      const updatedRequests = await drizzle
        .update(schema.borrowRequest)
        .set({
          status: "overdue",
        })
        .where(and(eq(schema.borrowRequest.status, "borrowed"), lte(schema.borrowRequest.dueDate, now)))
        .returning();

      return ServiceResponse.success("Overdue requests updated successfully", {
        updatedCount: updatedRequests.length ?? 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to mark overdue requests: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },
};
