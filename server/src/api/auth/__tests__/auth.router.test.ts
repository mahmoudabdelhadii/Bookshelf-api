import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { authRouter } from "../auth.router.js";
import { AuthController } from "../auth.controller.js";
import { OAuthController } from "../oauth.controller.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "database/test-utils";

// Mock the controllers
const mockAuthController = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  requestEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  getProfile: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
  enableTwoFactor: vi.fn(),
  disableTwoFactor: vi.fn(),
  verifyTwoFactor: vi.fn(),
};

const mockOAuthController = {
  googleCallback: vi.fn(),
  appleCallback: vi.fn(),
  linkAccount: vi.fn(),
  unlinkAccount: vi.fn(),
};

Object.assign(AuthController, mockAuthController);
Object.assign(OAuthController, mockOAuthController);

const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  isActive: true,
  isEmailVerified: true,
  isSuspended: false,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresIn: 3600,
};

describe("Auth Router", () => {
  let app: Express;
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await setupTestDb("auth-router-test");
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
    app.use("/auth", authRouter);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const registerData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1990-01-01",
      };

      const mockResponse: ServiceResponse<typeof mockUser> = {
        success: true,
        message: "User registered successfully",
        responseObject: mockUser,
        statusCode: StatusCodes.CREATED,
      };

      mockAuthController.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(registerData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(mockAuthController.register).toHaveBeenCalledOnce();
    });

    it("should return 400 for invalid email format", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "SecurePass123!",
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1990-01-01",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for weak password", async () => {
      const invalidData = {
        email: "test@example.com",
        password: "weak",
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1990-01-01",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate email", async () => {
      const registerData = {
        email: "existing@example.com",
        password: "SecurePass123!",
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1990-01-01",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Email already exists",
        responseObject: null,
        statusCode: StatusCodes.CONFLICT,
      };

      mockAuthController.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(registerData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email already exists");
    });
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const loginData = {
        email: "test@example.com",
        password: "SecurePass123!",
      };

      const mockResponse: ServiceResponse<typeof mockAuthResponse> = {
        success: true,
        message: "Login successful",
        responseObject: mockAuthResponse,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.login.mockResolvedValue(mockResponse);

      const response = await request(app).post("/auth/login").send(loginData).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.accessToken).toBe("mock-access-token");
      expect(mockAuthController.login).toHaveBeenCalledOnce();
    });

    it("should return 401 for invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Invalid credentials",
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      mockAuthController.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(StatusCodes.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 400 for missing email", async () => {
      const invalidData = {
        password: "SecurePass123!",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for missing password", async () => {
      const invalidData = {
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout user successfully", async () => {
      const mockResponse: ServiceResponse = {
        success: true,
        message: "Logout successful",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.logout.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "Bearer mock-token")
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logout successful");
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should refresh token successfully", async () => {
      const refreshData = {
        refreshToken: "valid-refresh-token",
      };

      const mockResponse: ServiceResponse<typeof mockAuthResponse> = {
        success: true,
        message: "Token refreshed successfully",
        responseObject: mockAuthResponse,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh-token")
        .send(refreshData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.responseObject.accessToken).toBe("mock-access-token");
    });

    it("should return 401 for invalid refresh token", async () => {
      const refreshData = {
        refreshToken: "invalid-token",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Invalid refresh token",
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      mockAuthController.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/refresh-token")
        .send(refreshData)
        .expect(StatusCodes.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should send password reset email successfully", async () => {
      const forgotData = {
        email: "test@example.com",
      };

      const mockResponse: ServiceResponse = {
        success: true,
        message: "Password reset email sent",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.forgotPassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/forgot-password")
        .send(forgotData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Password reset email sent");
    });

    it("should return 400 for invalid email", async () => {
      const forgotData = {
        email: "invalid-email",
      };

      const response = await request(app)
        .post("/auth/forgot-password")
        .send(forgotData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should reset password successfully", async () => {
      const resetData = {
        token: "valid-reset-token",
        newPassword: "NewSecurePass123!",
      };

      const mockResponse: ServiceResponse = {
        success: true,
        message: "Password reset successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app).post("/auth/reset-password").send(resetData).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Password reset successfully");
    });

    it("should return 400 for invalid token", async () => {
      const resetData = {
        token: "invalid-token",
        newPassword: "NewSecurePass123!",
      };

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Invalid or expired reset token",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockAuthController.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/reset-password")
        .send(resetData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /auth/verify-email/:token", () => {
    it("should verify email successfully", async () => {
      const token = "valid-verification-token";

      const mockResponse: ServiceResponse = {
        success: true,
        message: "Email verified successfully",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.verifyEmail.mockResolvedValue(mockResponse);

      const response = await request(app).get(`/auth/verify-email/${token}`).expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Email verified successfully");
    });

    it("should return 400 for invalid verification token", async () => {
      const token = "invalid-token";

      const mockResponse: ServiceResponse = {
        success: false,
        message: "Invalid or expired verification token",
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      mockAuthController.verifyEmail.mockResolvedValue(mockResponse);

      const response = await request(app).get(`/auth/verify-email/${token}`).expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/request-verification", () => {
    it("should request email verification successfully", async () => {
      const verificationData = {
        email: "test@example.com",
      };

      const mockResponse: ServiceResponse = {
        success: true,
        message: "Verification email sent",
        responseObject: null,
        statusCode: StatusCodes.OK,
      };

      mockAuthController.requestEmailVerification.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/request-verification")
        .send(verificationData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Verification email sent");
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to auth endpoints", async () => {
      // Mock multiple requests to trigger rate limiting
      const loginData = {
        email: "test@example.com",
        password: "password",
      };

      // Make multiple requests quickly
      const promises = Array(6)
        .fill(null)
        .map(() => request(app).post("/auth/login").send(loginData));

      const responses = await Promise.all(promises);

      // At least one request should be rate limited (429)
      const rateLimitedResponses = responses.filter((r) => r.status === StatusCodes.TOO_MANY_REQUESTS);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("OAuth Routes", () => {
    describe("GET /auth/google", () => {
      it("should redirect to Google OAuth", async () => {
        const response = await request(app).get("/auth/google").expect(StatusCodes.OK);

        expect(response.headers.location).toContain("accounts.google.com");
      });
    });

    describe("GET /auth/google/callback", () => {
      it("should handle Google OAuth callback", async () => {
        const mockResponse: ServiceResponse<typeof mockAuthResponse> = {
          success: true,
          message: "OAuth authentication successful",
          responseObject: mockAuthResponse,
          statusCode: StatusCodes.OK,
        };

        mockOAuthController.googleCallback.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get("/auth/google/callback?code=mock-auth-code")
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
      });
    });

    describe("GET /auth/apple", () => {
      it("should redirect to Apple OAuth", async () => {
        const response = await request(app).get("/auth/apple").expect(StatusCodes.OK);

        expect(response.headers.location).toContain("appleid.apple.com");
      });
    });
  });

  describe("Profile Management", () => {
    describe("GET /auth/profile", () => {
      it("should get user profile successfully", async () => {
        const mockResponse: ServiceResponse<typeof mockUser> = {
          success: true,
          message: "Profile retrieved successfully",
          responseObject: mockUser,
          statusCode: StatusCodes.OK,
        };

        mockAuthController.getProfile.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get("/auth/profile")
          .set("Authorization", "Bearer mock-token")
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject.email).toBe("test@example.com");
      });
    });

    describe("PUT /auth/profile", () => {
      it("should update profile successfully", async () => {
        const updateData = {
          firstName: "UpdatedJohn",
          lastName: "UpdatedDoe",
        };

        const updatedUser = { ...mockUser, ...updateData };
        const mockResponse: ServiceResponse<typeof updatedUser> = {
          success: true,
          message: "Profile updated successfully",
          responseObject: updatedUser,
          statusCode: StatusCodes.OK,
        };

        mockAuthController.updateProfile.mockResolvedValue(mockResponse);

        const response = await request(app)
          .put("/auth/profile")
          .set("Authorization", "Bearer mock-token")
          .send(updateData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject.firstName).toBe("UpdatedJohn");
      });
    });

    describe("POST /auth/change-password", () => {
      it("should change password successfully", async () => {
        const changePasswordData = {
          currentPassword: "OldPass123!",
          newPassword: "NewPass123!",
        };

        const mockResponse: ServiceResponse = {
          success: true,
          message: "Password changed successfully",
          responseObject: null,
          statusCode: StatusCodes.OK,
        };

        mockAuthController.changePassword.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post("/auth/change-password")
          .set("Authorization", "Bearer mock-token")
          .send(changePasswordData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe("Two-Factor Authentication", () => {
    describe("POST /auth/2fa/enable", () => {
      it("should enable 2FA successfully", async () => {
        const mockResponse: ServiceResponse<{ qrCode: string; secret: string }> = {
          success: true,
          message: "2FA enabled successfully",
          responseObject: { qrCode: "data:image/png;base64,mock", secret: "MOCK_SECRET" },
          statusCode: StatusCodes.OK,
        };

        mockAuthController.enableTwoFactor.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post("/auth/2fa/enable")
          .set("Authorization", "Bearer mock-token")
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.responseObject.qrCode).toContain("data:image");
      });
    });

    describe("POST /auth/2fa/verify", () => {
      it("should verify 2FA token successfully", async () => {
        const verifyData = {
          token: "123456",
        };

        const mockResponse: ServiceResponse = {
          success: true,
          message: "2FA token verified successfully",
          responseObject: null,
          statusCode: StatusCodes.OK,
        };

        mockAuthController.verifyTwoFactor.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post("/auth/2fa/verify")
          .set("Authorization", "Bearer mock-token")
          .send(verifyData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe("Account Management", () => {
    describe("DELETE /auth/account", () => {
      it("should delete account successfully", async () => {
        const deleteData = {
          password: "ConfirmPass123!",
          confirmation: "DELETE_MY_ACCOUNT",
        };

        const mockResponse: ServiceResponse = {
          success: true,
          message: "Account deleted successfully",
          responseObject: null,
          statusCode: StatusCodes.OK,
        };

        mockAuthController.deleteAccount.mockResolvedValue(mockResponse);

        const response = await request(app)
          .delete("/auth/account")
          .set("Authorization", "Bearer mock-token")
          .send(deleteData)
          .expect(StatusCodes.OK);

        expect(response.body.success).toBe(true);
      });
    });
  });
});

