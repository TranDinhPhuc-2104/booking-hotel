import { Role } from './models/models';

/** An unsigned JWT-shaped string; the frontend only reads its claims. */
export function fakeToken(role: Role, expiresInSeconds = 3600): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${b64({ alg: 'HS256' })}.${b64({ sub: '1', role, exp })}.sig`;
}

export function fakeSession(role: Role, expiresInSeconds = 3600) {
  return {
    token: fakeToken(role, expiresInSeconds),
    user: { id: 1, fullName: 'Test', email: 't@t.com', phone: null, role },
  };
}

export const SESSION_KEY = 'booking.auth';
