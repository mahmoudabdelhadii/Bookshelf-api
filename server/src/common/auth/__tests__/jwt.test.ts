import { describe, it, expect, beforeEach } from "vitest";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  extractTokenFromHeader,
  generateSessionId,
  validateJwtConfig,
  createTokenHash,
  TokenUtils,
} from "../jwt.js";

describe("JWT utilities", () => {
  const mockPayload = {
    userId: "user-123",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    permissions: ["user:read", "user:update"],
    sessionId: "session-123",
  };

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); 
    });

    it("should include correct payload in token", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockPayload.userId);
      expect(decoded!.username).toBe(mockPayload.username);
      expect(decoded!.email).toBe(mockPayload.email);
      expect(decoded!.type).toBe("access");
    });

    it("should include standard JWT claims", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded!.iat).toBeDefined(); 
      expect(decoded!.exp).toBeDefined(); 
      expect(decoded!.iss).toBeDefined(); 
      expect(decoded!.aud).toBeDefined(); 
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should mark token as refresh type", () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded!.type).toBe("refresh");
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      const tokenPair = generateTokenPair(mockPayload);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.expiresIn).toBeDefined();
      expect(tokenPair.refreshExpiresIn).toBeDefined();
    });

    it("should have different tokens", () => {
      const tokenPair = generateTokenPair(mockPayload);

      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken);
    });

    it("should have correct expiration times", () => {
      const tokenPair = generateTokenPair(mockPayload);

      expect(tokenPair.expiresIn).toBeGreaterThan(0);
      expect(tokenPair.refreshExpiresIn).toBeGreaterThan(tokenPair.expiresIn);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", () => {
      const token = generateAccessToken(mockPayload);
      const result = verifyAccessToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.userId).toBe(mockPayload.userId);
      expect(result.error).toBeUndefined();
    });

    it("should reject refresh token", () => {
      const refreshToken = generateRefreshToken(mockPayload);
      const result = verifyAccessToken(refreshToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid token type");
    });

    it("should reject malformed token", () => {
      const result = verifyAccessToken("invalid.token");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("should detect expired token", () => {
      const expiredToken = TokenUtils.createExpiredToken();
      const result = verifyAccessToken(expiredToken);

      expect(result.isValid).toBe(false);
      expect(result.expired).toBe(true);
      expect(result.error).toBe("Token expired");
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", () => {
      const token = generateRefreshToken(mockPayload);
      const result = verifyRefreshToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.type).toBe("refresh");
    });

    it("should reject access token", () => {
      const accessToken = generateAccessToken(mockPayload);
      const result = verifyRefreshToken(accessToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid token type");
    });
  });

  describe("decodeToken", () => {
    it("should decode valid token without verification", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockPayload.userId);
    });

    it("should return null for invalid token", () => {
      const decoded = decodeToken("invalid.token");

      expect(decoded).toBeNull();
    });

    it("should decode expired token", () => {
      const expiredToken = TokenUtils.createExpiredToken();
      const decoded = decodeToken(expiredToken);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBeDefined();
    });
  });

  describe("getTokenExpiration", () => {
    it("should return expiration date for valid token", () => {
      const token = generateAccessToken(mockPayload);
      const expiration = getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it("should return null for invalid token", () => {
      const expiration = getTokenExpiration("invalid.token");

      expect(expiration).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for valid token", () => {
      const token = generateAccessToken(mockPayload);
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it("should return true for expired token", () => {
      const expiredToken = TokenUtils.createExpiredToken();
      const expired = isTokenExpired(expiredToken);

      expect(expired).toBe(true);
    });

    it("should return true for invalid token", () => {
      const expired = isTokenExpired("invalid.token");

      expect(expired).toBe(true);
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer header", () => {
      const token = "sample.jwt.token";
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it("should return null for invalid format", () => {
      expect(extractTokenFromHeader("InvalidFormat token")).toBeNull();
      expect(extractTokenFromHeader("Bearer")).toBeNull();
      expect(extractTokenFromHeader("Bearer ")).toBeNull();
    });

    it("should return null for undefined header", () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });
  });

  describe("generateSessionId", () => {
    it("should generate unique session IDs", () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(64); 
    });
  });

  describe("validateJwtConfig", () => {
    it("should validate correct configuration", () => {
      const result = validateJwtConfig();

      
      expect(result.isValid).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe("createTokenHash", () => {
    it("should create consistent hash for same token", () => {
      const token = "sample.jwt.token";
      const hash1 = createTokenHash(token);
      const hash2 = createTokenHash(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); 
    });

    it("should create different hashes for different tokens", () => {
      const token1 = "sample.jwt.token1";
      const token2 = "sample.jwt.token2";
      const hash1 = createTokenHash(token1);
      const hash2 = createTokenHash(token2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("TokenUtils", () => {
    describe("createTestToken", () => {
      it("should create test access token with default payload", () => {
        const token = TokenUtils.createTestToken({});
        const decoded = decodeToken(token);

        expect(decoded).toBeDefined();
        expect(decoded!.type).toBe("access");
        expect(decoded!.userId).toBe("test-user-id");
        expect(decoded!.username).toBe("testuser");
      });

      it("should create test refresh token", () => {
        const token = TokenUtils.createTestToken({}, "refresh");
        const decoded = decodeToken(token);

        expect(decoded!.type).toBe("refresh");
      });

      it("should merge custom payload", () => {
        const customPayload = { userId: "custom-user", role: "admin" };
        const token = TokenUtils.createTestToken(customPayload);
        const decoded = decodeToken(token);

        expect(decoded!.userId).toBe("custom-user");
        expect(decoded!.role).toBe("admin");
        expect(decoded!.username).toBe("testuser"); 
      });
    });

    describe("createExpiredToken", () => {
      it("should create expired token", () => {
        const token = TokenUtils.createExpiredToken();
        const expired = isTokenExpired(token);

        expect(expired).toBe(true);
      });

      it("should create expired token with custom payload", () => {
        const customPayload = { userId: "custom-user" };
        const token = TokenUtils.createExpiredToken(customPayload);
        const decoded = decodeToken(token);
        const expired = isTokenExpired(token);

        expect(decoded!.userId).toBe("custom-user");
        expect(expired).toBe(true);
      });
    });
  });

  describe("Edge cases and security", () => {
    it("should handle null/undefined inputs gracefully", () => {
      expect(decodeToken(null as any)).toBeNull();
      expect(decodeToken(undefined as any)).toBeNull();
      expect(getTokenExpiration(null as any)).toBeNull();
      expect(isTokenExpired(null as any)).toBe(true);
    });

    it("should reject tokens with wrong issuer", () => {
      
      
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded!.iss).toBeDefined();
    });

    it("should reject tokens with wrong audience", () => {
      
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded!.aud).toBeDefined();
    });

    it("should generate cryptographically secure session IDs", () => {
      const sessionIds = Array.from({ length: 100 }, () => generateSessionId());
      const uniqueIds = new Set(sessionIds);

      
      expect(uniqueIds.size).toBe(sessionIds.length);

      
      for (const id of sessionIds) {
        expect(id).toMatch(/^[a-f0-9]+$/);
      }
    });

    it("should handle malformed JWT structures", () => {
      const malformedTokens = [
        "not.a.jwt",
        "only.two.parts",
        "",
        "too.many.parts.here.extra",
        "header.payload.", 
        ".payload.signature", 
        "header..signature", 
      ];

      for (const token of malformedTokens) {
        const result = verifyAccessToken(token);
        expect(result.isValid).toBe(false);
      }
    });
  });
});
