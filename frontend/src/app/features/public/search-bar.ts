import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { nightsBetween, parseIsoDate, toIsoDate, today } from '../../core/dates';
import { Destination, Hotel } from '../../core/models/models';

/** What the search bar submits; also what the home page keeps in its URL. */
export interface SearchQuery {
  q: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  children: number;
}

const MAX_SUGGESTIONS = 5;

@Component({
  selector: 'app-search-bar',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatDatepickerModule,
    MatMenuModule, MatButtonModule, MatIconModule],
  styles: `
    .who-panel { padding: 8px 16px 12px; min-width: 260px; }
    .who-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 0; }
    .who-row + .who-row { border-top: 1px solid var(--line); }
    .who-row small { display: block; color: var(--muted); }
    .stepper { display: flex; align-items: center; gap: 10px; }
    .stepper span { min-width: 18px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 500; }
    .stepper button.mat-mdc-button-base { min-width: 34px; width: 34px; height: 34px; padding: 0; border-radius: 50%; font-size: 16px; }
    .done { margin-top: 8px; width: 100%; }
    .opt-meta { color: var(--muted); font-size: 13px; margin-left: 6px; }
  `,
  template: `
    <form class="searchbox" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field class="seg" appearance="fill">
        <mat-icon matPrefix>location_on</mat-icon>
        <mat-label>Destination</mat-label>
        <input matInput formControlName="q" [matAutocomplete]="auto" placeholder="Destination, property name or address" />
        <mat-autocomplete #auto="matAutocomplete">
          @if (cityOptions().length) {
            <mat-optgroup label="Destinations">
              @for (d of cityOptions(); track d.city) {
                <mat-option [value]="d.city">{{ d.city }}<span class="opt-meta">{{ d.hotels }} {{ d.hotels === 1 ? 'hotel' : 'hotels' }}</span></mat-option>
              }
            </mat-optgroup>
          }
          @if (hotelOptions().length) {
            <mat-optgroup label="Properties">
              @for (h of hotelOptions(); track h.id) {
                <mat-option [value]="h.name">{{ h.name }}<span class="opt-meta">{{ h.city }}</span></mat-option>
              }
            </mat-optgroup>
          }
        </mat-autocomplete>
      </mat-form-field>

      <mat-form-field class="seg" appearance="fill">
        <mat-icon matPrefix>calendar_today</mat-icon>
        <mat-label>Check-in — Check-out</mat-label>
        <mat-date-range-input [formGroup]="form.controls.range" [rangePicker]="picker" [min]="minDate" (click)="picker.open()">
          <input matStartDate formControlName="start" placeholder="Check-in" />
          <input matEndDate formControlName="end" placeholder="Check-out" />
        </mat-date-range-input>
        <mat-date-range-picker #picker />
      </mat-form-field>

      <mat-form-field class="seg" appearance="fill">
        <mat-icon matPrefix>group</mat-icon>
        <mat-label>Travelers</mat-label>
        <input matInput readonly [value]="travelersLabel()" [matMenuTriggerFor]="who" #whoTrigger="matMenuTrigger"
               aria-label="Travelers" class="who-input" />
      </mat-form-field>
      <mat-menu #who="matMenu" xPosition="before">
        <div class="who-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
          <div class="who-row">
            <div>Adults<small>Age 13+</small></div>
            <div class="stepper">
              <button mat-stroked-button type="button" aria-label="Fewer adults" [disabled]="adults() <= 1" (click)="adults.set(adults() - 1)">−</button>
              <span>{{ adults() }}</span>
              <button mat-stroked-button type="button" aria-label="More adults" [disabled]="adults() >= 16" (click)="adults.set(adults() + 1)">+</button>
            </div>
          </div>
          <div class="who-row">
            <div>Children<small>Age 0–12</small></div>
            <div class="stepper">
              <button mat-stroked-button type="button" aria-label="Fewer children" [disabled]="children() <= 0" (click)="children.set(children() - 1)">−</button>
              <span>{{ children() }}</span>
              <button mat-stroked-button type="button" aria-label="More children" [disabled]="children() >= 10" (click)="children.set(children() + 1)">+</button>
            </div>
          </div>
          <button mat-flat-button type="button" class="done" (click)="whoTrigger.closeMenu()">Done</button>
        </div>
      </mat-menu>

      <button mat-flat-button class="seg-btn" type="submit">Search</button>
    </form>
    @if (error()) {
      <p class="error-text" style="margin-top: 10px">{{ error() }}</p>
    }
  `,
})
export class SearchBar {
  /** Current search (from the URL) to show in the fields. */
  readonly value = input.required<SearchQuery>();
  readonly destinations = input<Destination[]>([]);
  readonly hotels = input<Hotel[]>([]);
  readonly search = output<SearchQuery>();

  private readonly fb = inject(FormBuilder);
  protected readonly minDate = today();
  protected readonly adults = signal(2);
  protected readonly children = signal(0);
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    q: [''],
    range: this.fb.group({ start: [null as Date | null], end: [null as Date | null] }),
  });

  private readonly typed = toSignal(this.form.controls.q.valueChanges, { initialValue: '' });
  protected readonly cityOptions = computed(() => {
    const t = (this.typed() ?? '').trim().toLowerCase();
    return this.destinations().filter((d) => d.city.toLowerCase().includes(t)).slice(0, MAX_SUGGESTIONS);
  });
  protected readonly hotelOptions = computed(() => {
    const t = (this.typed() ?? '').trim().toLowerCase();
    if (!t) return [];
    return this.hotels()
      .filter((h) => h.name.toLowerCase().includes(t) || h.address.toLowerCase().includes(t))
      .slice(0, MAX_SUGGESTIONS);
  });
  protected readonly travelersLabel = computed(() => {
    const a = this.adults(), c = this.children();
    return `${a} adult${a === 1 ? '' : 's'}` + (c ? ` · ${c} child${c === 1 ? '' : 'ren'}` : '');
  });

  constructor() {
    // Mirror the URL's search into the fields whenever it changes (back/forward, tile clicks).
    effect(() => {
      const v = this.value();
      this.form.setValue({
        q: v.q,
        range: { start: v.checkIn ? parseIsoDate(v.checkIn) : null, end: v.checkOut ? parseIsoDate(v.checkOut) : null },
      });
      this.adults.set(v.adults);
      this.children.set(v.children);
    });
  }

  protected submit(): void {
    const { q, range } = this.form.getRawValue();
    this.error.set('');
    if (!!range.start !== !!range.end) {
      this.error.set(range.start ? 'Pick a check-out date.' : 'Pick a check-in date.');
      return;
    }
    if (range.start && range.end && nightsBetween(range.start, range.end) < 1) {
      this.error.set('Check-out must be after check-in.');
      return;
    }
    this.search.emit({
      q: (q ?? '').trim(),
      checkIn: range.start ? toIsoDate(range.start) : null,
      checkOut: range.end ? toIsoDate(range.end) : null,
      adults: this.adults(),
      children: this.children(),
    });
  }
}
