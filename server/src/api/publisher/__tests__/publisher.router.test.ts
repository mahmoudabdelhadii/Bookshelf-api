import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { publisherRouter } from "../publisher.router.js";
import { PublisherService } from "../publisher.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

// Mock the PublisherService
const mockPublisherService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  searchPublishers: vi.fn(),
  getPublisherBooks: vi.fn(),
  getPublisherStatistics: vi.fn(),
  createBulk: vi.fn(),
  deleteBulk: vi.fn(),
};

Object.assign(PublisherService, mockPublisherService);

const mockPublisher = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Penguin Random House",
  address: "1745 Broadway, New York, NY 10019",
  website: "https://www.penguinrandomhouse.com",
  foundedYear: 2013,
  booksCount: 150,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockPublisherBook = {
  id: "book-123",
  title: "The Great Gatsby",
  publishedYear: 1925,
  genre: "Classic Literature",
  publisherId: mockPublisher.id,
};

describe("Publisher Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("publisher-router-test");
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
    app.use("/publishers", publisherRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /publishers", () => {
    it("should get all publishers successfully", async () => {
      const mockPublishers = [mockPublisher];
      const mockResponse: ServiceResponse<typeof mockPublishers> = {
        success: true,
        message: "Publishers retrieved successfully",
        responseObject: mockPublishers,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/publishers")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].name).toBe("Penguin Random House");
      expect(mockPublisherService.findAll).toHaveBeenCalledOnce();
    });

    it("should handle pagination parameters", async () => {
      const mockPublishers = [mockPublisher];
      const mockResponse: ServiceResponse<typeof mockPublishers> = {
        success: true,
        message: "Publishers retrieved successfully",
        responseObject: mockPublishers,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/publishers?page=1&limit=10")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockPublisherService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle filtering by founded year", async () => {
      const mockPublishers = [mockPublisher];
      const mockResponse: ServiceResponse<typeof mockPublishers> = {
        success: true,
        message: "Publishers retrieved successfully",
        responseObject: mockPublishers,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/publishers?foundedAfter=2000&foundedBefore=2020")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockPublisherService.findAll).toHaveBeenCalledWith({
        foundedAfter: 2000,
        foundedBefore: 2020,
      });
    });

    it("should return empty array when no publishers found", async () => {
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No publishers found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/publishers")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /publishers/:id", () => {
    it("should get publisher by id successfully", async () => {
      const mockResponse: ServiceResponse<typeof mockPublisher> = {
        success: true,
        message: "Publisher found successfully",
        responseObject: mockPublisher,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${mockPublisher.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("Penguin Random House");
      expect(mockPublisherService.findById).toHaveBeenCalledWith(mockPublisher.id);
    });

    it("should return 404 for non-existent publisher", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockPublisherService.findById.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Publisher not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .get(`/publishers/${invalidId}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /publishers", () => {
    it("should create publisher successfully", async () => {
      const newPublisherData = {
        name: "HarperCollins Publishers",
        address: "195 Broadway, New York, NY 10007",
        website: "https://www.harpercollins.com",
        foundedYear: 1989,
      };

      const createdPublisher = {
        ...newPublisherData,
        id: "456e7890-e89b-12d3-a456-426614174000",
        booksCount: 0,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof createdPublisher> = {
        success: true,
        message: "Publisher created successfully",
        responseObject: createdPublisher,
        statusCode: StatusCodes.CREATED,
      };

      mockPublisherService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/publishers")
        .send(newPublisherData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("HarperCollins Publishers");
      expect(mockPublisherService.create).toHaveBeenCalledWith(newPublisherData);
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        address: "Some address",
      };

      const response = await request(app)
        .post("/publishers")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid founded year", async () => {
      const invalidData = {
        name: "Test Publisher",
        foundedYear: 3000, // Future year
      };

      const response = await request(app)
        .post("/publishers")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate publisher name", async () => {
      const duplicateData = {
        name: "Penguin Random House",
        foundedYear: 2013,
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher with this name already exists",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockPublisherService.create.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/publishers")
        .send(duplicateData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Publisher with this name already exists");
    });
  });

  describe("PUT /publishers/:id", () => {
    it("should update publisher successfully", async () => {
      const updateData = {
        name: "Penguin Random House LLC",
        website: "https://www.penguinrandomhouse.com/updated",
      };

      const updatedPublisher = {
        ...mockPublisher,
        ...updateData,
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      const mockResponse: ServiceResponse<typeof updatedPublisher> = {
        success: true,
        message: "Publisher updated successfully",
        responseObject: updatedPublisher,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/publishers/${mockPublisher.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.name).toBe("Penguin Random House LLC");
      expect(mockPublisherService.update).toHaveBeenCalledWith(mockPublisher.id, updateData);
    });

    it("should return 404 for non-existent publisher", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const updateData = {
        name: "Updated Name",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockPublisherService.update.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put(`/publishers/${nonExistentId}`)
        .send(updateData)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid update data", async () => {
      const invalidData = {
        name: "", // Empty name
      };

      const response = await request(app)
        .put(`/publishers/${mockPublisher.id}`)
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /publishers/:id", () => {
    it("should delete publisher successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Publisher deleted successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/publishers/${mockPublisher.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Publisher deleted successfully");
      expect(mockPublisherService.delete).toHaveBeenCalledWith(mockPublisher.id);
    });

    it("should return 404 for non-existent publisher", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockPublisherService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/publishers/${nonExistentId}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 when publisher has associated books", async () => {
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Cannot delete publisher with associated books",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockPublisherService.delete.mockResolvedValue(mockResponse);

      const response = await request(app)
        .delete(`/publishers/${mockPublisher.id}`)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cannot delete publisher with associated books");
    });
  });

  describe("GET /publishers/search", () => {
    it("should search publishers successfully", async () => {
      const searchQuery = "Penguin";
      const mockPublishers = [mockPublisher];
      const mockResponse: ServiceResponse<typeof mockPublishers> = {
        success: true,
        message: "Publishers found successfully",
        responseObject: mockPublishers,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.searchPublishers.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/search?q=${searchQuery}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(mockPublisherService.searchPublishers).toHaveBeenCalledWith(searchQuery);
    });

    it("should return 400 for missing search query", async () => {
      const response = await request(app)
        .get("/publishers/search")
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return empty results for no matches", async () => {
      const searchQuery = "NonExistentPublisher";
      const mockResponse: ServiceResponse<[]> = {
        success: true,
        message: "No publishers found",
        responseObject: [],
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.searchPublishers.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/search?q=${searchQuery}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(0);
    });
  });

  describe("GET /publishers/:id/books", () => {
    it("should get publisher books successfully", async () => {
      const mockBooks = [mockPublisherBook];
      const mockResponse: ServiceResponse<typeof mockBooks> = {
        success: true,
        message: "Publisher books retrieved successfully",
        responseObject: mockBooks,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.getPublisherBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${mockPublisher.id}/books`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject).toHaveLength(1);
      expect(response.body.responseObject[0].title).toBe("The Great Gatsby");
      expect(mockPublisherService.getPublisherBooks).toHaveBeenCalledWith(mockPublisher.id);
    });

    it("should handle pagination for publisher books", async () => {
      const mockBooks = [mockPublisherBook];
      const mockResponse: ServiceResponse<typeof mockBooks> = {
        success: true,
        message: "Publisher books retrieved successfully",
        responseObject: mockBooks,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.getPublisherBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${mockPublisher.id}/books?page=1&limit=5`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(mockPublisherService.getPublisherBooks).toHaveBeenCalledWith(
        mockPublisher.id,
        { page: 1, limit: 5 }
      );
    });

    it("should return 404 for non-existent publisher", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockPublisherService.getPublisherBooks.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${nonExistentId}/books`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /publishers/:id/statistics", () => {
    it("should get publisher statistics successfully", async () => {
      const mockStats = {
        totalBooks: 150,
        averagePublicationYear: 2010,
        oldestBook: 1925,
        newestBook: 2024,
        topGenres: ["Fiction", "Non-Fiction", "Biography"],
        totalAuthors: 75,
      };

      const mockResponse: ServiceResponse<typeof mockStats> = {
        success: true,
        message: "Publisher statistics retrieved successfully",
        responseObject: mockStats,
        statusCode: StatusCodes.OK,
      };

      mockPublisherService.getPublisherStatistics.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${mockPublisher.id}/statistics`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.totalBooks).toBe(150);
      expect(response.body.responseObject.totalAuthors).toBe(75);
      expect(mockPublisherService.getPublisherStatistics).toHaveBeenCalledWith(mockPublisher.id);
    });

    it("should return 404 for non-existent publisher", async () => {
      const nonExistentId = "999e4567-e89b-12d3-a456-426614174000";
      const mockResponse: ServiceResponse = {
        success: false,
        message: "Publisher not found",
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      mockPublisherService.getPublisherStatistics.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(`/publishers/${nonExistentId}/statistics`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Bulk Operations", () => {
    describe("POST /publishers/bulk", () => {
      it("should create multiple publishers successfully", async () => {
        const bulkData = {
          publishers: [
            {
              name: "Publisher One",
              foundedYear: 2000,
            },
            {
              name: "Publisher Two",
              foundedYear: 2010,
            },
          ],
        };

        const createdPublishers = bulkData.publishers.map((publisher, index) => ({
          ...publisher,
          id: `${index + 1}e4567-e89b-12d3-a456-426614174000`,
          booksCount: 0,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        }));

        const mockResponse: ServiceResponse<typeof createdPublishers> = {
          success: true,
          message: "Publishers created successfully",
          responseObject: createdPublishers,
          statusCode: StatusCodes.CREATED,
        };

        mockPublisherService.createBulk.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post("/publishers/bulk")
          .send(bulkData)
          .expect(StatusCodes.CREATED);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject).toHaveLength(2);
      });

      it("should return 400 for invalid bulk data", async () => {
        const invalidBulkData = {
          publishers: [
            {
              // Missing required name field
              foundedYear: 2000,
            },
          ],
        };

        const response = await request(app)
          .post("/publishers/bulk")
          .send(invalidBulkData)
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body.success).toBe(false);
      });
    });

    describe("DELETE /publishers/bulk", () => {
      it("should delete multiple publishers successfully", async () => {
        const deleteData = {
          ids: [mockPublisher.id, "456e7890-e89b-12d3-a456-426614174000"],
        };

        const mockResponse: ServiceResponse<{ deletedCount: number }> = {
          success: true,
          message: "Publishers deleted successfully",
          responseObject: { deletedCount: 2 },
          statusCode: StatusCodes.OK,
        };

        mockPublisherService.deleteBulk.mockResolvedValue(mockResponse);

        const response = await request(app)
          .delete("/publishers/bulk")
          .send(deleteData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject.deletedCount).toBe(2);
      });

      it("should return 400 for invalid bulk delete data", async () => {
        const invalidDeleteData = {
          ids: ["invalid-uuid"],
        };

        const response = await request(app)
          .delete("/publishers/bulk")
          .send(invalidDeleteData)
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body.success).toBe(false);
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

      mockPublisherService.findAll.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get("/publishers")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should handle database connection errors", async () => {
      mockPublisherService.findAll.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .get("/publishers")
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });
});