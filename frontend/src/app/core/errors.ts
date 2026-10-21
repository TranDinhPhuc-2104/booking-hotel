import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from './models/models';

/** Normalises anything thrown by HttpClient into the backend's { status, message, fieldErrors } shape. */
export function toApiError(e: unknown): ApiError {
  if (e instanceof HttpErrorResponse) {
    const body = e.error;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return { status: e.status, message: body.message, fieldErrors: body.fieldErrors ?? {} };
    }
    if (e.status === 0) {
      return { status: 0, message: 'Cannot reach the server. Is the backend running?', fieldErrors: {} };
    }
    if (e.status === 403) {
      return { status: 403, message: 'You do not have permission to do that', fieldErrors: {} };
    }
    return { status: e.status, message: 'Something went wrong', fieldErrors: {} };
  }
  return { status: 0, message: 'Something went wrong', fieldErrors: {} };
}

/** Puts each backend field error on the matching form control. Returns true if any control matched. */
export function applyFieldErrors(form: FormGroup, err: ApiError): boolean {
  let applied = false;
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: message });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}

/** Text for a <mat-error> under a form control. */
export function fieldError(control: AbstractControl | null): string {
  const errors = control?.errors;
  if (!errors) return '';
  if (errors['server']) return errors['server'];
  if (errors['required']) return 'Required';
  if (errors['email']) return 'Enter a valid email';
  if (errors['minlength']) return `At least ${errors['minlength'].requiredLength} characters`;
  if (errors['maxlength']) return `At most ${errors['maxlength'].requiredLength} characters`;
  if (errors['min']) return `Must be at least ${errors['min'].min}`;
  return 'Invalid value';
}

@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snack = inject(MatSnackBar);

  info(message: string): void {
    this.snack.open(message, 'OK', { duration: 4000 });
  }

  /** Shows the error in a snackbar, unless it was all field errors that landed on `form`. */
  error(e: unknown, form?: FormGroup): ApiError {
    const err = toApiError(e);
    if (!(form && applyFieldErrors(form, err))) {
      this.snack.open(err.message, 'Close', { duration: 6000 });
    }
    return err;
  }
}
