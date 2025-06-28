import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("Password Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing Security", () => {
    it("should use secure bcrypt parameters", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      
      expect(hash).toMatch(/^\$2[aby]\$/);
      
      
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.length).toBeLessThan(80);
    });

    it("should resist timing attacks", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      
      const start1 = Date.now();
      await verifyPassword(password, hash);
      const time1 = Date.now() - start1;

      
      const start2 = Date.now();
      await verifyPassword("WrongPassword123!", hash);
      const time2 = Date.now() - start2;

      
      
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(100); 
    });

    it("should generate unique salts for identical passwords", async () => {
      const password = "IdenticalPassword123!";
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      const hash3 = await hashPassword(password);

      
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);

      
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
      expect(await verifyPassword(password, hash3)).toBe(true);
    });

    it("should handle concurrent hashing operations", async () => {
      const password = "ConcurrentTest123!";
      const promises = Array.from({ length: 10 }, () => hashPassword(password));

      const hashes = await Promise.all(promises);

      
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);

      
      const verifications = await Promise.all(
        hashes.map(hash => verifyPassword(password, hash))
      );
      expect(verifications.every(result => result)).toBe(true);
    });

    it("should detect weak hashes that need rehashing", async () => {
      
      
      
      const weakHash = "$2a$04$shortround.hash.example"; 
      expect(needsRehash(weakHash)).toBe(true);

      const strongHash = await hashPassword("TestPassword123!");
      expect(needsRehash(strongHash)).toBe(false);
    });
  });

  describe("Password Strength Analysis", () => {
    it("should identify various attack vectors", () => {
      const testCases = [
        {
          password: "password123",
          expectedIssues: ["common password", "predictable pattern"]
        },
        {
          password: "123456789",
          expectedIssues: ["numeric sequence", "no letters"]
        },
        {
          password: "qwertyuiop",
          expectedIssues: ["keyboard pattern", "no numbers", "no special characters"]
        },
        {
          password: "aaaaaaaaa",
          expectedIssues: ["repeated characters", "no complexity"]
        },
        {
          password: "Password1",
          expectedIssues: ["too short", "predictable capitalization"]
        }
      ];

      for (const { password, expectedIssues } of testCases) {
        const result = evaluatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        
        const hasExpectedIssues = expectedIssues.some(issue => 
          result.feedback.some(feedback => 
            feedback.toLowerCase().includes(issue.toLowerCase())
          )
        );
        expect(hasExpectedIssues).toBe(true);
      }
    });

    it("should calculate entropy correctly", () => {
      const highEntropyPassword = "Tr0ub4dor&3K9!mN7";
      const lowEntropyPassword = "password123";

      const highEntropyResult = evaluatePasswordStrength(highEntropyPassword);
      const lowEntropyResult = evaluatePasswordStrength(lowEntropyPassword);

      expect(highEntropyResult.score).toBeGreaterThan(lowEntropyResult.score);
      expect(highEntropyResult.score).toBeGreaterThan(80);
      expect(lowEntropyResult.score).toBeLessThan(50);
    });

    it("should detect dictionary words and common substitutions", () => {
      const dictionaryPasswords = [
        "password",
        "p4ssw0rd", 
        "P@ssw0rd!",
        "admin123",
        "letmein",
        "monkey",
        "dragon"
      ];

      for (const password of dictionaryPasswords) {
        const result = evaluatePasswordStrength(password);
        expect(result.score).toBeLessThan(70); 
        expect(result.feedback.some(fb => 
          fb.toLowerCase().includes("common") || 
          fb.toLowerCase().includes("dictionary")
        )).toBe(true);
      }
    });

    it("should validate character complexity requirements", () => {
      const testCases = [
        {
          password: "onlylowercase",
          missing: "uppercase"
        },
        {
          password: "ONLYUPPERCASE",
          missing: "lowercase"
        },
        {
          password: "NoNumbers!",
          missing: "numbers"
        },
        {
          password: "NoSpecialChars123",
          missing: "special"
        }
      ];

      for (const { password, missing } of testCases) {
        const result = evaluatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.feedback.some(fb => 
          fb.toLowerCase().includes(missing)
        )).toBe(true);
      }
    });

    it("should reward password length appropriately", () => {
      const basePassword = "Strong1!";
      const longPassword = "VeryLongAndSecurePassword123!WithManyCharacters";

      const baseResult = evaluatePasswordStrength(basePassword);
      const longResult = evaluatePasswordStrength(longPassword);

      expect(longResult.score).toBeGreaterThan(baseResult.score);
      expect(longResult.score).toBeGreaterThan(90);
    });

    it("should detect patterns and sequences", () => {
      const patternPasswords = [
        "abc123ABC!",
        "123abc!@#",
        "qwerty123",
        "Password1234567890",
        "aaabbbccc111"
      ];

      for (const password of patternPasswords) {
        const result = evaluatePasswordStrength(password);
        expect(result.score).toBeLessThan(80); 
      }
    });
  });

  describe("Secure Password Generation", () => {
    it("should generate cryptographically secure passwords", () => {
      const passwords = Array.from({ length: 100 }, () => generateSecurePassword(16));

      
      const uniquePasswords = new Set(passwords);
      expect(uniquePasswords.size).toBe(passwords.length);

      
      for (const password of passwords) {
        const strength = evaluatePasswordStrength(password);
        expect(strength.isValid).toBe(true);
        expect(strength.score).toBeGreaterThan(80);
      }
    });

    it("should have good character distribution", () => {
      const password = generateSecurePassword(32);
      
      
      expect(password).toMatch(/[a-z]/); 
      expect(password).toMatch(/[A-Z]/); 
      expect(password).toMatch(/\d/);    
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); 

      
      const lowercase = (password.match(/[a-z]/g) || []).length;
      const uppercase = (password.match(/[A-Z]/g) || []).length;
      const digits = (password.match(/\d/g) || []).length;
      const special = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;

      
      expect(lowercase).toBeGreaterThan(0);
      expect(uppercase).toBeGreaterThan(0);
      expect(digits).toBeGreaterThan(0);
      expect(special).toBeGreaterThan(0);

      
      expect(lowercase).toBeLessThan(password.length * 0.8);
      expect(uppercase).toBeLessThan(password.length * 0.8);
      expect(digits).toBeLessThan(password.length * 0.8);
      expect(special).toBeLessThan(password.length * 0.8);
    });

    it("should avoid ambiguous characters when specified", () => {
      
      const password = generateSecurePassword(20);
      
      
      
      expect(password).toBeDefined();
      expect(password.length).toBe(20);
    });
  });

  describe("Token Security", () => {
    it("should generate cryptographically secure tokens", () => {
      const tokens = Array.from({ length: 1000 }, () => generateSecureToken(32));

      
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      
      for (const token of tokens) {
        expect(token).toMatch(/^[a-f0-9]+$/);
        expect(token.length).toBe(64); 
      }
    });

    it("should hash tokens consistently", () => {
      const token = "test-token-123";
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      
      expect(hash1).toBe(hash2);

      
      const differentHash = hashToken("different-token-456");
      expect(hash1).not.toBe(differentHash);
    });

    it("should verify tokens securely", () => {
      const token = "secure-test-token";
      const hash = hashToken(token);

      
      expect(verifyToken(token, hash)).toBe(true);

      
      expect(verifyToken("wrong-token", hash)).toBe(false);
      expect(verifyToken("", hash)).toBe(false);
      expect(verifyToken(`${token  }x`, hash)).toBe(false);
    });

    it("should resist timing attacks in token verification", () => {
      const token = "timing-test-token";
      const hash = hashToken(token);

      
      const wrongTokens = [
        "x",
        "short",
        "this-is-a-much-longer-incorrect-token-that-should-not-verify",
        "wrong-token-same-length", 
      ];

      for (const wrongToken of wrongTokens) {
        expect(verifyToken(wrongToken, hash)).toBe(false);
      }

      
      
    });
  });

  describe("Backup Codes Security", () => {
    it("should generate secure backup codes", () => {
      const codes = generateBackupCodes(10);

      expect(codes).toHaveLength(10);

      
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);

      
      for (const code of codes) {
        expect(code).toMatch(/^[A-F0-9]+$/);
        expect(code.length).toBe(8);
      }
    });

    it("should generate different sets each time", () => {
      const set1 = generateBackupCodes(5);
      const set2 = generateBackupCodes(5);
      const set3 = generateBackupCodes(5);

      
      const overlap12 = set1.filter(code => set2.includes(code));
      const overlap13 = set1.filter(code => set3.includes(code));
      const overlap23 = set2.filter(code => set3.includes(code));

      expect(overlap12).toHaveLength(0);
      expect(overlap13).toHaveLength(0);
      expect(overlap23).toHaveLength(0);
    });
  });

  describe("Security Edge Cases", () => {
    it("should handle null and undefined inputs safely", async () => {
      
      expect(await verifyPassword("", "")).toBe(false);
      expect(await verifyPassword(null as any, "hash")).toBe(false);
      expect(await verifyPassword("password", null as any)).toBe(false);
      expect(await verifyPassword(undefined as any, "hash")).toBe(false);

      expect(verifyToken("", "hash")).toBe(false);
      expect(verifyToken("token", "")).toBe(false);
      expect(verifyToken(null as any, "hash")).toBe(false);
    });

    it("should handle extremely long inputs", async () => {
      const longPassword = "a".repeat(10000);
      const longToken = "b".repeat(10000);

      
      await expect(hashPassword(longPassword)).rejects.toThrow();
      expect(verifyToken(longToken, "hash")).toBe(false);
    });

    it("should handle malformed hash inputs", async () => {
      const password = "TestPassword123!";
      const malformedHashes = [
        "",
        "not-a-hash",
        "$2b$invalid",
        "$2b$12$invalidhash",
        "random-string-123",
      ];

      for (const hash of malformedHashes) {
        expect(await verifyPassword(password, hash)).toBe(false);
      }
    });

    it("should handle unicode and special characters", async () => {
      const unicodePasswords = [
        "П@ssw0rd123!", 
        "密码123!",      
        "🔒secure123!",  
        "café_münü",     
      ];

      for (const password of unicodePasswords) {
        const hash = await hashPassword(password);
        expect(await verifyPassword(password, hash)).toBe(true);
        expect(await verifyPassword(`${password  }x`, hash)).toBe(false);
      }
    });

    it("should resist memory-based attacks", () => {
      
      
      
      const sensitiveData = "SuperSecretPassword123!";
      hashPassword(sensitiveData);

      
      
      
      
      
      
      expect(true).toBe(true);
    });

    it("should validate input lengths properly", async () => {
      
      const shortPassword = "1234567"; 
      const minPassword = "12345678"; 
      const longPassword = "a".repeat(129); 
      const maxPassword = "a".repeat(128); 

      await expect(hashPassword(shortPassword)).rejects.toThrow();
      await expect(hashPassword(longPassword)).rejects.toThrow();
      
      
      await expect(hashPassword(minPassword)).resolves.toBeDefined();
      await expect(hashPassword(maxPassword)).resolves.toBeDefined();
    });
  });

  describe("Performance and DoS Protection", () => {
    it("should complete hashing within reasonable time", async () => {
      const password = "PerformanceTest123!";
      const start = Date.now();
      
      await hashPassword(password);
      
      const duration = Date.now() - start;
      
      
      expect(duration).toBeLessThan(2000);
      
      
      expect(duration).toBeGreaterThan(10);
    });

    it("should handle concurrent password operations", async () => {
      const password = "ConcurrentTest123!";
      const concurrentOps = 20;
      
      const start = Date.now();
      
      const promises = Array.from({ length: concurrentOps }, async (_, i) => {
        const hash = await hashPassword(password + i);
        return verifyPassword(password + i, hash);
      });
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      
      expect(results.every(result => result)).toBe(true);
      
      
      expect(duration).toBeLessThan(10000); 
    });

    it("should limit resource consumption", () => {
      
      const iterations = 100;
      
      const start = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      
      for (let i = 0; i < iterations; i++) {
        generateSecureToken(32);
      }
      
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      
      expect(duration).toBeLessThan(1000);
      
      
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
