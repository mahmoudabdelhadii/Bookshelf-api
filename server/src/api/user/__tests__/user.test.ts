import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { userRouter } from "../user.router.js";
import { UserService } from "../user.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import type { User } from "../user.model.js";
import { setupTestDb } from "database/test-utils";


const mockUserService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
};


Object.assign(UserService, mockUserService);

const mockUser: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "johndoe",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  role: "user" as const,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("User API endpoints", () => {
  let app: Express;
  let testDb: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const dbSetup = await setupTestDb("user-test");
    testDb = dbSetup.drizzle;
    close = dbSetup.close;

    app = express();
    app.use(express.json());

    
    app.use((req: any, res, next) => {
      req.drizzle = testDb;
      next();
    });

    app.use("/users", userRouter);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /users", () => {
    it("should return all users successfully", async () => {
      const users = [mockUser];
      mockUserService.findAll.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Users retrieved successfully",
          responseObject: users,
          statusCode: 200,
        }),
      );

      const response = await request(app).get("/users");
      const result = response.body as ServiceResponse<User[]>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Users retrieved successfully");
      expect(Array.isArray(result.responseObject)).toBe(true);
      expect(result.responseObject.length).toBe(1);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should handle database errors gracefully", async () => {
      mockUserService.findAll.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Failed to fetch users: Database error",
          responseObject: null,
          statusCode: 500,
        }),
      );

      const response = await request(app).get("/users");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to fetch users");
    });
  });

  describe("GET /users/:id", () => {
    it("should return a user by ID successfully", async () => {
      mockUserService.findById.mockImplementation(() =>
        Promise.resolve({ success: true, message: "User found", responseObject: mockUser, statusCode: 200 }),
      );

      const response = await request(app).get(`/users/${mockUser.id}`);
      const result = response.body as ServiceResponse<User>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.id).toBe(mockUser.id);
      expect(mockUserService.findById).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent user", async () => {
      mockUserService.findById.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with ID non-existent-id not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).get("/users/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });

    it("should return 422 for invalid UUID format", async () => {
      mockUserService.findById.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User ID is required",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).get("/users/invalid-uuid");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /users", () => {
    const newUserData = {
      id: "456e7890-e89b-12d3-a456-426614174000",
      username: "janedoe",
      email: "jane.doe@example.com",
      firstName: "Jane",
      lastName: "Doe",
    };

    it("should create a new user successfully", async () => {
      const createdUser = { ...mockUser, ...newUserData };
      mockUserService.createUser.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "User created successfully",
          responseObject: createdUser,
          statusCode: 201,
        }),
      );

      const response = await request(app).post("/users").send(newUserData);
      const result = response.body as ServiceResponse<User>;

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(result.success).toBe(true);
      expect(result.message).toBe("User created successfully");
      expect(result.responseObject.username).toBe(newUserData.username);
      expect(mockUserService.createUser).toHaveBeenCalledTimes(1);
    });

    it("should return 422 for missing required fields", async () => {
      mockUserService.createUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Username is required",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).post("/users").send({ email: "test@example.com" });
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });

    it("should return 409 for duplicate email", async () => {
      mockUserService.createUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with this email already exists",
          responseObject: null,
          statusCode: 409,
        }),
      );

      const response = await request(app).post("/users").send(newUserData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toContain("email already exists");
    });

    it("should return 409 for duplicate username", async () => {
      mockUserService.createUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with this username already exists",
          responseObject: null,
          statusCode: 409,
        }),
      );

      const response = await request(app).post("/users").send(newUserData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toContain("username already exists");
    });
  });

  describe("PATCH /users/:id", () => {
    const updateData = {
      username: "updatedusername",
      email: "updated.email@example.com",
      firstName: "UpdatedJohn",
      lastName: "UpdatedDoe",
    };

    it("should update a user successfully", async () => {
      const updatedUser = { ...mockUser, ...updateData };
      mockUserService.updateUser.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "User updated successfully",
          responseObject: updatedUser,
          statusCode: 200,
        }),
      );

      const response = await request(app).patch(`/users/${mockUser.id}`).send(updateData);
      const result = response.body as ServiceResponse<User>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.username).toBe(updateData.username);
      expect(mockUserService.updateUser).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent user", async () => {
      mockUserService.updateUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with ID non-existent-id not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).patch("/users/non-existent-id").send(updateData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });

    it("should return 422 for empty update data", async () => {
      mockUserService.updateUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "At least one field must be provided for update",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).patch(`/users/${mockUser.id}`).send({});
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });

    it("should return 409 for conflicting email", async () => {
      mockUserService.updateUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with this email already exists",
          responseObject: null,
          statusCode: 409,
        }),
      );

      const response = await request(app)
        .patch(`/users/${mockUser.id}`)
        .send({ email: "existing@example.com" });
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
    });

    it("should return 409 for conflicting username", async () => {
      mockUserService.updateUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with this username already exists",
          responseObject: null,
          statusCode: 409,
        }),
      );

      const response = await request(app).patch(`/users/${mockUser.id}`).send({ username: "existinguser" });
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
    });
  });

  describe("DELETE /users/:id", () => {
    it("should delete a user successfully", async () => {
      mockUserService.deleteUser.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "User deleted successfully",
          responseObject: null,
          statusCode: 204,
        }),
      );

      const response = await request(app).delete(`/users/${mockUser.id}`);

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(mockUserService.deleteUser).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent user", async () => {
      mockUserService.deleteUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User with ID non-existent-id not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).delete("/users/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });

    it("should return 422 for invalid user ID", async () => {
      mockUserService.deleteUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "User ID is required",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).delete("/users/invalid-uuid");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });
});

