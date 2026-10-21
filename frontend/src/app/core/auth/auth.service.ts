import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import { AuthResponse, LoginRequest, RegisterRequest, Role, User } from '../models/models';
import { decodeJwt, isExpired } from './jwt';

const STORAGE_KEY = 'booking.auth';

interface Session {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.load());

  readonly user = computed(() => this.session()?.user ?? null);
  /** The role inside the token: the one the backend enforces. */
  readonly role = computed<Role | null>(() => {
    const s = this.session();
    return s ? (decodeJwt(s.token)?.role ?? null) : null;
  });
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isManager = computed(() => this.role() === 'MANAGER' || this.role() === 'ADMIN');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  login(req: LoginRequest) {
    return this.api.login(req).pipe(tap((res) => this.start(res)));
  }

  register(req: RegisterRequest) {
    return this.api.register(req).pipe(tap((res) => this.start(res)));
  }

  /** The token if the session is still valid; an expired token ends the session. */
  validToken(): string | null {
    const s = this.session();
    if (!s) return null;
    const claims = decodeJwt(s.token);
    if (!claims || isExpired(claims)) {
      this.clear();
      return null;
    }
    return s.token;
  }

  logout(): void {
    this.clear();
    void this.router.navigate(['/']);
  }

  /** The backend rejected our token (401): drop the session and ask for a new login. */
  expireSession(): void {
    this.clear();
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private start(res: AuthResponse): void {
    const session = { token: res.token, user: res.user };
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage blocked: the session just won't survive a reload
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private load(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      const claims = decodeJwt(session.token);
      return claims && !isExpired(claims) ? session : null;
    } catch {
      return null;
    }
  }
}
