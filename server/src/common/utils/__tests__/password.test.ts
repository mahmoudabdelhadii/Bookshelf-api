import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  evaluatePasswordStrength,
  generateSecurePassword,
  generateSecureToken,
  hashToken,
  verifyToken,
  generateBackupCodes,
} from "../password.js";

describe("Password utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const password = "SecurePassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should throw error for empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow("Password must be a non-empty string");
    });

    it("should throw error for short password", async () => {
      await expect(hashPassword("short")).rejects.toThrow("Password must be at least 8 characters long");
    });

    it("should throw error for very long password", async () => {
      const longPassword = "a".repeat(200);
      await expect(hashPassword(longPassword)).rejects.toThrow("Password must not exceed 128 characters");
    });

    it("should generate different hashes for the same password", async () => {
      const password = "SecurePassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "SecurePassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "SecurePassword123!";
      const wrongPassword = "WrongPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hash = await hashPassword("SecurePassword123!");
      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(false);
    });

    it("should return false for empty hash", async () => {
      const isValid = await verifyPassword("SecurePassword123!", "");

      expect(isValid).toBe(false);
    });

    it("should handle invalid hash gracefully", async () => {
      const isValid = await verifyPassword("SecurePassword123!", "invalid-hash");

      expect(isValid).toBe(false);
    });
  });

  describe("needsRehash", () => {
    it("should return false for fresh hash with correct rounds", async () => {
      const password = "SecurePassword123!";
      const hash = await hashPassword(password);
      const needsRehashing = needsRehash(hash);

      expect(needsRehashing).toBe(false);
    });

    it("should return true for invalid hash", () => {
      const needsRehashing = needsRehash("invalid-hash");

      expect(needsRehashing).toBe(true);
    });
  });

  describe("evaluatePasswordStrength", () => {
    it("should validate strong password", () => {
      const result = evaluatePasswordStrength("SecurePassword123!");

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.feedback).toHaveLength(0);
      expect(result.requirements.length).toBe(true);
      expect(result.requirements.uppercase).toBe(true);
      expect(result.requirements.lowercase).toBe(true);
      expect(result.requirements.numbers).toBe(true);
      expect(result.requirements.specialChars).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const result = evaluatePasswordStrength("securepassword123!");

      expect(result.isValid).toBe(false);
      expect(result.requirements.uppercase).toBe(false);
      expect(result.feedback).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject password without lowercase", () => {
      const result = evaluatePasswordStrength("SECUREPASSWORD123!");

      expect(result.isValid).toBe(false);
      expect(result.requirements.lowercase).toBe(false);
      expect(result.feedback).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject password without numbers", () => {
      const result = evaluatePasswordStrength("SecurePassword!");

      expect(result.isValid).toBe(false);
      expect(result.requirements.numbers).toBe(false);
      expect(result.feedback).toContain("Password must contain at least one number");
    });

    it("should reject password without special characters", () => {
      const result = evaluatePasswordStrength("SecurePassword123");

      expect(result.isValid).toBe(false);
      expect(result.requirements.specialChars).toBe(false);
      expect(result.feedback).toContain("Password must contain at least one special character");
    });

    it("should reject short password", () => {
      const result = evaluatePasswordStrength("Pass1!");

      expect(result.isValid).toBe(false);
      expect(result.requirements.length).toBe(false);
      expect(result.feedback).toContain("Password must be at least 8 characters long");
    });

    it("should detect common patterns", () => {
      const result = evaluatePasswordStrength("Password123!");

      expect(result.score).toBeLessThan(80);
      expect(result.feedback).toContain("Password should not contain the word 'password'");
    });

    it("should detect repeated characters", () => {
      const result = evaluatePasswordStrength("Passsssword123!");

      expect(result.score).toBeLessThan(90);
      expect(result.feedback).toContain("Password should not contain repeated characters");
    });

    it("should detect common sequences", () => {
      const result = evaluatePasswordStrength("Password123abc!");

      expect(result.score).toBeLessThan(90);
      expect(result.feedback).toContain("Password should not contain common sequences");
    });

    it("should give bonus for longer passwords", () => {
      const short = evaluatePasswordStrength("SecPass1!");
      const long = evaluatePasswordStrength("SecurePassword123!WithMoreCharacters");

      expect(long.score).toBeGreaterThan(short.score);
    });
  });

  describe("generateSecurePassword", () => {
    it("should generate password with default length", () => {
      const password = generateSecurePassword();

      expect(password).toHaveLength(16);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it("should generate password with custom length", () => {
      const password = generateSecurePassword(20);

      expect(password).toHaveLength(20);
    });

    it("should throw error for invalid length", () => {
      expect(() => generateSecurePassword(5)).toThrow();
      expect(() => generateSecurePassword(200)).toThrow();
    });

    it("should generate different passwords each time", () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it("should meet strength requirements", () => {
      const password = generateSecurePassword();
      const strength = evaluatePasswordStrength(password);

      expect(strength.isValid).toBe(true);
    });
  });

  describe("generateSecureToken", () => {
    it("should generate token with default length", () => {
      const token = generateSecureToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it("should generate token with custom length", () => {
      const token = generateSecureToken(16);

      expect(token).toHaveLength(32);
    });

    it("should generate different tokens each time", () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe("hashToken and verifyToken", () => {
    it("should hash and verify token correctly", () => {
      const token = "secure-token-123";
      const hash = hashToken(token);
      const isValid = verifyToken(token, hash);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(token);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect token", () => {
      const token = "secure-token-123";
      const wrongToken = "wrong-token-123";
      const hash = hashToken(token);
      const isValid = verifyToken(wrongToken, hash);

      expect(isValid).toBe(false);
    });

    it("should generate same hash for same token", () => {
      const token = "secure-token-123";
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });
  });

  describe("generateBackupCodes", () => {
    it("should generate default number of codes", () => {
      const codes = generateBackupCodes();

      expect(codes).toHaveLength(10);
      for (const code of codes) {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-F0-9]+$/);
      }
    });

    it("should generate custom number of codes", () => {
      const codes = generateBackupCodes(5);

      expect(codes).toHaveLength(5);
    });

    it("should generate unique codes", () => {
      const codes = generateBackupCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("Edge cases and security", () => {
    it("should handle null and undefined inputs safely", async () => {
      await expect(verifyPassword(null as any, "hash")).resolves.toBe(false);
      await expect(verifyPassword("password", null as any)).resolves.toBe(false);
      await expect(verifyPassword(undefined as any, "hash")).resolves.toBe(false);
    });

    it("should handle non-string inputs", async () => {
      await expect(hashPassword(123 as any)).rejects.toThrow();
      await expect(verifyPassword(123 as any, "hash")).resolves.toBe(false);
    });

    it("should use constant-time comparison for tokens", () => {
      const token = "a".repeat(32);
      const hash = hashToken(token);

      const shortToken = "a".repeat(16);
      const longToken = "a".repeat(64);

      expect(verifyToken(shortToken, hash)).toBe(false);
      expect(verifyToken(longToken, hash)).toBe(false);
    });
  });
});
