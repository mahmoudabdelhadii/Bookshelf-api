import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";
import cookieParser from "cookie-parser";

import authRouter from "../auth.router.js";
import { AuthService } from "../auth.service.js";
import { setupTestDb } from "../../../common/utils/testUtils.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";

// Mock the AuthService
const mockAuthService = {
  registerUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  changePassword: vi.fn(),
};

// Replace the actual service with our mock
Object.assign(AuthService, mockAuthService);

// Mock data
const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "user",
  permissions: ["user:read:own", "user:update:own"],
  isActive: true,
  isEmailVerified: true,
  isSuspended: false,
};

const mockTokens = {
  accessToken: "mock.jwt.token",
  refreshToken: "mock.refresh.token",
  expiresIn: 900, // 15 minutes
  refreshExpiresIn: 604800, // 7 days
};

const mockLoginResult = {
  user: mockUser,
  tokens: mockTokens,
  sessionId: "mock-session-id",
};

describe("Authentication API endpoints", () => {
  let app: Express;
  let testDb: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const dbSetup = await setupTestDb("auth-test");
    testDb = dbSetup.drizzle;
    close = dbSetup.close;
    
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Add drizzle instance to request
    app.use((req: any, res, next) => {
      req.drizzle = testDb;
      next();
    });
    
    app.use("/auth", authRouter);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    const validRegistrationData = {
      username: "newuser",
      email: "newuser@example.com",
      firstName: "New",
      lastName: "User",
      password: "SecurePass123!",
    };

    it("should register a new user successfully", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "User registered successfully",
        responseObject: {
          user: {
            id: "new-user-id",
            username: "newuser",
            email: "newuser@example.com",
            firstName: "New",
            lastName: "User",
          },
        },
        statusCode: StatusCodes.CREATED,
      };

      mockAuthService.registerUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(validRegistrationData);

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(
        testDb,
        validRegistrationData
      );
    });

    it("should return 422 for invalid email", async () => {
      const invalidData = { ...validRegistrationData, email: "invalid-email" };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData);

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });

    it("should return 422 for weak password", async () => {
      const invalidData = { ...validRegistrationData, password: "weak" };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData);

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate email", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: false,
        message: "User with this email already exists",
        responseObject: { field: "email" },
        statusCode: StatusCodes.CONFLICT,
      };

      mockAuthService.registerUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(validRegistrationData);

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    it("should login successfully with valid credentials", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "Login successful",
        responseObject: mockLoginResult,
        statusCode: StatusCodes.OK,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(validLoginData);

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.user.email).toBe(mockUser.email);
      expect(response.body.responseObject.tokens).toBeDefined();
      
      // Should set refresh token cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes("refreshToken"))).toBe(true);
    });

    it("should return 401 for invalid credentials", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: false,
        message: "Invalid email or password",
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });

    it("should return 422 for missing email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ password: "SecurePass123!" });

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });

    it("should return 422 for missing password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com" });

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh token successfully", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "Token refreshed successfully",
        responseObject: {
          accessToken: "new.access.token",
          refreshToken: "new.refresh.token",
          expiresIn: 900,
          refreshExpiresIn: 604800,
        },
        statusCode: StatusCodes.OK,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "valid.refresh.token" });

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.accessToken).toBeDefined();
    });

    it("should work with refresh token from cookie", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "Token refreshed successfully",
        responseObject: {
          accessToken: "new.access.token",
          refreshToken: "new.refresh.token",
          expiresIn: 900,
          refreshExpiresIn: 604800,
        },
        statusCode: StatusCodes.OK,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", ["refreshToken=valid.refresh.token"])
        .send({});

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });

    it("should return 401 for missing refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({});

      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 for invalid refresh token", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: false,
        message: "Invalid or expired refresh token",
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "invalid.token" });

      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/password/reset-request", () => {
    it("should request password reset successfully", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "If an account with that email exists, password reset instructions have been sent.",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthService.requestPasswordReset.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/password/reset-request")
        .send({ email: "test@example.com" });

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalled();
    });

    it("should return 422 for invalid email", async () => {
      const response = await request(app)
        .post("/auth/password/reset-request")
        .send({ email: "invalid-email" });

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/password/reset", () => {
    const validResetData = {
      token: "valid-reset-token",
      newPassword: "NewSecurePass123!",
    };

    it("should reset password successfully", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "Password reset successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/password/reset")
        .send(validResetData);

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for invalid token", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: false,
        message: "Invalid or expired reset token",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/password/reset")
        .send({ ...validResetData, token: "invalid-token" });

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
    });

    it("should return 422 for weak password", async () => {
      const response = await request(app)
        .post("/auth/password/reset")
        .send({ token: "valid-token", newPassword: "weak" });

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/email/verify", () => {
    it("should verify email successfully", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "Email verified successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthService.verifyEmail.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/email/verify")
        .send({ token: "valid-verification-token" });

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for invalid verification token", async () => {
      const mockResponse: ServiceResponse<any> = {
        success: false,
        message: "Invalid or expired verification token",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockAuthService.verifyEmail.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/email/verify")
        .send({ token: "invalid-token" });

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /auth/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/auth/health");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Authentication service is healthy");
      expect(response.body.responseObject.service).toBe("authentication");
    });
  });

  describe("Rate limiting", () => {
    it("should not rate limit in test environment", async () => {
      // Make multiple requests quickly
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post("/auth/login")
          .send({ email: "test@example.com", password: "wrong" })
      );

      const responses = await Promise.all(promises);

      // All should return validation errors, not rate limit errors
      responses.forEach(response => {
        expect(response.statusCode).not.toBe(StatusCodes.TOO_MANY_REQUESTS);
      });
    });
  });

  describe("Error handling", () => {
    it("should handle service errors gracefully", async () => {
      mockAuthService.registerUser.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          password: "SecurePass123!",
        });

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error during registration");
    });

    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("Input validation", () => {
    it("should sanitize HTML in input", async () => {
      const maliciousInput = {
        username: "<script>alert('xss')</script>normalusername",
        email: "test@example.com",
        firstName: "Test<img src=x onerror=alert(1)>",
        lastName: "User",
        password: "SecurePass123!",
      };

      // Mock successful registration to test input sanitization
      const mockResponse: ServiceResponse<any> = {
        success: true,
        message: "User registered successfully",
        responseObject: { user: mockUser },
        statusCode: StatusCodes.CREATED,
      };

      mockAuthService.registerUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(maliciousInput);

      // Verify that the service was called with sanitized input
      const calledWith = mockAuthService.registerUser.mock.calls[0][1];
      expect(calledWith.username).not.toContain("<script>");
      expect(calledWith.firstName).not.toContain("<img");
    });
  });
});