import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier, fieldError } from '../../core/errors';
import { Room, RoomStatus, RoomType } from '../../core/models/models';

export interface RoomDialogData {
  hotelId: number;
  roomTypes: RoomType[];
  item?: Room;
}

@Component({
  selector: 'app-room-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Edit' : 'New' }} room</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dlg">
        <mat-form-field>
          <mat-label>Room number</mat-label>
          <input matInput formControlName="roomNumber" />
          @if (form.controls.roomNumber.invalid && form.controls.roomNumber.touched) {
            <mat-error>{{ fieldError(form.controls.roomNumber) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Room type</mat-label>
          <mat-select formControlName="roomTypeId">
            @for (t of data.roomTypes; track t.id) {
              <mat-option [value]="t.id">{{ t.name }} ({{ t.capacity }} guests)</mat-option>
            }
          </mat-select>
          @if (form.controls.roomTypeId.invalid && form.controls.roomTypeId.touched) {
            <mat-error>{{ fieldError(form.controls.roomTypeId) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Floor</mat-label>
          <input matInput type="number" formControlName="floor" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="AVAILABLE">AVAILABLE</mat-option>
            <mat-option value="MAINTENANCE">MAINTENANCE (cannot be booked)</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class RoomDialog {
  protected readonly data = inject<RoomDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<RoomDialog, boolean>);
  private readonly api = inject(ManagerApi);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly saving = signal(false);
  protected readonly form = inject(FormBuilder).group({
    roomNumber: [this.data.item?.roomNumber ?? '', [Validators.required, Validators.maxLength(10)]],
    roomTypeId: [this.data.item?.roomTypeId ?? (null as number | null), Validators.required],
    floor: [this.data.item?.floor ?? (null as number | null)],
    status: [this.data.item?.status ?? ('AVAILABLE' as RoomStatus)],
    imageUrl: [this.data.item?.imageUrl ?? '', Validators.maxLength(255)],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const req = {
      roomNumber: v.roomNumber ?? '',
      roomTypeId: v.roomTypeId ?? 0,
      floor: v.floor,
      status: v.status,
      imageUrl: v.imageUrl || null,
    };
    const { hotelId, item } = this.data;
    this.saving.set(true);
    (item ? this.api.updateRoom(hotelId, item.id, req) : this.api.createRoom(hotelId, req)).subscribe({
      next: () => this.ref.close(true),
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e, this.form);
      },
    });
  }
}
