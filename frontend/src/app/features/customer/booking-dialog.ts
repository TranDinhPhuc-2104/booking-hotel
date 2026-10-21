import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MoneyPipe } from '../../shared/money.pipe';

export interface BookingDialogData {
  hotelName: string;
  roomNumber: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  total: number;
}

@Component({
  selector: 'app-booking-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MoneyPipe,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Confirm your stay</h2>
    <mat-dialog-content class="dlg">
      <p class="row-title">{{ data.hotelName }}</p>
      <p class="muted small" style="margin-bottom: 16px">Room {{ data.roomNumber }} · {{ data.roomTypeName }}</p>
      <dl class="summary">
        <dt>Check-in</dt><dd>{{ data.checkIn }}</dd>
        <dt>Check-out</dt><dd>{{ data.checkOut }}</dd>
        <dt>Guests</dt><dd>{{ data.guests }}</dd>
        <dt>{{ data.pricePerNight | money }} × {{ data.nights }} night{{ data.nights === 1 ? '' : 's' }}</dt>
        <dd>{{ data.total | money }}</dd>
        <dt class="total">Total</dt><dd class="total price">{{ data.total | money }}</dd>
      </dl>
      <mat-form-field>
        <mat-label>Note for the hotel (optional)</mat-label>
        <textarea matInput rows="2" [formControl]="note"></textarea>
        <mat-hint align="end">{{ note.value.length }}/500</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button [mat-dialog-close]="{ note: note.value }" [disabled]="note.invalid">Book now</button>
    </mat-dialog-actions>
  `,
})
export class BookingDialog {
  protected readonly data = inject<BookingDialogData>(MAT_DIALOG_DATA);
  protected readonly note = new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) });
}
