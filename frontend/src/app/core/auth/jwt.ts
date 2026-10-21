import { Role } from '../models/models';

export interface JwtClaims {
  sub: string;
  role: Role;
  exp: number; // seconds since epoch
}

/** Reads the claims of a JWT without verifying it (the backend verifies). Returns null if malformed. */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json);
    if (typeof claims.exp !== 'number' || typeof claims.role !== 'string') return null;
    return claims as JwtClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: JwtClaims, nowMs = Date.now()): boolean {
  return claims.exp * 1000 <= nowMs;
}
