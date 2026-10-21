import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('shows the toolbar with Log in and Sign up when logged out', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Booking Rooms');
    expect(text).toContain('Log in');
    expect(text).toContain('Sign up');
    expect(text).not.toContain('My bookings');
  });
});
