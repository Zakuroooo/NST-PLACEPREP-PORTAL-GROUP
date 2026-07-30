/**
 * backend/src/utils/jwt.ts
 * JWT sign and verify utilities.
 */

import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/shared.types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('[PlacePrep Auth] JWT_SECRET is not defined. Set it in .env.local');
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    `[PlacePrep Auth] JWT_SECRET is too short (${JWT_SECRET.length} chars). ` +
    'Minimum 32 characters required to prevent token forgery. ' +
    'Generate one with: openssl rand -hex 32'
  );
}

/**
 * Sign a JWT for a given user.
 */
export function signToken(payload: { userId: string; role: string; email: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify a JWT and return the decoded payload.
 * Returns null if invalid/expired (never throws).
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT without verifying (use only for non-sensitive reads).
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
