import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SESSION_KEY, fakeSession } from '../test-helpers';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

function setup(session?: ReturnType<typeof fakeSession>) {
  localStorage.clear();
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    ctrl: TestBed.inject(HttpTestingController),
    auth: TestBed.inject(AuthService),
    router: TestBed.inject(Router),
  };
}

describe('authInterceptor', () => {
  const url = `${environment.apiUrl}/bookings/me`;

  it('adds the Bearer header when logged in', () => {
    const session = fakeSession('CUSTOMER');
    const { http, ctrl } = setup(session);
    http.get(url).subscribe();
    const req = ctrl.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
    req.flush([]);
  });

  it('adds no header when logged out', () => {
    const { http, ctrl } = setup();
    http.get(url).subscribe();
    const req = ctrl.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('does not send the token to other hosts', () => {
    const { http, ctrl } = setup(fakeSession('CUSTOMER'));
    http.get('https://example.com/x').subscribe();
    const req = ctrl.expectOne('https://example.com/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('clears the session and redirects to /login on 401', () => {
    const { http, ctrl, auth, router } = setup(fakeSession('CUSTOMER'));
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get(url).subscribe({ error: () => undefined });
    ctrl.expectOne(url).flush({ status: 401, message: 'x' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.objectContaining({ queryParams: expect.anything() }));
  });

  it('lets a failed login (401 without a session) through without redirecting', () => {
    const { http, ctrl, router } = setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let status = 0;
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne(`${environment.apiUrl}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });
});
