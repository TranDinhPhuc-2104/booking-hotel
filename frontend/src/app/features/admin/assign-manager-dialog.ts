import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AdminApi } from '../../core/api/admin-api';
import { Notifier } from '../../core/errors';
import { Hotel, User } from '../../core/models/models';

export interface AssignManagerData {
  hotel: Hotel;
  managers: User[];
}

@Component({
  selector: 'app-assign-manager-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Change manager of {{ data.hotel.name }}</h2>
    <mat-dialog-content class="dlg">
      <mat-form-field>
        <mat-label>Manager</mat-label>
        <mat-select [formControl]="manager">
          @for (m of data.managers; track m.id) {
            <mat-option [value]="m.id">{{ m.fullName }} ({{ m.email }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button (click)="save()" [disabled]="saving() || manager.value === data.hotel.managerId">Save</button>
    </mat-dialog-actions>
  `,
})
export class AssignManagerDialog {
  protected readonly data = inject<AssignManagerData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AssignManagerDialog, boolean>);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(Notifier);

  protected readonly saving = signal(false);
  protected readonly manager = new FormControl<number>(this.data.hotel.managerId, {
    nonNullable: true,
    validators: Validators.required,
  });

  protected save(): void {
    this.saving.set(true);
    this.api.assignManager(this.data.hotel.id, this.manager.value).subscribe({
      next: () => this.ref.close(true),
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e);
      },
    });
  }
}
