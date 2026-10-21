import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier, fieldError } from '../../core/errors';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  styles: `
    .auth { max-width: 380px; margin: 24px auto 0; }
    @media (min-width: 768px) { .auth { margin-top: 48px; } }
    .sub { margin-bottom: 28px; }
    .form-stack { gap: 14px; }
    .foot { margin-top: 20px; text-align: center; }
    .foot a { color: var(--ink); font-weight: 500; }
  `,
  template: `
    <div class="auth">
      <h1 class="title">Create your account</h1>
      <p class="sub">Book rooms and keep track of your stays.</p>
      <form class="form-stack" [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field>
          <mat-label>Full name</mat-label>
          <input matInput formControlName="fullName" autocomplete="name" />
          @if (form.controls.fullName.invalid && form.controls.fullName.touched) {
            <mat-error>{{ fieldError(form.controls.fullName) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <mat-error>{{ fieldError(form.controls.email) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint>At least 8 characters</mat-hint>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <mat-error>{{ fieldError(form.controls.password) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Phone (optional)</mat-label>
          <input matInput formControlName="phone" autocomplete="tel" />
          @if (form.controls.phone.invalid && form.controls.phone.touched) {
            <mat-error>{{ fieldError(form.controls.phone) }}</mat-error>
          }
        </mat-form-field>
        <button mat-flat-button class="btn-lg full" type="submit" [disabled]="loading()">Create account</button>
      </form>
      <p class="muted small foot">Already have an account? <a routerLink="/login">Log in</a></p>
    </div>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly loading = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    phone: ['', Validators.maxLength(20)],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { phone, ...rest } = this.form.getRawValue();
    this.auth.register({ ...rest, phone: phone || null }).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (e) => {
        this.loading.set(false);
        this.notify.error(e, this.form);
      },
    });
  }
}
