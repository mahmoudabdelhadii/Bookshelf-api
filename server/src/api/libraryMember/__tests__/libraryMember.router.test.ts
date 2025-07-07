import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { libraryMemberRouter } from "../libraryMember.router.js";
import { LibraryMemberService } from "../libraryMember.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

// Mock the LibraryMemberService
const mockLibraryMemberService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getLibraryMembers: vi.fn(),
  getUserMemberships: vi.fn(),
  updateRole: vi.fn(),
  updatePermissions: vi.fn(),
  deactivateMember: vi.fn(),
  activateMember: vi.fn(),
  transferOwnership: vi.fn(),
  inviteMember: vi.fn(),
  acceptInvitation: vi.fn(),
  getInvitations: vi.fn(),
  bulkUpdate: vi.fn(),
  getMemberStatistics: vi.fn(),
};

Object.assign(LibraryMemberService, mockLibraryMemberService);

const mockLibraryMember = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  userId: "user-123",
  libraryId: "library-123",
  role: "member" as const,
  permissions: ["read", "borrow"],
  joinDate: new Date("2024-01-01T00:00:00.000Z"),
  isActive: true,
  invitedBy: "admin-123",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockUser = {
  id: "user-123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
};

const mockLibrary = {
  id: "library-123",
  name: "Central Library",
  address: "123 Main St",
  city: "Test City",
};

const mockLibraryMemberWithDetails = {
  ...mockLibraryMember,
  user: mockUser,
  library: mockLibrary,
};

describe("LibraryMember Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("library-member-router-test");
    drizzle = testDb.drizzle;
    closeDb = testDb.close;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _, next) => {
      req.drizzle = drizzle;
      req.user = {
        id: "admin-123",
        username: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        permissions: ["read", "write", "admin"],
        isActive: true,
        isEmailVerified: true,
        isSuspended: false,
      };
      next();
    });
    app.use("/library-members", libraryMemberRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /library-members", () => {
    it("should get all library members successfully", async () => {
      const mockMembers = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMembers> = {
        success: true,
        message: "Library members retrieved successfully",
        responseObject: mockMembers,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/library-members")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].role).toBe("member");
      expect(mockLibraryMemberService.findAll).toHaveBeenCalledOnce();
    });

    it("should handle pagination parameters", async () => {
      const mockMembers = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMembers> = {
        success: true,
        message: "Library members retrieved successfully",
        responseObject: mockMembers,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/library-members?page=1&limit=10")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockLibraryMemberService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle filtering parameters", async () => {
      const mockMembers = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMembers> = {
        success: true,
        message: "Library members retrieved successfully",
        responseObject: mockMembers,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/library-members?libraryId=library-123&role=member&isActive=true")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockLibraryMemberService.findAll).toHaveBeenCalledWith({
        libraryId: "library-123",
        role: "member",
        isActive: true,
      });
    });

    it("should return empty array when no members found", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No library members found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/library-members")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /library-members/:id", () => {
    it("should get library member by id successfully", async () => {
      const mockResponse: ServiceResponse<typeof mockLibraryMemberWithDetails> = {
        success: true,
        message: "Library member found successfully",
        responseObject: mockLibraryMemberWithDetails,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/${mockLibraryMember.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.role).toBe("member");
      expect(mockLibraryMemberService.findById).toHaveBeenCalledWith(mockLibraryMember.id);
    });

    it("should return 404 for non-existent member", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Library member not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockLibraryMemberService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Library member not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .get(`/library-members/${invalidId}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /library-members", () => {
    it("should create library member successfully", async () => {
      const newMemberData = {
        userId: "user-456",
        libraryId: "library-123",
        role: "member" as const,
        permissions: ["read", "borrow"],
      };

      const createdMember = {
        ...newMemberData,
        id: "456e7890-e89b-12d3-a456-426614174000",
        joinDate: new Date("2024-01-01T00:00:00.000Z"),
        isActive: true,
        invitedBy: "admin-123",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdMember> = {
        success: true,
        message: "Library member created successfully",
        responseObject: createdMember,
        statusCode: StatusCodes.CREATED,
      };

      mockLibraryMemberService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/library-members")
        .send(newMemberData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.role).toBe("member");
      expect(mockLibraryMemberService.create).toHaveBeenCalledWith({
        ...newMemberData,
        invitedBy: "admin-123",
      });
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        libraryId: "library-123",
        // Missing userId
      };

      const response = await request(app)
        .post("/library-members")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate membership", async () => {
      const duplicateData = {
        userId: "user-123",
        libraryId: "library-123",
        role: "member" as const,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "User is already a member of this library",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockLibraryMemberService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/library-members")
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User is already a member of this library");
    });

    it("should return 400 for invalid role", async () => {
      const invalidData = {
        userId: "user-456",
        libraryId: "library-123",
        role: "invalid-role",
      };

      const response = await request(app)
        .post("/library-members")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /library-members/:id", () => {
    it("should update library member successfully", async () => {
      const updateData = {
        role: "staff" as const,
        permissions: ["read", "write", "borrow"],
      };

      const updatedMember = {
        ...mockLibraryMember,
        ...updateData,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedMember> = {
        success: true,
        message: "Library member updated successfully",
        responseObject: updatedMember,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.role).toBe("staff");
      expect(mockLibraryMemberService.update).toHaveBeenCalledWith(mockLibraryMember.id, updateData);
    });

    it("should return 404 for non-existent member", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const updateData = {
        role: "staff" as const,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Library member not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockLibraryMemberService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${nonExistentId}`)
        .send(updateData)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 403 for insufficient permissions", async () => {
      const updateData = {
        role: "owner" as const,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Insufficient permissions to perform this action",
        responseObject: null,
        statusCode: StatusCodes.FORBIDDEN,
      };

      mockLibraryMemberService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}`)
        .send(updateData)
        .expect(StatusCodes.FORBIDDEN);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /library-members/:id", () => {
    it("should delete library member successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Library member removed successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/library-members/${mockLibraryMember.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Library member removed successfully");
      expect(mockLibraryMemberService.delete).toHaveBeenCalledWith(mockLibraryMember.id);
    });

    it("should return 404 for non-existent member", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Library member not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockLibraryMemberService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/library-members/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 when trying to remove library owner", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot remove library owner",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockLibraryMemberService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/library-members/${mockLibraryMember.id}`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cannot remove library owner");
    });
  });

  describe("GET /library-members/library/:libraryId", () => {
    it("should get library members by library ID successfully", async () => {
      const libraryId = "library-123";
      const mockMembers = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMembers> = {
        success: true,
        message: "Library members retrieved successfully",
        responseObject: mockMembers,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.getLibraryMembers.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/library/${libraryId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockLibraryMemberService.getLibraryMembers).toHaveBeenCalledWith(libraryId);
    });

    it("should handle role filtering for library members", async () => {
      const libraryId = "library-123";
      const mockMembers = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMembers> = {
        success: true,
        message: "Library members retrieved successfully",
        responseObject: mockMembers,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.getLibraryMembers.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/library/${libraryId}?role=staff&isActive=true`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockLibraryMemberService.getLibraryMembers).toHaveBeenCalledWith(libraryId, {
        role: "staff",
        isActive: true,
      });
    });

    it("should return 404 for non-existent library", async () => {
      const nonExistentLibraryId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Library not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockLibraryMemberService.getLibraryMembers.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/library/${nonExistentLibraryId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /library-members/user/:userId", () => {
    it("should get user memberships successfully", async () => {
      const userId = "user-123";
      const mockMemberships = [mockLibraryMemberWithDetails];
      const mockResponse: ServiceResponse<typeof mockMemberships> = {
        success: true,
        message: "User memberships retrieved successfully",
        responseObject: mockMemberships,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.getUserMemberships.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/user/${userId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockLibraryMemberService.getUserMemberships).toHaveBeenCalledWith(userId);
    });

    it("should return empty array for user with no memberships", async () => {
      const userId = "user-without-memberships";
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No memberships found for user",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.getUserMemberships.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/user/${userId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("PUT /library-members/:id/role", () => {
    it("should update member role successfully", async () => {
      const roleData = {
        role: "manager" as const,
      };

      const updatedMember = {
        ...mockLibraryMember,
        role: "manager" as const,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedMember> = {
        success: true,
        message: "Member role updated successfully",
        responseObject: updatedMember,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.updateRole.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}/role`)
        .send(roleData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.role).toBe("manager");
      expect(mockLibraryMemberService.updateRole).toHaveBeenCalledWith(
        mockLibraryMember.id,
        "manager",
        "admin-123"
      );
    });

    it("should return 400 for invalid role", async () => {
      const invalidRoleData = {
        role: "invalid-role",
      };

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}/role`)
        .send(invalidRoleData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 403 for insufficient permissions", async () => {
      const roleData = {
        role: "owner" as const,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Insufficient permissions to assign this role",
        responseObject: null,
        statusCode: StatusCodes.FORBIDDEN,
      };

      mockLibraryMemberService.updateRole.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}/role`)
        .send(roleData)
        .expect(StatusCodes.FORBIDDEN);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /library-members/:id/permissions", () => {
    it("should update member permissions successfully", async () => {
      const permissionsData = {
        permissions: ["read", "write", "borrow", "manage"],
      };

      const updatedMember = {
        ...mockLibraryMember,
        permissions: permissionsData.permissions,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedMember> = {
        success: true,
        message: "Member permissions updated successfully",
        responseObject: updatedMember,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.updatePermissions.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}/permissions`)
        .send(permissionsData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.permissions).toContain("manage");
      expect(mockLibraryMemberService.updatePermissions).toHaveBeenCalledWith(
        mockLibraryMember.id,
        permissionsData.permissions
      );
    });

    it("should return 400 for invalid permissions", async () => {
      const invalidPermissionsData = {
        permissions: ["invalid-permission"],
      };

      const response = await request(app)
        .put(`/library-members/${mockLibraryMember.id}/permissions`)
        .send(invalidPermissionsData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /library-members/:id/deactivate", () => {
    it("should deactivate member successfully", async () => {
      const deactivationData = {
        reason: "Temporary suspension",
      };

      const deactivatedMember = {
        ...mockLibraryMember,
        isActive: false,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof deactivatedMember> = {
        success: true,
        message: "Member deactivated successfully",
        responseObject: deactivatedMember,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.deactivateMember.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/library-members/${mockLibraryMember.id}/deactivate`)
        .send(deactivationData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.isActive).toBe(false);
      expect(mockLibraryMemberService.deactivateMember).toHaveBeenCalledWith(
        mockLibraryMember.id,
        deactivationData.reason
      );
    });

    it("should return 409 when trying to deactivate library owner", async () => {
      const deactivationData = {
        reason: "Test deactivation",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot deactivate library owner",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockLibraryMemberService.deactivateMember.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/library-members/${mockLibraryMember.id}/deactivate`)
        .send(deactivationData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /library-members/:id/activate", () => {
    it("should activate member successfully", async () => {
      const activatedMember = {
        ...mockLibraryMember,
        isActive: true,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof activatedMember> = {
        success: true,
        message: "Member activated successfully",
        responseObject: activatedMember,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.activateMember.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(`/library-members/${mockLibraryMember.id}/activate`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.isActive).toBe(true);
      expect(mockLibraryMemberService.activateMember).toHaveBeenCalledWith(mockLibraryMember.id);
    });
  });

  describe("POST /library-members/invite", () => {
    it("should invite member successfully", async () => {
      const invitationData = {
        email: "newmember@example.com",
        libraryId: "library-123",
        role: "member" as const,
        message: "Welcome to our library!",
      };

      const mockInvitation = {
        id: "invitation-123",
        email: invitationData.email,
        libraryId: invitationData.libraryId,
        role: invitationData.role,
        invitedBy: "admin-123",
        status: "pending",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof mockInvitation> = {
        success: true,
        message: "Invitation sent successfully",
        responseObject: mockInvitation,
        statusCode: StatusCodes.CREATED,
      };

      mockLibraryMemberService.inviteMember.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/library-members/invite")
        .send(invitationData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.email).toBe("newmember@example.com");
      expect(mockLibraryMemberService.inviteMember).toHaveBeenCalledWith({
        ...invitationData,
        invitedBy: "admin-123",
      });
    });

    it("should return 400 for invalid email", async () => {
      const invalidInvitationData = {
        email: "invalid-email",
        libraryId: "library-123",
        role: "member" as const,
      };

      const response = await request(app)
        .post("/library-members/invite")
        .send(invalidInvitationData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for already existing member", async () => {
      const duplicateInvitationData = {
        email: "existing@example.com",
        libraryId: "library-123",
        role: "member" as const,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "User is already a member of this library",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockLibraryMemberService.inviteMember.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/library-members/invite")
        .send(duplicateInvitationData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /library-members/statistics/:libraryId", () => {
    it("should get member statistics successfully", async () => {
      const libraryId = "library-123";
      const mockStats = {
        totalMembers: 25,
        activeMembers: 22,
        membersByRole: {
          owner: 1,
          manager: 2,
          staff: 5,
          member: 17,
        },
        recentJoins: 3,
        avgMembershipDuration: "6 months",
      };

      const mockResponse: ServiceResponse<typeof mockStats> = {
        success: true,
        message: "Member statistics retrieved successfully",
        responseObject: mockStats,
        statusCode: StatusCodes.OK,
      };

      mockLibraryMemberService.getMemberStatistics.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/library-members/statistics/${libraryId}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.totalMembers).toBe(25);
      expect(response.body.responseObject.membersByRole.owner).toBe(1);
      expect(mockLibraryMemberService.getMemberStatistics).toHaveBeenCalledWith(libraryId);
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

      mockLibraryMemberService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/library-members")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle database connection errors", async () => {
      mockLibraryMemberService.findAll.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .get("/library-members")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });
});