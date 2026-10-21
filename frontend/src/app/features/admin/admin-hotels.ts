import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { AdminApi } from '../../core/api/admin-api';
import { Notifier } from '../../core/errors';
import { Hotel, User } from '../../core/models/models';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';
import { StatusBadge } from '../../shared/status-badge';
import { AssignManagerDialog } from './assign-manager-dialog';
import { HotelCreateDialog } from './hotel-create-dialog';

@Component({
  selector: 'app-admin-hotels',
  imports: [MatTableModule, MatButtonModule, Loading, EmptyState, StatusBadge],
  template: `
    <div class="page-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1 class="title">All hotels</h1>
        @if (hotels(); as list) {
          <p class="sub">{{ list.length }} {{ list.length === 1 ? 'hotel' : 'hotels' }}</p>
        }
      </div>
      <button mat-flat-button (click)="create()" [disabled]="!hotels()">Create hotel</button>
    </div>
    @if (hotels(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="No hotels yet." />
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="list">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Hotel</th>
              <td mat-cell style="font-weight: 500" *matCellDef="let h">{{ h.name }}</td>
            </ng-container>
            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef>City</th>
              <td mat-cell *matCellDef="let h">{{ h.city }}</td>
            </ng-container>
            <ng-container matColumnDef="manager">
              <th mat-header-cell *matHeaderCellDef>Manager</th>
              <td mat-cell *matCellDef="let h">{{ managerName(h.managerId) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let h"><app-status [value]="h.status" /></td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell class="actions" *matCellDef="let h"><button mat-button (click)="assign(h)">Change manager</button></td>
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
export class AdminHotels {
  private readonly api = inject(AdminApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);

  protected readonly columns = ['name', 'city', 'manager', 'status', 'actions'];
  protected readonly hotels = signal<Hotel[] | null>(null);
  private readonly users = signal<User[]>([]);
  private readonly managers = computed(() => this.users().filter((u) => u.role === 'MANAGER'));

  constructor() {
    this.load();
  }

  protected managerName(id: number): string {
    return this.users().find((u) => u.id === id)?.fullName ?? `#${id}`;
  }

  protected create(): void {
    this.dialog
      .open(HotelCreateDialog, { data: this.managers() })
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  protected assign(hotel: Hotel): void {
    this.dialog
      .open(AssignManagerDialog, { data: { hotel, managers: this.managers() } })
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  private load(): void {
    forkJoin({ hotels: this.api.hotels(), users: this.api.users() }).subscribe({
      next: ({ hotels, users }) => {
        this.users.set(users);
        this.hotels.set(hotels);
      },
      error: (e) => {
        this.notify.error(e);
        this.hotels.set([]);
      },
    });
  }
}
