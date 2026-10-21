import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-toolbar',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatIconModule],
  styles: `
    :host { position: sticky; top: 0; z-index: 10; display: block; background: rgba(250, 250, 249, 0.85);
      backdrop-filter: saturate(180%) blur(12px); border-bottom: 1px solid var(--line); }
    .bar { max-width: 1120px; margin: 0 auto; height: 64px; padding: 0 16px; display: flex; align-items: center; gap: 4px; }
    @media (min-width: 768px) { .bar { padding: 0 24px; } }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.02em; font-size: 16px;
      text-decoration: none; margin-right: 20px; white-space: nowrap; }
    .mark { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--ink);
      background: linear-gradient(90deg, var(--ink) 50%, transparent 50%); }
    .nav { display: flex; gap: 2px; }
    .link { padding: 8px 12px; border-radius: 8px; font-size: 14px; color: var(--muted); text-decoration: none; white-space: nowrap; }
    .link:hover { color: var(--ink); background: var(--soft); }
    .link.on { color: var(--ink); font-weight: 500; }
    .spacer { flex: 1; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface);
      font: 600 13px var(--font); color: var(--ink); cursor: pointer; }
    .avatar:hover { border-color: var(--line-strong); }
    .menu-btn { display: none; }
    @media (max-width: 720px) {
      .nav { display: none; }
      .menu-btn { display: inline-flex; }
      .guest-only { display: none; }
    }
  `,
  template: `
    <header class="bar">
      <a class="brand" routerLink="/"><span class="mark"></span>Booking Rooms</a>
      <nav class="nav">
        <a class="link" routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Hotels</a>
        @if (auth.isLoggedIn()) {
          <a class="link" routerLink="/bookings" routerLinkActive="on">My bookings</a>
        }
        @if (auth.isManager()) {
          <a class="link" routerLink="/manager" routerLinkActive="on">Manager</a>
        }
        @if (auth.isAdmin()) {
          <a class="link" routerLink="/admin/users" routerLinkActive="on">Users</a>
          <a class="link" routerLink="/admin/hotels" routerLinkActive="on">All hotels</a>
        }
      </nav>
      <span class="spacer"></span>

      @if (auth.user(); as user) {
        <button class="avatar" [matMenuTriggerFor]="account" aria-label="Account menu">{{ initials() }}</button>
        <mat-menu #account="matMenu" xPosition="before">
          <div class="account-head" style="padding: 10px 16px 12px; min-width: 220px">
            <div style="font-weight: 600">{{ user.fullName }}</div>
            <div class="muted small">{{ user.email }}</div>
            <div class="status" style="margin-top: 8px">{{ auth.role() }}</div>
          </div>
          <a mat-menu-item routerLink="/bookings">My bookings</a>
          <button mat-menu-item (click)="auth.logout()">Log out</button>
        </mat-menu>
      } @else {
        <a class="link" routerLink="/login">Log in</a>
        <a mat-flat-button routerLink="/register" class="guest-only">Sign up</a>
      }

      <button mat-icon-button class="menu-btn" [matMenuTriggerFor]="mobile" aria-label="Menu">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-menu #mobile="matMenu" xPosition="before">
        <a mat-menu-item routerLink="/">Hotels</a>
        @if (auth.isLoggedIn()) {
          <a mat-menu-item routerLink="/bookings">My bookings</a>
        } @else {
          <a mat-menu-item routerLink="/register">Sign up</a>
        }
        @if (auth.isManager()) {
          <a mat-menu-item routerLink="/manager">Manager</a>
        }
        @if (auth.isAdmin()) {
          <a mat-menu-item routerLink="/admin/users">Users</a>
          <a mat-menu-item routerLink="/admin/hotels">All hotels</a>
        }
      </mat-menu>
    </header>
  `,
})
export class Toolbar {
  protected readonly auth = inject(AuthService);
  protected readonly initials = computed(() => {
    const name = this.auth.user()?.fullName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
  });
}
