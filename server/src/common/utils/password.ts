import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Password hashing and validation utilities using bcrypt
 * Production-grade security with configurable salt rounds
 */

// Configuration
const SALT_ROUNDS = 12; // Higher number = more secure but slower
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

/**
 * Hash a password using bcrypt with salt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Log error in production but don't expose details
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Check if a password needs to be rehashed (e.g., salt rounds changed)
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    // If we can't determine rounds, assume it needs rehashing
    return true;
  }
}

/**
 * Evaluate password strength and provide feedback
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  const hasValidLength = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
  if (!hasValidLength) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      feedback.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    } else {
      feedback.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
    }
  } else {
    score += 20;
    // Bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // Check character types
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`).test(password);

  if (!hasUppercase && PASSWORD_REQUIREMENTS.requireUppercase) {
    feedback.push("Password must contain at least one uppercase letter");
  } else {
    score += 15;
  }

  if (!hasLowercase && PASSWORD_REQUIREMENTS.requireLowercase) {
    feedback.push("Password must contain at least one lowercase letter");
  } else {
    score += 15;
  }

  if (!hasNumbers && PASSWORD_REQUIREMENTS.requireNumbers) {
    feedback.push("Password must contain at least one number");
  } else {
    score += 15;
  }

  if (!hasSpecialChars && PASSWORD_REQUIREMENTS.requireSpecialChars) {
    feedback.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
  } else {
    score += 15;
  }

  // Check for common patterns
  if (password.toLowerCase().includes("password")) {
    feedback.push("Password should not contain the word 'password'");
    score -= 20;
  }

  if (/(.)\1{2,}/.test(password)) {
    feedback.push("Password should not contain repeated characters");
    score -= 10;
  }

  if (/123|abc|qwe|asd/i.test(password)) {
    feedback.push("Password should not contain common sequences");
    score -= 15;
  }

  // Check for dictionary words (basic check)
  const commonWords = ["admin", "user", "test", "guest", "login", "welcome", "secret"];
  const lowerPassword = password.toLowerCase();
  if (commonWords.some(word => lowerPassword.includes(word))) {
    feedback.push("Password should not contain common words");
    score -= 15;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  const isValid = 
    hasValidLength && 
    hasUppercase && 
    hasLowercase && 
    hasNumbers && 
    hasSpecialChars &&
    feedback.length === 0;

  return {
    isValid,
    score,
    feedback,
    requirements: {
      length: hasValidLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      numbers: hasNumbers,
      specialChars: hasSpecialChars,
    },
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}`);
  }

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure at least one character from each required type
  let password = "";
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += specialChars[crypto.randomInt(specialChars.length)];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password to randomize character positions
  return password.split("").sort(() => crypto.randomInt(3) - 1).join("");
}

/**
 * Generate a secure token for password reset, email verification, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Create a hash for storing tokens (one-way hash)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token against its hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

/**
 * Encrypt sensitive data (like 2FA secrets, backup codes)
 */
export function encryptSensitiveData(data: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(encryptedData: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const parts = encryptedData.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}