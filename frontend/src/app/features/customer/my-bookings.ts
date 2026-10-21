import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BookingApi } from '../../core/api/booking-api';
import { parseIsoDate, today } from '../../core/dates';
import { Notifier } from '../../core/errors';
import { Booking } from '../../core/models/models';
import { confirm } from '../../shared/confirm-dialog';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink, DatePipe, MatButtonModule, Loading, EmptyState, StatusBadge, MoneyPipe],
  styles: `
    .booking { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; padding: 20px; }
    .dates { margin-top: 10px; font-size: 14px; }
    .note { margin-top: 8px; font-size: 13px; color: var(--muted); font-style: italic; }
    .end { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .end .price { font-size: 16px; }
    .stack { display: flex; flex-direction: column; gap: 12px; }
    @media (max-width: 520px) { .booking { grid-template-columns: 1fr; } .end { align-items: flex-start; } }
  `,
  template: `
    <div class="page-head">
      <div>
        <h1 class="title">My bookings</h1>
        @if (bookings(); as list) {
          <p class="sub">{{ list.length }} {{ list.length === 1 ? 'booking' : 'bookings' }}</p>
        }
      </div>
      <a mat-stroked-button routerLink="/">Find a hotel</a>
    </div>
    @if (bookings(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="You have no bookings yet." />
      } @else {
        <div class="stack">
          @for (b of list; track b.id) {
            <div class="card booking">
              <div>
                <div class="row-title">{{ b.hotelName }}</div>
                <div class="muted small">Room {{ b.roomNumber }} · {{ b.guests }} guest{{ b.guests === 1 ? '' : 's' }}</div>
                <div class="dates">{{ b.checkIn | date: 'EEE, d MMM y' }} → {{ b.checkOut | date: 'EEE, d MMM y' }}</div>
                @if (b.note) {
                  <div class="note">“{{ b.note }}”</div>
                }
              </div>
              <div class="end">
                <app-status [value]="b.status" />
                <div class="price">{{ b.totalPrice | money }}</div>
                @if (canCancel(b)) {
                  <button mat-button (click)="cancel(b)">Cancel booking</button>
                }
              </div>
            </div>
          }
        </div>
      }
    } @else {
      <app-loading />
    }
  `,
})
export class MyBookings {
  private readonly api = inject(BookingApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);

  protected readonly bookings = signal<Booking[] | null>(null);

  constructor() {
    this.load();
  }

  /** Same rule as the backend: PENDING/CONFIRMED, and only before the check-in day. */
  protected canCancel(b: Booking): boolean {
    return (b.status === 'PENDING' || b.status === 'CONFIRMED') && parseIsoDate(b.checkIn) > today();
  }

  protected cancel(b: Booking): void {
    confirm(this.dialog, {
      title: 'Cancel booking?',
      message: `Cancel your stay at ${b.hotelName} (${b.checkIn} → ${b.checkOut})?`,
      confirmText: 'Cancel booking',
    }).subscribe((ok) => {
      if (!ok) return;
      this.api.cancel(b.id).subscribe({
        next: (updated) => {
          this.bookings.update((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
          this.notify.info('Booking cancelled.');
        },
        error: (e) => this.notify.error(e),
      });
    });
  }

  private load(): void {
    this.api.mine().subscribe({
      next: (list) => this.bookings.set(list),
      error: (e) => {
        this.notify.error(e);
        this.bookings.set([]);
      },
    });
  }
}
