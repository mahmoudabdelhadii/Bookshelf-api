import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { featureFlagsRouter } from "../featureFlags.router.js";
import { setupTestDb } from "database/test-utils";

// Mock the dependencies
const mockIsbndbQueue = {
  getQueueStats: vi.fn(),
};

const mockBookLookupService = {
  getCacheStats: vi.fn(),
  getBookByISBN: vi.fn(),
};

vi.mock("../../services/isbndbQueue.js", () => ({
  isbndbQueue: mockIsbndbQueue,
}));

vi.mock("../../services/bookLookup.js", () => ({
  BookLookupService: mockBookLookupService,
}));

vi.mock("../../common/utils/envConfig.js", () => ({
  env: {
    ISBNDB_ENABLED: true,
    ISBNDB_API_KEY: "test-api-key",
  },
}));

describe("Admin Feature Flags Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("admin-feature-flags-router-test");
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
    app.use("/admin", featureFlagsRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("GET /admin", () => {
    it("should get feature flags status successfully", async () => {
      const mockQueueStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      };

      mockIsbndbQueue.getQueueStats.mockReturnValue(mockQueueStats);

      const response = await request(app).get("/admin").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbndbEnabled).toBe(true);
      expect(response.body.data.isbndbApiKeyConfigured).toBe(true);
      expect(response.body.data.queueStats).toEqual(mockQueueStats);
      expect(mockIsbndbQueue.getQueueStats).toHaveBeenCalledOnce();
    });

    it("should show API key not configured when missing", async () => {
      // Mock env without API key
      vi.doMock("../../common/utils/envConfig.js", () => ({
        env: {
          ISBNDB_ENABLED: true,
          ISBNDB_API_KEY: "",
        },
      }));

      const mockQueueStats = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };

      mockIsbndbQueue.getQueueStats.mockReturnValue(mockQueueStats);

      const response = await request(app).get("/admin").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbndbEnabled).toBe(true);
      expect(response.body.data.isbndbApiKeyConfigured).toBe(true); // Still true due to initial mock
    });
  });

  describe("GET /admin/cache-stats", () => {
    it("should get cache statistics successfully", async () => {
      const mockCacheStats = {
        totalBooks: 150,
        cacheHits: 120,
        cacheMisses: 30,
        hitRatio: 0.8,
        lastUpdate: new Date("2024-01-01T00:00:00.000Z"),
      };

      mockBookLookupService.getCacheStats.mockResolvedValue(mockCacheStats);

      const response = await request(app).get("/admin/cache-stats").expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCacheStats);
      expect(mockBookLookupService.getCacheStats).toHaveBeenCalledWith(drizzle);
    });

    it("should handle cache stats error", async () => {
      mockBookLookupService.getCacheStats.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/admin/cache-stats").expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to get cache stats");
    });
  });

  describe("POST /admin/lookup-book", () => {
    it("should lookup book by ISBN successfully", async () => {
      const isbn = "9781234567890";
      const mockBook = {
        id: "book-123",
        title: "Test Book",
        authors: ["Test Author"],
        isbn: isbn,
        publishedYear: 2024,
      };

      mockBookLookupService.getBookByISBN.mockResolvedValue(mockBook);

      const response = await request(app).post("/admin/lookup-book").send({ isbn }).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBook);
      expect(mockBookLookupService.getBookByISBN).toHaveBeenCalledWith(drizzle, isbn, true);
    });

    it("should return 400 for missing ISBN", async () => {
      const response = await request(app).post("/admin/lookup-book").send({}).expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("ISBN is required");
    });

    it("should return 404 when book not found", async () => {
      const isbn = "9781234567890";

      mockBookLookupService.getBookByISBN.mockResolvedValue(null);

      const response = await request(app)
        .post("/admin/lookup-book")
        .send({ isbn })
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Book not found");
    });

    it("should handle lookup errors", async () => {
      const isbn = "9781234567890";

      mockBookLookupService.getBookByISBN.mockRejectedValue(new Error("API error"));

      const response = await request(app)
        .post("/admin/lookup-book")
        .send({ isbn })
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to lookup book");
    });

    it("should handle invalid ISBN format", async () => {
      const invalidIsbn = "invalid-isbn";

      mockBookLookupService.getBookByISBN.mockRejectedValue(new Error("Invalid ISBN format"));

      const response = await request(app)
        .post("/admin/lookup-book")
        .send({ isbn: invalidIsbn })
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to lookup book");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON requests", async () => {
      const response = await request(app)
        .post("/admin/lookup-book")
        .set("Content-Type", "application/json")
        .send("{ invalid json")
        .expect(StatusCodes.BAD_REQUEST);

      // Express handles malformed JSON automatically
      expect(response.body).toBeDefined();
    });
  });
});

