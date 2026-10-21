import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/models';
import { AuthService } from './auth.service';

// Guards only hide pages; the backend still enforces every permission.

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.validToken()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard =
  (roles: Role[]): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.validToken()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    const role = auth.role();
    return role && roles.includes(role) ? true : router.createUrlTree(['/']);
  };

/** Login/register pages: a logged-in user is sent home. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.validToken() ? inject(Router).createUrlTree(['/']) : true;
};
