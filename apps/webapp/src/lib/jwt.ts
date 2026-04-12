import type { UserRole } from '../types';

interface TokenClaims {
  user_id: number;
  role: UserRole;
  exp: number;
}

/** Decodes the payload of a JWT without verifying the signature. */
export function decodeTokenClaims(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) return null;
  return decodeTokenClaims(token)?.role ?? null;
}
