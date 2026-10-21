import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SESSION_KEY, fakeSession } from '../test-helpers';
import { authGuard, roleGuard } from './guards';
import { Role } from '../models/models';

function run(guard: CanActivateFn, session?: ReturnType<typeof fakeSession>, url = '/x') {
  localStorage.clear();
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  const router = TestBed.inject(Router);
  const result = TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
  return { result, router };
}

const asPath = (r: unknown, router: Router) => router.serializeUrl(r as UrlTree);

describe('guards', () => {
  it('authGuard sends logged-out users to /login with returnUrl', () => {
    const { result, router } = run(authGuard, undefined, '/bookings');
    expect(asPath(result, router)).toBe('/login?returnUrl=%2Fbookings');
  });

  it('authGuard lets a valid session through', () => {
    expect(run(authGuard, fakeSession('CUSTOMER')).result).toBe(true);
  });

  it('an expired token counts as logged out', () => {
    const { result, router } = run(authGuard, fakeSession('CUSTOMER', -10));
    expect(asPath(result, router)).toContain('/login');
  });

  it.each<[Role, boolean]>([
    ['ADMIN', true],
    ['MANAGER', false],
    ['CUSTOMER', false],
  ])('roleGuard([ADMIN]) for %s -> allowed=%s', (role, allowed) => {
    const { result, router } = run(roleGuard(['ADMIN']), fakeSession(role));
    if (allowed) expect(result).toBe(true);
    else expect(asPath(result, router)).toBe('/');
  });

  it('roleGuard([MANAGER, ADMIN]) allows a manager', () => {
    expect(run(roleGuard(['MANAGER', 'ADMIN']), fakeSession('MANAGER')).result).toBe(true);
  });

  it('roleGuard([MANAGER, ADMIN]) redirects a customer to /', () => {
    const { result, router } = run(roleGuard(['MANAGER', 'ADMIN']), fakeSession('CUSTOMER'));
    expect(asPath(result, router)).toBe('/');
  });

  it('roleGuard sends logged-out users to /login', () => {
    const { result, router } = run(roleGuard(['ADMIN']));
    expect(asPath(result, router)).toContain('/login');
  });
});
