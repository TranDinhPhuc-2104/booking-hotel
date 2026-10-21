import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AdminApi } from '../../core/api/admin-api';
import { Notifier, fieldError } from '../../core/errors';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-hotel-create-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Create hotel</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dlg">
        <mat-form-field>
          <mat-label>Manager</mat-label>
          <mat-select formControlName="managerId">
            @for (m of managers; track m.id) {
              <mat-option [value]="m.id">{{ m.fullName }} ({{ m.email }})</mat-option>
            }
          </mat-select>
          @if (managers.length === 0) {
            <mat-hint>No managers yet. Promote a user to MANAGER first.</mat-hint>
          }
          @if (form.controls.managerId.invalid && form.controls.managerId.touched) {
            <mat-error>{{ fieldError(form.controls.managerId) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>{{ fieldError(form.controls.name) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Address</mat-label>
          <input matInput formControlName="address" />
          @if (form.controls.address.invalid && form.controls.address.touched) {
            <mat-error>{{ fieldError(form.controls.address) }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>City</mat-label>
          <input matInput formControlName="city" />
          @if (form.controls.city.invalid && form.controls.city.touched) {
            <mat-error>{{ fieldError(form.controls.city) }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Create</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class HotelCreateDialog {
  protected readonly managers = inject<User[]>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<HotelCreateDialog, boolean>);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly saving = signal(false);
  protected readonly form = inject(FormBuilder).group({
    managerId: [null as number | null, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createHotel({ managerId: v.managerId ?? 0, name: v.name ?? '', address: v.address ?? '', city: v.city ?? '' })
      .subscribe({
        next: () => this.ref.close(true),
        error: (e) => {
          this.saving.set(false);
          this.notify.error(e, this.form);
        },
      });
  }
}
