import { Component, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminApi } from '../../core/api/admin-api';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/errors';
import { Role, User } from '../../core/models/models';
import { EmptyState } from '../../shared/empty-state';
import { Loading } from '../../shared/loading';

@Component({
  selector: 'app-admin-users',
  imports: [MatTableModule, MatSelectModule, Loading, EmptyState],
  template: `
    <div class="page-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1 class="title">Users</h1>
        <p class="sub">A role change applies the next time that user logs in.</p>
      </div>
    </div>
    @if (users(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="No users." />
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="list">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell style="font-weight: 500" *matCellDef="let u">{{ u.fullName }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell class="muted" *matCellDef="let u">{{ u.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell style="width: 180px" *matCellDef="let u">
                <mat-select
                  [value]="u.role"
                  [disabled]="u.id === me()?.id"
                  (selectionChange)="changeRole(u, $event.value)"
                  aria-label="Role"
                >
                  @for (r of roles; track r) {
                    <mat-option [value]="r">{{ r }}</mat-option>
                  }
                </mat-select>
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
export class AdminUsers {
  private readonly api = inject(AdminApi);
  private readonly notify = inject(Notifier);

  protected readonly me = inject(AuthService).user;
  protected readonly roles: Role[] = ['CUSTOMER', 'MANAGER', 'ADMIN'];
  protected readonly columns = ['name', 'email', 'role'];
  protected readonly users = signal<User[] | null>(null);

  constructor() {
    this.load();
  }

  protected changeRole(user: User, role: Role): void {
    this.api.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.users.update((l) => l?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
        this.notify.info(`${updated.fullName} is now ${updated.role}. They must log in again for it to apply.`);
      },
      error: (e) => {
        this.notify.error(e); // e.g. 409: still manages hotels
        this.load(); // put the dropdown back to the stored role
      },
    });
  }

  private load(): void {
    this.api.users().subscribe({
      next: (list) => this.users.set(list),
      error: (e) => {
        this.notify.error(e);
        this.users.set([]);
      },
    });
  }
}
