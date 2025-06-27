import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { libraryRouter } from "../library.router.js";
import { LibraryService } from "../library.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import type { Library, CreateLibrary, UpdateLibrary } from "../library.model.js";
import { setupTestDb } from "../../../common/utils/testUtils.js";

// Mock the LibraryService
const mockLibraryService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Replace the actual service with our mock
Object.assign(LibraryService, mockLibraryService);

const mockLibrary: Library = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Central Library",
  location: "Downtown",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("Library API endpoints", () => {
  let app: Express;
  let testDb: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const dbSetup = await setupTestDb("library-test");
    testDb = dbSetup.drizzle;
    close = dbSetup.close;
    
    app = express();
    app.use(express.json());
    
    // Add drizzle instance to request
    app.use((req: any, res, next) => {
      req.drizzle = testDb;
      next();
    });
    
    app.use("/libraries", libraryRouter);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /libraries", () => {
    it("should return all libraries successfully", async () => {
      const libraries = [mockLibrary];
      mockLibraryService.findAll.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Libraries found", responseObject: libraries, statusCode: 200 })
      );

      const response = await request(app).get("/libraries");
      const result = response.body as ServiceResponse<Library[]>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Libraries found");
      expect(Array.isArray(result.responseObject)).toBe(true);
      expect(result.responseObject.length).toBe(1);
      expect(mockLibraryService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should handle database errors gracefully", async () => {
      mockLibraryService.findAll.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Failed to retrieve libraries", responseObject: null, statusCode: 500 })
      );

      const response = await request(app).get("/libraries");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to retrieve libraries");
    });
  });

  describe("GET /libraries/:id", () => {
    it("should return a library by ID successfully", async () => {
      mockLibraryService.findById.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Library found", responseObject: mockLibrary, statusCode: 200 })
      );

      const response = await request(app).get(`/libraries/${mockLibrary.id}`);
      const result = response.body as ServiceResponse<Library>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.id).toBe(mockLibrary.id);
      expect(mockLibraryService.findById).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library", async () => {
      mockLibraryService.findById.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library not found", responseObject: null, statusCode: 404 })
      );

      const response = await request(app).get("/libraries/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Library not found");
    });

    it("should return 422 for invalid UUID format", async () => {
      mockLibraryService.findById.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library ID is required", responseObject: null, statusCode: 422 })
      );

      const response = await request(app).get("/libraries/invalid-uuid");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /libraries", () => {
    const newLibraryData: CreateLibrary = {
      name: "New Library",
      location: "Uptown",
    };

    it("should create a new library successfully", async () => {
      const createdLibrary = { ...mockLibrary, ...newLibraryData };
      mockLibraryService.create.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Library created successfully", responseObject: createdLibrary, statusCode: 201 })
      );

      const response = await request(app)
        .post("/libraries")
        .send(newLibraryData);
      const result = response.body as ServiceResponse<Library>;

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Library created successfully");
      expect(result.responseObject.name).toBe(newLibraryData.name);
      expect(mockLibraryService.create).toHaveBeenCalledTimes(1);
    });

    it("should return 422 for missing required fields", async () => {
      mockLibraryService.create.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library name is required", responseObject: null, statusCode: 422 })
      );

      const response = await request(app)
        .post("/libraries")
        .send({});
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });

    it("should return 409 for duplicate library name", async () => {
      mockLibraryService.create.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library with this name already exists", responseObject: null, statusCode: 409 })
      );

      const response = await request(app)
        .post("/libraries")
        .send(newLibraryData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Library with this name already exists");
    });
  });

  describe("PATCH /libraries/:id", () => {
    const updateData: UpdateLibrary = {
      name: "Updated Library Name",
      location: "New Location",
    };

    it("should update a library successfully", async () => {
      const updatedLibrary = { ...mockLibrary, ...updateData };
      mockLibraryService.update.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Library updated successfully", responseObject: updatedLibrary, statusCode: 200 })
      );

      const response = await request(app)
        .patch(`/libraries/${mockLibrary.id}`)
        .send(updateData);
      const result = response.body as ServiceResponse<Library>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.name).toBe(updateData.name);
      expect(mockLibraryService.update).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library", async () => {
      mockLibraryService.update.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library not found", responseObject: null, statusCode: 404 })
      );

      const response = await request(app)
        .patch("/libraries/non-existent-id")
        .send(updateData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });

    it("should return 422 for empty update data", async () => {
      mockLibraryService.update.mockImplementation(() =>
        Promise.resolve({ success: false, message: "At least one field must be provided for update", responseObject: null, statusCode: 422 })
      );

      const response = await request(app)
        .patch(`/libraries/${mockLibrary.id}`)
        .send({});
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });

  describe("DELETE /libraries/:id", () => {
    it("should delete a library successfully", async () => {
      mockLibraryService.delete.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Library deleted successfully", responseObject: null, statusCode: 204 })
      );

      const response = await request(app).delete(`/libraries/${mockLibrary.id}`);

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(mockLibraryService.delete).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library", async () => {
      mockLibraryService.delete.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Library not found", responseObject: null, statusCode: 404 })
      );

      const response = await request(app).delete("/libraries/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });

    it("should return 409 when library contains books", async () => {
      mockLibraryService.delete.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Cannot delete library that contains books. Please remove all books first.", responseObject: null, statusCode: 409 })
      );

      const response = await request(app).delete(`/libraries/${mockLibrary.id}`);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Cannot delete library that contains books");
    });
  });
});