import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BookingApi } from '../../core/api/booking-api';
import { HotelApi } from '../../core/api/hotel-api';
import { AuthService } from '../../core/auth/auth.service';
import { nightsBetween, parseIsoDate, toIsoDate, today } from '../../core/dates';
import { Notifier, fieldError, toApiError } from '../../core/errors';
import { HotelDetail, Room } from '../../core/models/models';
import { EmptyState } from '../../shared/empty-state';
import { HotelArt } from '../../shared/hotel-art';
import { Loading } from '../../shared/loading';
import { MoneyPipe } from '../../shared/money.pipe';
import { BookingDialog } from '../customer/booking-dialog';

interface Stay {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
}

@Component({
  selector: 'app-hotel-detail',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, Loading, EmptyState, MoneyPipe, HotelArt],
  styles: `
    .head { margin: 28px 0 8px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 48px; align-items: start; margin-top: 28px; }
    .side { position: sticky; top: 88px; }
    .side form { display: flex; flex-direction: column; gap: 12px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: minmax(0, 1fr); gap: 32px; }
      .side { position: static; order: -1; }
    }
    .main > .section:first-child { margin-top: 0; }
    .type-desc { margin-top: 2px; }
    .book-row .row-end { min-width: 0; }
    @media (max-width: 520px) {
      .list-row.with-action { grid-template-columns: minmax(0, 1fr) auto; }
      .list-row.with-action button { grid-column: 1 / -1; width: 100%; }
    }
  `,
  template: `
    @if (loading()) {
      <app-loading />
    } @else if (notFound()) {
      <p class="eyebrow">404</p>
      <h1 class="title">Hotel not found</h1>
      <p class="sub"><a class="back" routerLink="/">← Back to hotels</a></p>
    } @else if (detail(); as d) {
      <a class="back" routerLink="/">← All hotels</a>
      <app-hotel-art [hotel]="d.hotel" [banner]="true" />
      <div class="head">
        <h1 class="title">{{ d.hotel.name }}</h1>
        <p class="sub">{{ d.hotel.address }}, {{ d.hotel.city }}@if (d.hotel.phone) { · {{ d.hotel.phone }} }</p>
      </div>

      <div class="layout">
        <div class="main">
          @if (d.hotel.description) {
            <section class="section"><p class="lead">{{ d.hotel.description }}</p></section>
          }

          @if (searching()) {
            <section class="section"><app-loading /></section>
          } @else if (rooms(); as list) {
            @if (stay(); as s) {
              <section class="section">
                <div class="section-head">
                  <h2 class="section-title">Available rooms</h2>
                  <span class="muted small">
                    {{ s.nights }} night{{ s.nights === 1 ? '' : 's' }} · {{ s.guests }} guest{{ s.guests === 1 ? '' : 's' }}
                  </span>
                </div>
                @if (list.length === 0) {
                  <app-empty-state message="No rooms free for these dates." />
                } @else {
                  <div class="list">
                    @for (r of list; track r.id) {
                      <div class="list-row with-action book-row">
                        <div>
                          <div class="row-title">Room {{ r.roomNumber }}</div>
                          <div class="muted small">{{ r.roomTypeName }} · up to {{ r.capacity }} guests</div>
                        </div>
                        <div class="row-end">
                          <div class="price">{{ r.pricePerNight * s.nights | money }}</div>
                          <div class="muted small">{{ r.pricePerNight | money }} × {{ s.nights }}</div>
                        </div>
                        <button mat-stroked-button (click)="book(d, r, s)" [disabled]="booking()">Book</button>
                      </div>
                    }
                  </div>
                }
              </section>
            }
          }

          <section class="section">
            <div class="section-head"><h2 class="section-title">Room types</h2></div>
            @if (d.roomTypes.length === 0) {
              <app-empty-state message="This hotel has not listed any room types yet." />
            } @else {
              <div class="list">
                @for (t of d.roomTypes; track t.id) {
                  <div class="list-row">
                    <div>
                      <div class="row-title">{{ t.name }}</div>
                      <div class="muted small type-desc">{{ t.description || 'Up to ' + t.capacity + ' guests' }}</div>
                    </div>
                    <div class="row-end">
                      <div class="price">{{ t.pricePerNight | money }}</div>
                      <div class="muted small">per night · {{ t.capacity }} guests</div>
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        </div>

        <aside class="side panel">
          <h2 class="panel-title">Check availability</h2>
          <form [formGroup]="form" (ngSubmit)="search()">
            <mat-form-field>
              <mat-label>Dates</mat-label>
              <mat-date-range-input [formGroup]="form.controls.range" [rangePicker]="picker" [min]="minDate" (click)="picker.open()">
                <input matStartDate formControlName="start" placeholder="Check-in" />
                <input matEndDate formControlName="end" placeholder="Check-out" />
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker" />
              <mat-date-range-picker #picker />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Guests</mat-label>
              <input matInput type="number" min="1" formControlName="guests" />
              @if (form.controls.guests.invalid) {
                <mat-error>{{ fieldError(form.controls.guests) }}</mat-error>
              }
            </mat-form-field>
            @if (rangeError()) {
              <p class="error-text">{{ rangeError() }}</p>
            }
            <button mat-flat-button class="btn-lg full" type="submit" [disabled]="searching()">Search</button>
          </form>
        </aside>
      </div>
    }
  `,
})
export class HotelDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hotelApi = inject(HotelApi);
  private readonly bookingApi = inject(BookingApi);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notifier);
  private readonly title = inject(Title);

  protected readonly fieldError = fieldError;
  protected readonly minDate = today();
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly detail = signal<HotelDetail | null>(null);
  protected readonly rooms = signal<Room[] | null>(null);
  protected readonly stay = signal<Stay | null>(null);
  protected readonly searching = signal(false);
  protected readonly booking = signal(false);
  protected readonly rangeError = signal('');

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    range: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null],
    }),
    guests: [1, [Validators.required, Validators.min(1)]],
  });

  private hotelId = 0;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.hotelId = Number(params.get('id'));
      this.loadHotel();
    });
  }

  private loadHotel(): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.hotelApi.detail(this.hotelId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.title.setTitle(`${d.hotel.name} · Booking Rooms`);
        this.loading.set(false);
        this.restoreSearch();
      },
      error: (e) => {
        this.loading.set(false);
        if (toApiError(e).status === 404) {
          this.notFound.set(true);
        } else {
          this.notify.error(e);
        }
      },
    });
  }

  /** The search lives in the URL, so a login redirect or a reload brings it back. */
  private restoreSearch(): void {
    const q = this.route.snapshot.queryParamMap;
    const checkIn = q.get('checkIn');
    const checkOut = q.get('checkOut');
    const guests = Number(q.get('guests') ?? 1);
    const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!isDate(checkIn) || !isDate(checkOut) || !(guests >= 1)) return;
    this.form.patchValue({ range: { start: parseIsoDate(checkIn), end: parseIsoDate(checkOut) }, guests });
    this.search(false);
  }

  protected search(updateUrl = true): void {
    const { range, guests } = this.form.getRawValue();
    this.rangeError.set('');
    if (!range.start || !range.end) {
      this.rangeError.set('Pick check-in and check-out dates.');
      return;
    }
    const nights = nightsBetween(range.start, range.end);
    if (nights < 1) {
      this.rangeError.set('Check-out must be after check-in.');
      return;
    }
    if (this.form.controls.guests.invalid || !guests) {
      this.form.controls.guests.markAsTouched();
      return;
    }
    const stay: Stay = { checkIn: toIsoDate(range.start), checkOut: toIsoDate(range.end), nights, guests };
    if (updateUrl) {
      void this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParams: { checkIn: stay.checkIn, checkOut: stay.checkOut, guests },
      });
    }
    this.runSearch(stay);
  }

  private runSearch(stay: Stay): void {
    this.searching.set(true);
    this.rooms.set(null);
    this.stay.set(stay);
    this.hotelApi.available(this.hotelId, stay.checkIn, stay.checkOut, stay.guests).subscribe({
      next: (list) => {
        this.rooms.set(list);
        this.searching.set(false);
      },
      error: (e) => {
        this.searching.set(false);
        this.rooms.set([]);
        this.notify.error(e);
      },
    });
  }

  protected book(d: HotelDetail, room: Room, stay: Stay): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.dialog
      .open(BookingDialog, {
        data: {
          hotelName: d.hotel.name,
          roomNumber: room.roomNumber,
          roomTypeName: room.roomTypeName,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          nights: stay.nights,
          guests: stay.guests,
          pricePerNight: room.pricePerNight,
          total: room.pricePerNight * stay.nights,
        },
      })
      .afterClosed()
      .subscribe((result: { note: string } | null | undefined) => {
        if (!result) return;
        this.booking.set(true);
        this.bookingApi
          .create({
            roomId: room.id,
            checkIn: stay.checkIn,
            checkOut: stay.checkOut,
            guests: stay.guests,
            note: result.note.trim() || null,
          })
          .subscribe({
            next: () => {
              this.notify.info('Booking created. It is pending confirmation.');
              void this.router.navigateByUrl('/bookings');
            },
            error: (e) => {
              this.booking.set(false);
              const err = this.notify.error(e);
              if (err.status === 409) this.runSearch(stay); // someone else got it: refresh what is free
            },
          });
      });
  }
}
