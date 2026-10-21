import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier, fieldError } from '../../core/errors';

@Component({
  selector: 'app-login',
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
      <h1 class="title">Welcome back</h1>
      <p class="sub">Log in to see and manage your bookings.</p>
      <form class="form-stack" [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <mat-error>{{ fieldError(form.controls.email) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>{{ fieldError(form.controls.password) }}</mat-error>
          }
        </mat-form-field>
        <button mat-flat-button class="btn-lg full" type="submit" [disabled]="loading()">Log in</button>
      </form>
      <p class="muted small foot">New here? <a routerLink="/register">Create an account</a></p>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly loading = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
      },
      error: (e) => {
        this.loading.set(false);
        this.notify.error(e, this.form);
      },
    });
  }
}
