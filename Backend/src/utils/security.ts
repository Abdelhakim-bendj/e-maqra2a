import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_DAYS = 7;
export const PASSWORD_RESET_TTL_MINUTES = 30;

function getSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (value && value.length >= 32) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured with at least 32 characters`);
  }

  return `${name.toLowerCase()}_development_secret_change_me_32_chars`;
}

export type AccessTokenPayload = {
  sub: string;
  role: Role;
  email: string;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: 'e-maqra2a-api',
    audience: 'e-maqra2a-web',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getSecret('JWT_ACCESS_SECRET'), {
    issuer: 'e-maqra2a-api',
    audience: 'e-maqra2a-web',
  }) as AccessTokenPayload;
}

export function createOpaqueToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

export function passwordResetExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TTL_MINUTES);
  return expiresAt;
}
