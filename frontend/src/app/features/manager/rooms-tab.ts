import { Component, OnInit, inject, input, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier } from '../../core/errors';
import { Room, RoomType } from '../../core/models/models';
import { confirm } from '../../shared/confirm-dialog';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';
import { StatusBadge } from '../../shared/status-badge';
import { RoomDialog } from './room-dialog';

@Component({
  selector: 'app-rooms-tab',
  imports: [MatTableModule, MatButtonModule, Loading, EmptyState, StatusBadge],
  template: `
    <div class="tab-bar">
      <span class="muted small">{{ (rooms()?.length ?? 0) }} room{{ (rooms()?.length ?? 0) === 1 ? '' : 's' }}</span>
      <button mat-flat-button (click)="edit()" [disabled]="types().length === 0">Add room</button>
    </div>
    @if (rooms(); as list) {
      @if (types().length === 0) {
        <app-empty-state message="Create a room type first, then add rooms of that type." />
      } @else if (list.length === 0) {
        <app-empty-state message="No rooms yet." />
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="list">
            <ng-container matColumnDef="number">
              <th mat-header-cell *matHeaderCellDef>Room</th>
              <td mat-cell *matCellDef="let r">{{ r.roomNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">{{ r.roomTypeName }}</td>
            </ng-container>
            <ng-container matColumnDef="floor">
              <th mat-header-cell *matHeaderCellDef>Floor</th>
              <td mat-cell *matCellDef="let r">{{ r.floor ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r"><app-status [value]="r.status" /></td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell class="actions" *matCellDef="let r">
                <button mat-button (click)="edit(r)">Edit</button>
                <button mat-button (click)="remove(r)">Delete</button>
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
export class RoomsTab implements OnInit {
  readonly hotelId = input.required<number>();

  private readonly api = inject(ManagerApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);

  protected readonly columns = ['number', 'type', 'floor', 'status', 'actions'];
  protected readonly rooms = signal<Room[] | null>(null);
  protected readonly types = signal<RoomType[]>([]);

  ngOnInit(): void {
    this.load();
  }

  protected edit(item?: Room): void {
    this.dialog
      .open(RoomDialog, { data: { hotelId: this.hotelId(), roomTypes: this.types(), item } })
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  protected remove(r: Room): void {
    confirm(this.dialog, { title: 'Delete room?', message: `Delete room ${r.roomNumber}?`, confirmText: 'Delete' }).subscribe((ok) => {
      if (!ok) return;
      this.api.deleteRoom(this.hotelId(), r.id).subscribe({
        next: () => this.rooms.update((l) => l?.filter((x) => x.id !== r.id) ?? null),
        error: (e) => this.notify.error(e), // 409 when the room has bookings
      });
    });
  }

  private load(): void {
    forkJoin({ rooms: this.api.rooms(this.hotelId()), types: this.api.roomTypes(this.hotelId()) }).subscribe({
      next: ({ rooms, types }) => {
        this.types.set(types);
        this.rooms.set(rooms);
      },
      error: (e) => {
        this.notify.error(e);
        this.rooms.set([]);
      },
    });
  }
}
