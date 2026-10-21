import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier, fieldError } from '../../core/errors';
import { Hotel, HotelStatus } from '../../core/models/models';

@Component({
  selector: 'app-hotel-details-tab',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <form class="form-stack form-narrow" style="gap: 12px; margin-top: 28px" [formGroup]="form" (ngSubmit)="save()">
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
      <mat-form-field>
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phone" />
        @if (form.controls.phone.invalid) {
          <mat-error>{{ fieldError(form.controls.phone) }}</mat-error>
        }
      </mat-form-field>
      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput rows="3" formControlName="description"></textarea>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Image URL</mat-label>
        <input matInput formControlName="imageUrl" />
        @if (form.controls.imageUrl.invalid) {
          <mat-error>{{ fieldError(form.controls.imageUrl) }}</mat-error>
        }
        <mat-hint>Paste a link, or upload a photo below.</mat-hint>
      </mat-form-field>
      <div>
        <input #photo type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="upload(photo)" />
        <button mat-stroked-button type="button" [disabled]="uploading()" (click)="photo.click()">
          {{ uploading() ? 'Uploading…' : 'Upload photo' }}
        </button>
      </div>
      <mat-form-field>
        <mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option value="ACTIVE">ACTIVE (visible to customers)</mat-option>
          <mat-option value="INACTIVE">INACTIVE (hidden, cannot be booked)</mat-option>
        </mat-select>
      </mat-form-field>
      <div><button mat-flat-button type="submit" [disabled]="saving()">Save changes</button></div>
    </form>
  `,
})
export class HotelDetailsTab implements OnInit {
  readonly hotel = input.required<Hotel>();
  readonly saved = output<Hotel>();

  private readonly api = inject(ManagerApi);
  private readonly notify = inject(Notifier);

  protected readonly fieldError = fieldError;
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', Validators.maxLength(20)],
    description: [''],
    imageUrl: ['', Validators.maxLength(255)],
    status: ['ACTIVE' as HotelStatus],
  });

  ngOnInit(): void {
    const h = this.hotel();
    this.form.patchValue({ ...h, phone: h.phone ?? '', description: h.description ?? '', imageUrl: h.imageUrl ?? '' });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateHotel(this.hotel().id, { ...v, phone: v.phone || null, description: v.description || null, imageUrl: v.imageUrl || null })
      .subscribe({
        next: (h) => {
          this.saving.set(false);
          this.saved.emit(h);
          this.notify.info('Hotel saved.');
        },
        error: (e) => {
          this.saving.set(false);
          this.notify.error(e, this.form);
        },
      });
  }

  /** Uploads straight away (max 5 MB); the server sets imageUrl, so the form just mirrors it. */
  protected upload(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.api.uploadHotelImage(this.hotel().id, file).subscribe({
      next: (h) => {
        this.uploading.set(false);
        this.form.controls.imageUrl.setValue(h.imageUrl ?? '');
        this.saved.emit(h);
        this.notify.info('Photo uploaded.');
      },
      error: (e) => {
        this.uploading.set(false);
        this.notify.error(e);
      },
    });
  }
}
