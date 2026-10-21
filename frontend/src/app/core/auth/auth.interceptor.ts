import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = req.url.startsWith(environment.apiUrl) ? auth.validToken() : null;
  const authorised = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorised).pipe(
    catchError((err) => {
      // 401 with a token attached = the session is no longer good. A failed login has no token, so it passes through.
      if (token && err instanceof HttpErrorResponse && err.status === 401) {
        auth.expireSession();
      }
      return throwError(() => err);
    }),
  );
};
