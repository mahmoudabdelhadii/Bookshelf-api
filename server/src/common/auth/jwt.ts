import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../utils/envConfig.js";

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;
const JWT_ISSUER = env.JWT_ISSUER;
const JWT_AUDIENCE = env.JWT_AUDIENCE;

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface VerificationResult {
  isValid: boolean;
  payload?: JwtPayload;
  error?: string;
  expired?: boolean;
}

export function generateAccessToken(
  payload: Omit<JwtPayload, "type" | "iat" | "exp" | "iss" | "aud">,
): string {
  const tokenPayload: Omit<JwtPayload, "iat" | "exp"> = {
    ...payload,
    type: "access",
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    algorithm: "HS256",
  };

  return jwt.sign(tokenPayload, JWT_SECRET, options);
}

export function generateRefreshToken(
  payload: Omit<JwtPayload, "type" | "iat" | "exp" | "iss" | "aud">,
): string {
  const tokenPayload: Omit<JwtPayload, "iat" | "exp"> = {
    ...payload,
    type: "refresh",
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
  };

  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    algorithm: "HS256",
  };

  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, options);
}
export function generateTokenPair(
  userPayload: Omit<JwtPayload, "type" | "iat" | "exp" | "iss" | "aud">,
): TokenPair {
  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(userPayload);

  const accessExpiresIn = parseExpiration(JWT_EXPIRES_IN);
  const refreshExpiresIn = parseExpiration(JWT_REFRESH_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiresIn,
    refreshExpiresIn,
  };
}

export function verifyAccessToken(token: string): VerificationResult {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (payload.type !== "access") {
      return { isValid: false, error: "Invalid token type" };
    }

    return { isValid: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { isValid: false, error: "Token expired", expired: true };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { isValid: false, error: "Invalid token" };
    }
    return { isValid: false, error: "Token verification failed" };
  }
}

export function verifyRefreshToken(token: string): VerificationResult {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (payload.type !== "refresh") {
      return { isValid: false, error: "Invalid token type" };
    }

    return { isValid: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { isValid: false, error: "Refresh token expired", expired: true };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { isValid: false, error: "Invalid refresh token" };
    }
    return { isValid: false, error: "Refresh token verification failed" };
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded?.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }
  return expiration < new Date();
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateJwtConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }

  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    errors.push("JWT_REFRESH_SECRET must be at least 32 characters long");
  }

  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }

  try {
    parseExpiration(JWT_EXPIRES_IN);
  } catch {
    errors.push("JWT_EXPIRES_IN must be a valid time string (e.g., '15m', '1h')");
  }

  try {
    parseExpiration(JWT_REFRESH_EXPIRES_IN);
  } catch {
    errors.push("JWT_REFRESH_EXPIRES_IN must be a valid time string (e.g., '7d', '30d')");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function parseExpiration(expiration: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = /^(\d+)([smhdw])$/.exec(expiration);
  if (!match) {
    throw new Error(`Invalid expiration format: ${expiration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
}

export function createTokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const TokenUtils = {
  createTestToken(payload: Partial<JwtPayload>, type: "access" | "refresh" = "access"): string {
    const defaultPayload: Omit<JwtPayload, "type" | "iat" | "exp" | "iss" | "aud"> = {
      userId: "test-user-id",
      username: "testuser",
      email: "test@example.com",
      role: "user",
      permissions: ["user:read:own"],
      sessionId: generateSessionId(),
    };

    const fullPayload = { ...defaultPayload, ...payload };

    return type === "access" ? generateAccessToken(fullPayload) : generateRefreshToken(fullPayload);
  },

  createExpiredToken(payload: Partial<JwtPayload> = {}): string {
    const tokenPayload: Omit<JwtPayload, "iat" | "exp"> = {
      userId: "test-user-id",
      username: "testuser",
      email: "test@example.com",
      role: "user",
      permissions: ["user:read:own"],
      sessionId: generateSessionId(),
      type: "access",
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      ...payload,
    };

    return jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "-1s",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    });
  },
};

export const JwtConfig = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  JWT_ISSUER,
  JWT_AUDIENCE,
} as const;
