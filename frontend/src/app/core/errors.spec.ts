import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyFieldErrors, fieldError, toApiError } from './errors';

describe('errors', () => {
  it('reads the backend error body', () => {
    const e = new HttpErrorResponse({
      status: 400,
      error: { status: 400, message: 'Validation failed', fieldErrors: { email: 'must be a well-formed email address' } },
    });
    expect(toApiError(e)).toEqual({
      status: 400,
      message: 'Validation failed',
      fieldErrors: { email: 'must be a well-formed email address' },
    });
  });

  it('explains an unreachable backend', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toContain('Cannot reach the server');
  });

  it('puts field errors on matching controls and reports whether any matched', () => {
    const form = new FormGroup({ email: new FormControl(''), password: new FormControl('') });
    const matched = applyFieldErrors(form, { status: 400, message: 'x', fieldErrors: { password: 'too short', nope: 'ignored' } });
    expect(matched).toBe(true);
    expect(fieldError(form.controls.password)).toBe('too short');
    expect(applyFieldErrors(form, { status: 409, message: 'x', fieldErrors: {} })).toBe(false);
  });

  it('describes built-in validator errors', () => {
    const c = new FormControl('', Validators.required);
    expect(fieldError(c)).toBe('Required');
    expect(fieldError(new FormControl('abc', Validators.minLength(8)))).toBe('At least 8 characters');
  });
});
