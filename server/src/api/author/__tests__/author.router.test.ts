import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi, Mocked } from "vitest";
import type { DrizzleClient } from "database";

import { authorRouter } from "../author.router.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

vi.mock("../author.service.js", () => ({
  AuthorService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByName: vi.fn(),
    search: vi.fn(),
    searchAuthors: vi.fn(),
  },
}));

import { AuthorService } from "../author.service.js";
const mockAuthorService = AuthorService as Mocked<typeof AuthorService>;

const mockAuthor = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "J.K. Rowling",
  biography: "British author, best known for the Harry Potter series.",
  birthDate: "1965-07-31",
  nationality: "British",
  booksCount: 7,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockAuthorBook = {
  id: "book-123",
  title: "Harry Potter and the Philosopher's Stone",
  publishedYear: 1997,
  genre: "Fantasy",
  authorId: mockAuthor.id,
};

describe("Author Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("author-router-test");
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
    app.use("/authors", authorRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /authors", () => {
    it("should get all authors successfully", async () => {
      const mockAuthors = [mockAuthor];
      const mockResponse: ServiceResponse<typeof mockAuthors> = {
        success: true,
        message: "Authors retrieved successfully",
        responseObject: mockAuthors,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app).get("/authors").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].name).toBe("J.K. Rowling");
      expect(AuthorService.findAll).toHaveBeenCalledOnce();
    });

    it("should handle pagination parameters", async () => {
      const mockAuthors = [mockAuthor];
      const mockResponse: ServiceResponse<typeof mockAuthors> = {
        success: true,
        message: "Authors retrieved successfully",
        responseObject: mockAuthors,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app).get("/authors?page=1&limit=10").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockAuthorService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle sorting parameters", async () => {
      const mockAuthors = [mockAuthor];
      const mockResponse: ServiceResponse<typeof mockAuthors> = {
        success: true,
        message: "Authors retrieved successfully",
        responseObject: mockAuthors,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app).get("/authors?sortBy=name&sortOrder=asc").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockAuthorService.findAll).toHaveBeenCalledWith({
        sortBy: "name",
        sortOrder: "asc",
      });
    });

    it("should return empty array when no authors found", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No authors found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app).get("/authors").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /authors/:id", () => {
    it("should get author by id successfully", async () => {
      const mockResponse: ServiceResponse<typeof mockAuthor> = {
        success: true,
        message: "Author found successfully",
        responseObject: mockAuthor,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.findById.mockResolvedValue(mockResponse);

      const response = await request(app).get(`/authors/${mockAuthor.id}`).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("J.K. Rowling");
      expect(mockAuthorService.findById).toHaveBeenCalledWith(mockAuthor.id);
    });

    it("should return 404 for non-existent author", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Author not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockAuthorService.findById.mockResolvedValue(mockResponse);

      const response = await request(app).get(`/authors/${nonExistentId}`).expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Author not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app).get(`/authors/${invalidId}`).expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /authors", () => {
    it("should create author successfully", async () => {
      const newAuthorData = {
        name: "George R.R. Martin",
        biography: "American novelist and short story writer.",
        birthDate: "1948-09-20",
        nationality: "American",
      };

      const createdAuthor = {
        ...newAuthorData,
        id: "456e7890-e89b-12d3-a456-426614174000",
        booksCount: 0,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdAuthor> = {
        success: true,
        message: "Author created successfully",
        responseObject: createdAuthor,
        statusCode: StatusCodes.CREATED,
      };

      mockAuthorService.create.mockResolvedValue(mockResponse);

      const response = await request(app).post("/authors").send(newAuthorData).expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("George R.R. Martin");
      expect(mockAuthorService.create).toHaveBeenCalledWith(newAuthorData);
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        biography: "Some biography",
      };

      const response = await request(app).post("/authors").send(invalidData).expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid birth date format", async () => {
      const invalidData = {
        name: "Test Author",
        birthDate: "invalid-date",
        nationality: "American",
      };

      const response = await request(app).post("/authors").send(invalidData).expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate author name", async () => {
      const duplicateData = {
        name: "J.K. Rowling",
        nationality: "British",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Author with this name already exists",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockAuthorService.create.mockResolvedValue(mockResponse);

      const response = await request(app).post("/authors").send(duplicateData).expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Author with this name already exists");
    });
  });

  describe("PUT /authors/:id", () => {
    it("should update author successfully", async () => {
      const updateData = {
        name: "J.K. Rowling Updated",
        biography: "Updated biography",
      };

      const updatedAuthor = {
        ...mockAuthor,
        ...updateData,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedAuthor> = {
        success: true,
        message: "Author updated successfully",
        responseObject: updatedAuthor,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/authors/${mockAuthor.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("J.K. Rowling Updated");
      expect(mockAuthorService.update).toHaveBeenCalledWith(mockAuthor.id, updateData);
    });

    it("should return 404 for non-existent author", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const updateData = {
        name: "Updated Name",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Author not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockAuthorService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/authors/${nonExistentId}`)
        .send(updateData)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid update data", async () => {
      const invalidData = {
        name: "", // Empty name
      };

      const response = await request(app)
        .put(`/authors/${mockAuthor.id}`)
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /authors/:id", () => {
    it("should delete author successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Author deleted successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthorService.delete.mockResolvedValue(mockResponse);

      const response = await request(app).delete(`/authors/${mockAuthor.id}`).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Author deleted successfully");
      expect(mockAuthorService.delete).toHaveBeenCalledWith(mockAuthor.id);
    });

    it("should return 404 for non-existent author", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Author not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockAuthorService.delete.mockResolvedValue(mockResponse);

      const response = await request(app).delete(`/authors/${nonExistentId}`).expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 when author has associated books", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot delete author with associated books",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockAuthorService.delete.mockResolvedValue(mockResponse);

      const response = await request(app).delete(`/authors/${mockAuthor.id}`).expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cannot delete author with associated books");
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

      mockAuthorService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app).get("/authors").expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle database connection errors", async () => {
      mockAuthorService.findAll.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).get("/authors").expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });
});

