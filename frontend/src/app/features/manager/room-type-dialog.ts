import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier, fieldError } from '../../core/errors';
import { RoomType } from '../../core/models/models';

export interface RoomTypeDialogData {
  hotelId: number;
  item?: RoomType;
}

@Component({
  selector: 'app-room-type-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Edit' : 'New' }} room type</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dlg">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Single, Double, Suite…" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>{{ fieldError(form.controls.name) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Price per night (VND)</mat-label>
          <input matInput type="number" min="0" formControlName="pricePerNight" />
          @if (form.controls.pricePerNight.invalid && form.controls.pricePerNight.touched) {
            <mat-error>{{ fieldError(form.controls.pricePerNight) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Capacity (guests)</mat-label>
          <input matInput type="number" min="1" formControlName="capacity" />
          @if (form.controls.capacity.invalid && form.controls.capacity.touched) {
            <mat-error>{{ fieldError(form.controls.capacity) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class RoomTypeDialog {
  protected readonly data = inject<RoomTypeDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<RoomTypeDialog, boolean>);
  private readonly api = inject(ManagerApi);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly saving = signal(false);
  protected readonly form = inject(FormBuilder).group({
    name: [this.data.item?.name ?? '', [Validators.required, Validators.maxLength(50)]],
    pricePerNight: [this.data.item?.pricePerNight ?? (null as number | null), [Validators.required, Validators.min(1)]],
    capacity: [this.data.item?.capacity ?? (null as number | null), [Validators.required, Validators.min(1)]],
    description: [this.data.item?.description ?? ''],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const req = {
      name: v.name ?? '',
      pricePerNight: v.pricePerNight ?? 0,
      capacity: v.capacity ?? 1,
      description: v.description || null,
    };
    const { hotelId, item } = this.data;
    this.saving.set(true);
    (item ? this.api.updateRoomType(hotelId, item.id, req) : this.api.createRoomType(hotelId, req)).subscribe({
      next: () => this.ref.close(true),
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e, this.form);
      },
    });
  }
}
