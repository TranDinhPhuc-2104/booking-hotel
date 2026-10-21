import { Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier } from '../../core/errors';
import { RoomType } from '../../core/models/models';
import { confirm } from '../../shared/confirm-dialog';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';
import { MoneyPipe } from '../../shared/money.pipe';
import { RoomTypeDialog } from './room-type-dialog';

@Component({
  selector: 'app-room-types-tab',
  imports: [MatTableModule, MatButtonModule, Loading, EmptyState, MoneyPipe],
  template: `
    <div class="tab-bar">
      <span class="muted small">{{ (types()?.length ?? 0) }} room type{{ (types()?.length ?? 0) === 1 ? '' : 's' }}</span>
      <button mat-flat-button (click)="edit()">Add room type</button>
    </div>
    @if (types(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="No room types yet. Add one (e.g. Single, Double) before adding rooms." />
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="list">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let t">{{ t.name }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price / night</th>
              <td mat-cell *matCellDef="let t">{{ t.pricePerNight | money }}</td>
            </ng-container>
            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let t">{{ t.capacity }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell class="actions" *matCellDef="let t">
                <button mat-button (click)="edit(t)">Edit</button>
                <button mat-button (click)="remove(t)">Delete</button>
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
export class RoomTypesTab implements OnInit {
  readonly hotelId = input.required<number>();

  private readonly api = inject(ManagerApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);

  protected readonly columns = ['name', 'price', 'capacity', 'actions'];
  protected readonly types = signal<RoomType[] | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected edit(item?: RoomType): void {
    this.dialog
      .open(RoomTypeDialog, { data: { hotelId: this.hotelId(), item } })
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  protected remove(t: RoomType): void {
    confirm(this.dialog, { title: 'Delete room type?', message: `Delete "${t.name}"?`, confirmText: 'Delete' }).subscribe((ok) => {
      if (!ok) return;
      this.api.deleteRoomType(this.hotelId(), t.id).subscribe({
        next: () => this.types.update((l) => l?.filter((x) => x.id !== t.id) ?? null),
        error: (e) => this.notify.error(e), // 409 when rooms still use it
      });
    });
  }

  private load(): void {
    this.api.roomTypes(this.hotelId()).subscribe({
      next: (list) => this.types.set(list),
      error: (e) => {
        this.notify.error(e);
        this.types.set([]);
      },
    });
  }
}
