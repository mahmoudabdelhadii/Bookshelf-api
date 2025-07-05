import bcrypt from "bcryptjs";
import crypto from "node:crypto";



const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

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
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}


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
  } catch (err) {
    throw new Error(`Failed to hash password: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}


export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error(err);
    return false;
  }
}


export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (err) {
    console.error(err);

    return true;
  }
}


export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  const hasValidLength = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
  if (!hasValidLength) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      feedback.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    } else {
      feedback.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
    }
  } else {
    score += 20;

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = new RegExp(
    `[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
  ).test(password);

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
    feedback.push(
      `Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`,
    );
  } else {
    score += 15;
  }

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

  const commonWords = ["admin", "user", "test", "guest", "login", "welcome", "secret"];
  const lowerPassword = password.toLowerCase();
  if (commonWords.some((word) => lowerPassword.includes(word))) {
    feedback.push("Password should not contain common words");
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  const isValid =
    hasValidLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars && feedback.length === 0;

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


export function generateSecurePassword(length = 16): string {
  if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}`);
  }

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let password = "";
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += specialChars[crypto.randomInt(specialChars.length)];

  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}


export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}


export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}


export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}


export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}


export function encryptSensitiveData(data: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}


export function decryptSensitiveData(encryptedData: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
