import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { subjectRouter } from "../subject.router.js";
import { SubjectService } from "../subject.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

// Mock the SubjectService
const mockSubjectService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  searchSubjects: vi.fn(),
  getSubjectBooks: vi.fn(),
  getSubjectHierarchy: vi.fn(),
  getSubjectChildren: vi.fn(),
  createBulk: vi.fn(),
  deleteBulk: vi.fn(),
};

Object.assign(SubjectService, mockSubjectService);

const mockSubject = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Science Fiction",
  description: "Fictional works that deal with scientific themes and concepts",
  parent: null,
  booksCount: 25,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockChildSubject = {
  id: "456e7890-e89b-12d3-a456-426614174000",
  name: "Space Opera",
  description: "Science fiction subgenre emphasizing space warfare and melodrama",
  parent: mockSubject.id,
  booksCount: 10,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockSubjectBook = {
  id: "book-123",
  title: "Dune",
  publishedYear: 1965,
  genre: "Science Fiction",
  subjectId: mockSubject.id,
};

describe("Subject Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("subject-router-test");
    drizzle = testDb.drizzle;
    closeDb = testDb.close;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _, next) => {
      req.drizzle = drizzle;
      next();
    });
    app.use("/subjects", subjectRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /subjects", () => {
    it("should get all subjects successfully", async () => {
      const mockSubjects = [mockSubject, mockChildSubject];
      const mockResponse: ServiceResponse<typeof mockSubjects> = {
        success: true,
        message: "Subjects retrieved successfully",
        responseObject: mockSubjects,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/subjects")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(2);
      expect(response.body.responseObject[0].name).toBe("Science Fiction");
      expect(mockSubjectService.findAll).toHaveBeenCalledOnce();
    });

    it("should handle pagination parameters", async () => {
      const mockSubjects = [mockSubject];
      const mockResponse: ServiceResponse<typeof mockSubjects> = {
        success: true,
        message: "Subjects retrieved successfully",
        responseObject: mockSubjects,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/subjects?page=1&limit=10")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockSubjectService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle hierarchical filtering", async () => {
      const mockSubjects = [mockSubject];
      const mockResponse: ServiceResponse<typeof mockSubjects> = {
        success: true,
        message: "Subjects retrieved successfully",
        responseObject: mockSubjects,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/subjects?parentOnly=true")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockSubjectService.findAll).toHaveBeenCalledWith({
        parentOnly: true,
      });
    });

    it("should return empty array when no subjects found", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No subjects found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/subjects")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /subjects/:id", () => {
    it("should get subject by id successfully", async () => {
      const mockResponse: ServiceResponse<typeof mockSubject> = {
        success: true,
        message: "Subject found successfully",
        responseObject: mockSubject,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockSubject.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("Science Fiction");
      expect(mockSubjectService.findById).toHaveBeenCalledWith(mockSubject.id);
    });

    it("should return 404 for non-existent subject", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockSubjectService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Subject not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .get(`/subjects/${invalidId}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /subjects", () => {
    it("should create subject successfully", async () => {
      const newSubjectData = {
        name: "Fantasy",
        description: "Literature featuring magical or supernatural elements",
      };

      const createdSubject = {
        ...newSubjectData,
        id: "789e1234-e89b-12d3-a456-426614174000",
        parent: null,
        booksCount: 0,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdSubject> = {
        success: true,
        message: "Subject created successfully",
        responseObject: createdSubject,
        statusCode: StatusCodes.CREATED,
      };

      mockSubjectService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/subjects")
        .send(newSubjectData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("Fantasy");
      expect(mockSubjectService.create).toHaveBeenCalledWith(newSubjectData);
    });

    it("should create child subject successfully", async () => {
      const newChildSubjectData = {
        name: "High Fantasy",
        description: "Fantasy subgenre with entirely fictional worlds",
        parent: mockSubject.id,
      };

      const createdChildSubject = {
        ...newChildSubjectData,
        id: "abc1234-e89b-12d3-a456-426614174000",
        booksCount: 0,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdChildSubject> = {
        success: true,
        message: "Subject created successfully",
        responseObject: createdChildSubject,
        statusCode: StatusCodes.CREATED,
      };

      mockSubjectService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/subjects")
        .send(newChildSubjectData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("High Fantasy");
      expect(response.body.responseObject.parent).toBe(mockSubject.id);
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        description: "Some description",
      };

      const response = await request(app)
        .post("/subjects")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate subject name", async () => {
      const duplicateData = {
        name: "Science Fiction",
        description: "Duplicate subject",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject with this name already exists",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockSubjectService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/subjects")
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Subject with this name already exists");
    });

    it("should return 400 for invalid parent subject", async () => {
      const invalidParentData = {
        name: "Test Subject",
        parent: "invalid-parent-id",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Invalid parent subject",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockSubjectService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/subjects")
        .send(invalidParentData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /subjects/:id", () => {
    it("should update subject successfully", async () => {
      const updateData = {
        name: "Science Fiction Updated",
        description: "Updated description for science fiction",
      };

      const updatedSubject = {
        ...mockSubject,
        ...updateData,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedSubject> = {
        success: true,
        message: "Subject updated successfully",
        responseObject: updatedSubject,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/subjects/${mockSubject.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("Science Fiction Updated");
      expect(mockSubjectService.update).toHaveBeenCalledWith(mockSubject.id, updateData);
    });

    it("should return 404 for non-existent subject", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const updateData = {
        name: "Updated Name",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockSubjectService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/subjects/${nonExistentId}`)
        .send(updateData)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for creating circular hierarchy", async () => {
      const circularData = {
        parent: mockChildSubject.id, // Child becoming parent of its own parent
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Circular hierarchy not allowed",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockSubjectService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/subjects/${mockSubject.id}`)
        .send(circularData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /subjects/:id", () => {
    it("should delete subject successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Subject deleted successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/subjects/${mockSubject.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Subject deleted successfully");
      expect(mockSubjectService.delete).toHaveBeenCalledWith(mockSubject.id);
    });

    it("should return 404 for non-existent subject", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockSubjectService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/subjects/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 when subject has child subjects", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot delete subject with child subjects",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockSubjectService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/subjects/${mockSubject.id}`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cannot delete subject with child subjects");
    });

    it("should return 409 when subject has associated books", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot delete subject with associated books",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockSubjectService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/subjects/${mockSubject.id}`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cannot delete subject with associated books");
    });
  });

  describe("GET /subjects/search", () => {
    it("should search subjects successfully", async () => {
      const searchQuery = "Science";
      const mockSubjects = [mockSubject];
      const mockResponse: ServiceResponse<typeof mockSubjects> = {
        success: true,
        message: "Subjects found successfully",
        responseObject: mockSubjects,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.searchSubjects.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/search?q=${searchQuery}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockSubjectService.searchSubjects).toHaveBeenCalledWith(searchQuery);
    });

    it("should return 400 for missing search query", async () => {
      const response = await request(app)
        .get("/subjects/search")
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return empty results for no matches", async () => {
      const searchQuery = "NonExistentSubject";
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No subjects found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.searchSubjects.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/search?q=${searchQuery}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /subjects/:id/books", () => {
    it("should get subject books successfully", async () => {
      const mockBooks = [mockSubjectBook];
      const mockResponse: ServiceResponse<typeof mockBooks> = {
        success: true,
        message: "Subject books retrieved successfully",
        responseObject: mockBooks,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.getSubjectBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockSubject.id}/books`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].title).toBe("Dune");
      expect(mockSubjectService.getSubjectBooks).toHaveBeenCalledWith(mockSubject.id);
    });

    it("should handle pagination for subject books", async () => {
      const mockBooks = [mockSubjectBook];
      const mockResponse: ServiceResponse<typeof mockBooks> = {
        success: true,
        message: "Subject books retrieved successfully",
        responseObject: mockBooks,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.getSubjectBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockSubject.id}/books?page=1&limit=5`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockSubjectService.getSubjectBooks).toHaveBeenCalledWith(
        mockSubject.id,
        { page: 1, limit: 5 }
      );
    });

    it("should return 404 for non-existent subject", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockSubjectService.getSubjectBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${nonExistentId}/books`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /subjects/:id/hierarchy", () => {
    it("should get subject hierarchy successfully", async () => {
      const mockHierarchy = {
        subject: mockSubject,
        children: [mockChildSubject],
        path: [mockSubject],
      };

      const mockResponse: ServiceResponse<typeof mockHierarchy> = {
        success: true,
        message: "Subject hierarchy retrieved successfully",
        responseObject: mockHierarchy,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.getSubjectHierarchy.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockSubject.id}/hierarchy`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.children).toHaveLength(1);
      expect(mockSubjectService.getSubjectHierarchy).toHaveBeenCalledWith(mockSubject.id);
    });

    it("should return 404 for non-existent subject", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Subject not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockSubjectService.getSubjectHierarchy.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${nonExistentId}/hierarchy`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /subjects/:id/children", () => {
    it("should get subject children successfully", async () => {
      const mockChildren = [mockChildSubject];
      const mockResponse: ServiceResponse<typeof mockChildren> = {
        success: true,
        message: "Subject children retrieved successfully",
        responseObject: mockChildren,
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.getSubjectChildren.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockSubject.id}/children`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].name).toBe("Space Opera");
      expect(mockSubjectService.getSubjectChildren).toHaveBeenCalledWith(mockSubject.id);
    });

    it("should return empty array for subject with no children", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No child subjects found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockSubjectService.getSubjectChildren.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/subjects/${mockChildSubject.id}/children`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("Bulk Operations", () => {
    describe("POST /subjects/bulk", () => {
      it("should create multiple subjects successfully", async () => {
        const bulkData = {
          subjects: [
            {
              name: "Subject One",
              description: "Description one",
            },
            {
              name: "Subject Two",
              description: "Description two",
            },
          ],
        };

        const createdSubjects = bulkData.subjects.map((subject, index) => ({
          ...subject,
          id: `${index + 1}e4567-e89b-12d3-a456-426614174000`,
          parent: null,
          booksCount: 0,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        }));

        const mockResponse: ServiceResponse<typeof createdSubjects> = {
          success: true,
          message: "Subjects created successfully",
          responseObject: createdSubjects,
          statusCode: StatusCodes.CREATED,
        };

        mockSubjectService.createBulk.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post("/subjects/bulk")
          .send(bulkData)
          .expect(StatusCodes.CREATED);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject).toHaveLength(2);
      });
    });

    describe("DELETE /subjects/bulk", () => {
      it("should delete multiple subjects successfully", async () => {
        const deleteData = {
          ids: [mockSubject.id, mockChildSubject.id],
        };

        const mockResponse: ServiceResponse<{ deletedCount: number }> = {
          success: true,
          message: "Subjects deleted successfully",
          responseObject: { deletedCount: 2 },
          statusCode: StatusCodes.OK,
        };

        mockSubjectService.deleteBulk.mockResolvedValue(mockResponse);

        const response = await request(app)
          .delete("/subjects/bulk")
          .send(deleteData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject.deletedCount).toBe(2);
      });
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

      mockSubjectService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/subjects")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle database connection errors", async () => {
      mockSubjectService.findAll.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .get("/subjects")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });
});