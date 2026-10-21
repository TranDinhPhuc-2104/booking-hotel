import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier } from '../../core/errors';
import { Booking, BookingStatus } from '../../core/models/models';
import { confirm } from '../../shared/confirm-dialog';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';
import { MoneyPipe } from '../../shared/money.pipe';
import { StatusBadge } from '../../shared/status-badge';

interface Action {
  label: string;
  status: BookingStatus;
}

// Same transitions the backend allows a manager to make.
const ACTIONS: Partial<Record<BookingStatus, Action[]>> = {
  PENDING: [
    { label: 'Confirm', status: 'CONFIRMED' },
    { label: 'Cancel', status: 'CANCELLED' },
  ],
  CONFIRMED: [
    { label: 'Complete', status: 'COMPLETED' },
    { label: 'Cancel', status: 'CANCELLED' },
  ],
};

@Component({
  selector: 'app-bookings-tab',
  imports: [DatePipe, MatTableModule, MatButtonModule, Loading, EmptyState, StatusBadge, MoneyPipe],
  template: `
    <div class="tab-bar">
      <span class="muted small">{{ bookings()?.length ?? 0 }} booking{{ bookings()?.length === 1 ? '' : 's' }}</span>
    </div>
    @if (bookings(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="No bookings for this hotel yet." />
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="list">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell class="muted" *matCellDef="let b">{{ b.id }}</td>
            </ng-container>
            <ng-container matColumnDef="room">
              <th mat-header-cell *matHeaderCellDef>Room</th>
              <td mat-cell *matCellDef="let b">{{ b.roomNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Stay</th>
              <td mat-cell *matCellDef="let b">{{ b.checkIn | date: 'd MMM y' }} → {{ b.checkOut | date: 'd MMM y' }}</td>
            </ng-container>
            <ng-container matColumnDef="guests">
              <th mat-header-cell *matHeaderCellDef>Guests</th>
              <td mat-cell *matCellDef="let b">{{ b.guests }}</td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell class="price" *matCellDef="let b">{{ b.totalPrice | money }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let b"><app-status [value]="b.status" /></td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell class="actions" *matCellDef="let b">
                @for (a of actionsFor(b); track a.status) {
                  <button mat-button (click)="act(b, a)">{{ a.label }}</button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
      }
    } @else {
      <app-loading />
    }
  `,
})
export class BookingsTab implements OnInit {
  readonly hotelId = input.required<number>();

  private readonly api = inject(ManagerApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);

  protected readonly columns = ['id', 'room', 'dates', 'guests', 'total', 'status', 'actions'];
  protected readonly bookings = signal<Booking[] | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected actionsFor(b: Booking): Action[] {
    return ACTIONS[b.status] ?? [];
  }

  protected act(b: Booking, a: Action): void {
    if (a.status !== 'CANCELLED') return this.apply(b, a.status);
    confirm(this.dialog, {
      title: 'Cancel booking?',
      message: `Cancel booking #${b.id} (room ${b.roomNumber}, ${b.checkIn} → ${b.checkOut})?`,
      confirmText: 'Cancel booking',
    }).subscribe((ok) => ok && this.apply(b, a.status));
  }

  private apply(b: Booking, status: BookingStatus): void {
    this.api.setBookingStatus(b.id, status).subscribe({
      next: (updated) => this.bookings.update((l) => l?.map((x) => (x.id === updated.id ? updated : x)) ?? null),
      error: (e) => this.notify.error(e),
    });
  }

  private load(): void {
    this.api.bookings(this.hotelId()).subscribe({
      next: (list) => this.bookings.set(list),
      error: (e) => {
        this.notify.error(e);
        this.bookings.set([]);
      },
    });
  }
}
