import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { borrowRequestRouter } from "../borrowRequest.router.js";
import { BorrowRequestService } from "../borrowRequest.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

// Mock the BorrowRequestService
const mockBorrowRequestService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  markAsBorrowed: vi.fn(),
  markAsReturned: vi.fn(),
  markAsOverdue: vi.fn(),
  getUserRequests: vi.fn(),
  getLibraryRequests: vi.fn(),
  getStatistics: vi.fn(),
  sendReminder: vi.fn(),
  renewRequest: vi.fn(),
  bulkUpdate: vi.fn(),
};

Object.assign(BorrowRequestService, mockBorrowRequestService);

const mockBorrowRequest = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  userId: "user-123",
  libraryBookId: "lib-book-123",
  requestDate: new Date("2024-01-01T00:00:00.000Z"),
  approvedDate: new Date("2024-01-02T00:00:00.000Z"),
  approvedBy: "admin-123",
  dueDate: new Date("2024-01-16T00:00:00.000Z"),
  returnDate: null,
  status: "borrowed" as const,
  notes: "Test borrow request",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

const mockUser = {
  id: "user-123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
};

const mockLibraryBook = {
  id: "lib-book-123",
  title: "Test Book",
  quantity: 5,
  libraryId: "library-123",
};

const mockBorrowRequestWithDetails = {
  ...mockBorrowRequest,
  user: mockUser,
  libraryBook: mockLibraryBook,
};

describe("BorrowRequest Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("borrow-request-router-test");
    drizzle = testDb.drizzle;
    closeDb = testDb.close;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _, next) => {
      req.drizzle = drizzle;
      req.user = {
        id: "user-123",
        username: "testuser",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "member",
        permissions: ["read", "borrow"],
        isActive: true,
        isEmailVerified: true,
        isSuspended: false,
      };
      next();
    });
    app.use("/borrow-requests", borrowRequestRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /borrow-requests", () => {
    it("should get all borrow requests successfully", async () => {
      const mockRequests = [mockBorrowRequestWithDetails];
      const mockResponse: ServiceResponse<typeof mockRequests> = {
        success: true,
        message: "Borrow requests retrieved successfully",
        responseObject: mockRequests,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].status).toBe("borrowed");
      expect(mockBorrowRequestService.findAll).toHaveBeenCalledOnce();
    });

    it("should handle pagination parameters", async () => {
      const mockRequests = [mockBorrowRequestWithDetails];
      const mockResponse: ServiceResponse<typeof mockRequests> = {
        success: true,
        message: "Borrow requests retrieved successfully",
        responseObject: mockRequests,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests?page=1&limit=10")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockBorrowRequestService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle status filtering", async () => {
      const mockRequests = [mockBorrowRequestWithDetails];
      const mockResponse: ServiceResponse<typeof mockRequests> = {
        success: true,
        message: "Borrow requests retrieved successfully",
        responseObject: mockRequests,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests?status=pending&userId=user-123")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockBorrowRequestService.findAll).toHaveBeenCalledWith({
        status: "pending",
        userId: "user-123",
      });
    });

    it("should return empty array when no requests found", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No borrow requests found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /borrow-requests/:id", () => {
    it("should get borrow request by id successfully", async () => {
      const mockResponse: ServiceResponse<typeof mockBorrowRequestWithDetails> = {
        success: true,
        message: "Borrow request found successfully",
        responseObject: mockBorrowRequestWithDetails,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/borrow-requests/${mockBorrowRequest.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("borrowed");
      expect(mockBorrowRequestService.findById).toHaveBeenCalledWith(mockBorrowRequest.id);
    });

    it("should return 404 for non-existent request", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Borrow request not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockBorrowRequestService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/borrow-requests/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Borrow request not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .get(`/borrow-requests/${invalidId}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /borrow-requests", () => {
    it("should create borrow request successfully", async () => {
      const newRequestData = {
        libraryBookId: "lib-book-456",
        notes: "Would like to borrow this book",
      };

      const createdRequest = {
        ...newRequestData,
        id: "456e7890-e89b-12d3-a456-426614174000",
        userId: "user-123",
        status: "pending" as const,
        requestDate: new Date("2024-01-01T00:00:00.000Z"),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdRequest> = {
        success: true,
        message: "Borrow request created successfully",
        responseObject: createdRequest,
        statusCode: StatusCodes.CREATED,
      };

      mockBorrowRequestService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/borrow-requests")
        .send(newRequestData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("pending");
      expect(mockBorrowRequestService.create).toHaveBeenCalledWith({
        ...newRequestData,
        userId: "user-123",
      });
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        notes: "Missing library book ID",
      };

      const response = await request(app)
        .post("/borrow-requests")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate active request", async () => {
      const duplicateData = {
        libraryBookId: "lib-book-123",
        notes: "Duplicate request",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Active borrow request already exists for this book",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/borrow-requests")
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active borrow request already exists for this book");
    });

    it("should return 400 for unavailable book", async () => {
      const unavailableBookData = {
        libraryBookId: "lib-book-unavailable",
        notes: "Trying to borrow unavailable book",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Book is not available for borrowing",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockBorrowRequestService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/borrow-requests")
        .send(unavailableBookData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /borrow-requests/:id", () => {
    it("should update borrow request successfully", async () => {
      const updateData = {
        notes: "Updated notes for borrow request",
      };

      const updatedRequest = {
        ...mockBorrowRequest,
        ...updateData,
        updatedAt: new Date("2024-01-03T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedRequest> = {
        success: true,
        message: "Borrow request updated successfully",
        responseObject: updatedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/borrow-requests/${mockBorrowRequest.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.notes).toBe("Updated notes for borrow request");
      expect(mockBorrowRequestService.update).toHaveBeenCalledWith(mockBorrowRequest.id, updateData);
    });

    it("should return 404 for non-existent request", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const updateData = {
        notes: "Updated notes",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Borrow request not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockBorrowRequestService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/borrow-requests/${nonExistentId}`)
        .send(updateData)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 403 when user tries to update others request", async () => {
      const otherUserRequest = {
        ...mockBorrowRequest,
        userId: "other-user-123",
      };

      const updateData = {
        notes: "Trying to update other user's request",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Not authorized to update this request",
        responseObject: null,
        statusCode: StatusCodes.FORBIDDEN,
      };

      mockBorrowRequestService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/borrow-requests/${otherUserRequest.id}`)
        .send(updateData)
        .expect(StatusCodes.FORBIDDEN);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /borrow-requests/:id", () => {
    it("should delete borrow request successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Borrow request deleted successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/borrow-requests/${mockBorrowRequest.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Borrow request deleted successfully");
      expect(mockBorrowRequestService.delete).toHaveBeenCalledWith(mockBorrowRequest.id);
    });

    it("should return 404 for non-existent request", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Borrow request not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockBorrowRequestService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/borrow-requests/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 when trying to delete borrowed book", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot delete request for book that is currently borrowed",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/borrow-requests/${mockBorrowRequest.id}`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /borrow-requests/:id/approve", () => {
    it("should approve borrow request successfully", async () => {
      const approvalData = {
        dueDate: "2024-01-16T00:00:00.000Z",
        notes: "Approved by librarian",
      };

      const approvedRequest = {
        ...mockBorrowRequest,
        status: "approved" as const,
        approvedDate: new Date("2024-01-02T00:00:00.000Z"),
        approvedBy: "user-123",
        dueDate: new Date(approvalData.dueDate),
      };

      const mockResponse: ServiceResponse<typeof approvedRequest> = {
        success: true,
        message: "Borrow request approved successfully",
        responseObject: approvedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.approve.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/approve`)
        .send(approvalData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("approved");
      expect(mockBorrowRequestService.approve).toHaveBeenCalledWith(
        mockBorrowRequest.id,
        "user-123",
        approvalData
      );
    });

    it("should return 400 for missing due date", async () => {
      const invalidData = {
        notes: "Missing due date",
      };

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/approve`)
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for already processed request", async () => {
      const approvalData = {
        dueDate: "2024-01-16T00:00:00.000Z",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Request has already been processed",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.approve.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/approve`)
        .send(approvalData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /borrow-requests/:id/reject", () => {
    it("should reject borrow request successfully", async () => {
      const rejectionData = {
        reason: "Book is damaged and unavailable",
      };

      const rejectedRequest = {
        ...mockBorrowRequest,
        status: "rejected" as const,
        notes: rejectionData.reason,
      };

      const mockResponse: ServiceResponse<typeof rejectedRequest> = {
        success: true,
        message: "Borrow request rejected successfully",
        responseObject: rejectedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.reject.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/reject`)
        .send(rejectionData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("rejected");
      expect(mockBorrowRequestService.reject).toHaveBeenCalledWith(
        mockBorrowRequest.id,
        "user-123",
        rejectionData
      );
    });

    it("should return 400 for missing rejection reason", async () => {
      const invalidData = {};

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/reject`)
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /borrow-requests/:id/borrow", () => {
    it("should mark request as borrowed successfully", async () => {
      const borrowedRequest = {
        ...mockBorrowRequest,
        status: "borrowed" as const,
      };

      const mockResponse: ServiceResponse<typeof borrowedRequest> = {
        success: true,
        message: "Book marked as borrowed successfully",
        responseObject: borrowedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.markAsBorrowed.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/borrow`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("borrowed");
      expect(mockBorrowRequestService.markAsBorrowed).toHaveBeenCalledWith(mockBorrowRequest.id);
    });

    it("should return 409 for unapproved request", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Request must be approved before marking as borrowed",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.markAsBorrowed.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/borrow`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /borrow-requests/:id/return", () => {
    it("should mark request as returned successfully", async () => {
      const returnData = {
        condition: "Good",
        notes: "Book returned in good condition",
      };

      const returnedRequest = {
        ...mockBorrowRequest,
        status: "returned" as const,
        returnDate: new Date("2024-01-15T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof returnedRequest> = {
        success: true,
        message: "Book marked as returned successfully",
        responseObject: returnedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.markAsReturned.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/return`)
        .send(returnData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.status).toBe("returned");
      expect(mockBorrowRequestService.markAsReturned).toHaveBeenCalledWith(
        mockBorrowRequest.id,
        returnData
      );
    });

    it("should return 409 for book not borrowed", async () => {
      const returnData = {
        condition: "Good",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Book is not currently borrowed",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.markAsReturned.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/return`)
        .send(returnData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /borrow-requests/user/:userId", () => {
    it("should get user borrow requests successfully", async () => {
      const userId = "user-123";
      const mockRequests = [mockBorrowRequestWithDetails];
      const mockResponse: ServiceResponse<typeof mockRequests> = {
        success: true,
        message: "User borrow requests retrieved successfully",
        responseObject: mockRequests,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.getUserRequests.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/borrow-requests/user/${userId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockBorrowRequestService.getUserRequests).toHaveBeenCalledWith(userId);
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentUserId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "User not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockBorrowRequestService.getUserRequests.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/borrow-requests/user/${nonExistentUserId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /borrow-requests/library/:libraryId", () => {
    it("should get library borrow requests successfully", async () => {
      const libraryId = "library-123";
      const mockRequests = [mockBorrowRequestWithDetails];
      const mockResponse: ServiceResponse<typeof mockRequests> = {
        success: true,
        message: "Library borrow requests retrieved successfully",
        responseObject: mockRequests,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.getLibraryRequests.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/borrow-requests/library/${libraryId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockBorrowRequestService.getLibraryRequests).toHaveBeenCalledWith(libraryId);
    });
  });

  describe("GET /borrow-requests/statistics", () => {
    it("should get borrow request statistics successfully", async () => {
      const mockStats = {
        totalRequests: 100,
        pendingRequests: 15,
        approvedRequests: 20,
        borrowedBooks: 50,
        overdueBooks: 5,
        returnedBooks: 10,
        avgProcessingTime: "2 days",
        popularBooks: ["Book 1", "Book 2"],
      };

      const mockResponse: ServiceResponse<typeof mockStats> = {
        success: true,
        message: "Statistics retrieved successfully",
        responseObject: mockStats,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.getStatistics.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests/statistics")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.totalRequests).toBe(100);
      expect(response.body.responseObject.overdueBooks).toBe(5);
      expect(mockBorrowRequestService.getStatistics).toHaveBeenCalledOnce();
    });
  });

  describe("POST /borrow-requests/:id/renew", () => {
    it("should renew borrow request successfully", async () => {
      const renewData = {
        newDueDate: "2024-01-30T00:00:00.000Z",
        reason: "Need more time to read",
      };

      const renewedRequest = {
        ...mockBorrowRequest,
        dueDate: new Date(renewData.newDueDate),
        notes: `${mockBorrowRequest.notes} - Renewed: ${renewData.reason}`,
      };

      const mockResponse: ServiceResponse<typeof renewedRequest> = {
        success: true,
        message: "Borrow request renewed successfully",
        responseObject: renewedRequest,
        statusCode: StatusCodes.OK,
      };

      mockBorrowRequestService.renewRequest.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/renew`)
        .send(renewData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockBorrowRequestService.renewRequest).toHaveBeenCalledWith(
        mockBorrowRequest.id,
        renewData
      );
    });

    it("should return 409 for overdue book", async () => {
      const renewData = {
        newDueDate: "2024-01-30T00:00:00.000Z",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot renew overdue book",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockBorrowRequestService.renewRequest.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/borrow-requests/${mockBorrowRequest.id}/renew`)
        .send(renewData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors gracefully", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      };

      mockBorrowRequestService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/borrow-requests")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle database connection errors", async () => {
      mockBorrowRequestService.findAll.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .get("/borrow-requests")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });
});