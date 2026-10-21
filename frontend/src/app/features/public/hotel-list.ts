import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { HotelApi } from '../../core/api/hotel-api';
import { Notifier } from '../../core/errors';
import { Destination, Hotel, HotelSearchResult } from '../../core/models/models';
import { EmptyState } from '../../shared/empty-state';
import { HotelArt, toneStyle } from '../../shared/hotel-art';
import { Loading } from '../../shared/loading';
import { MoneyPipe } from '../../shared/money.pipe';
import { SearchBar, SearchQuery } from './search-bar';

const DEFAULT_ADULTS = 2;

@Component({
  selector: 'app-hotel-list',
  imports: [RouterLink, DatePipe, Loading, EmptyState, HotelArt, MoneyPipe, SearchBar],
  styles: `
    .hero { padding: 16px 0 28px; }
    @media (min-width: 768px) { .hero { padding: 32px 0 36px; } }
    .hero .lead { margin: 12px 0 28px; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: 12px; }
    .tile { position: relative; display: flex; flex-direction: column; justify-content: flex-end; height: 96px; padding: 12px 14px;
      border-radius: 14px; border: 1px solid transparent; background: linear-gradient(135deg, var(--a), var(--b));
      text-decoration: none; color: var(--ink); cursor: pointer; font: inherit; text-align: left;
      transition: transform 0.15s ease, box-shadow 0.2s ease; }
    .tile:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .tile.on { border-color: var(--ink); }
    .tile strong { font-weight: 600; letter-spacing: -0.01em; }
    .tile small { color: var(--ink-2); font-size: 12px; }
    .hotel-name { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .desc { color: var(--ink-2); font-size: 14px; margin-top: 10px; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden; }
    .foot { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 14px;
      padding-top: 12px; border-top: 1px solid var(--line); font-size: 14px; }
    .left { color: var(--ok); font-size: 13px; font-weight: 500; }
    .left.few { color: var(--warn); }
    .clear { background: none; border: 0; padding: 0; font: inherit; font-size: 13px; color: var(--muted);
      text-decoration: underline; cursor: pointer; }
  `,
  template: `
    <section class="hero">
      <p class="eyebrow">Stays across Vietnam</p>
      <h1 class="display">Find a quiet place to stay.</h1>
      <p class="lead">Hand-picked hotels, honest prices, booked in a minute.</p>
      <app-search-bar [value]="query()" [destinations]="destinations()" [hotels]="allHotels()" (search)="go($event)" />
    </section>

    @if (destinations().length) {
      <section class="section" style="margin-top: 12px">
        <div class="section-head"><h2 class="section-title">Explore destinations</h2></div>
        <div class="tiles">
          @for (d of destinations(); track d.city; let i = $index) {
            <button type="button" class="tile" [class.on]="isCity(d.city)" [style]="tone(i)" (click)="pickCity(d.city)">
              <strong>{{ d.city }}</strong>
              <small>{{ d.hotels }} {{ d.hotels === 1 ? 'hotel' : 'hotels' }}</small>
            </button>
          }
        </div>
      </section>
    }

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{{ heading() }}</h2>
        <span class="muted small">
          @if (results(); as list) {
            {{ list.length }} {{ list.length === 1 ? 'property' : 'properties' }}
          }
          @if (query().checkIn && query().checkOut) {
            · {{ query().checkIn | date: 'd MMM' }} – {{ query().checkOut | date: 'd MMM' }}
          }
          · {{ guests() }} traveler{{ guests() === 1 ? '' : 's' }}
          @if (isFiltered()) {
            · <button type="button" class="clear" (click)="clear()">Clear search</button>
          }
        </span>
      </div>

      @if (results(); as list) {
        @if (list.length === 0) {
          <app-empty-state
            [message]="query().checkIn ? 'No stays match your search. Try other dates, another destination or fewer travelers.' : 'No stays match your search. Try another destination.'"
          />
        } @else {
          <div class="grid">
            @for (r of list; track r.hotel.id) {
              <a class="card" [routerLink]="['/hotels', r.hotel.id]" [queryParams]="detailParams()">
                <app-hotel-art [hotel]="r.hotel" />
                <div class="card-body">
                  <h3 class="hotel-name">{{ r.hotel.name }}</h3>
                  <p class="muted small">{{ r.hotel.address }}, {{ r.hotel.city }}</p>
                  @if (r.hotel.description) {
                    <p class="desc">{{ r.hotel.description }}</p>
                  }
                  <div class="foot">
                    <span>
                      @if (r.fromPrice != null) {
                        <span class="muted small">from </span><span class="price">{{ r.fromPrice | money }}</span><span class="muted small"> / night</span>
                      }
                    </span>
                    @if (r.availableRooms != null) {
                      <span class="left" [class.few]="r.availableRooms <= 2">
                        {{ r.availableRooms <= 2 ? 'Only ' + r.availableRooms + ' left' : r.availableRooms + ' rooms free' }}
                      </span>
                    } @else {
                      <span class="small">View rooms →</span>
                    }
                  </div>
                </div>
              </a>
            }
          </div>
        }
      } @else {
        <app-loading />
      }
    </section>
  `,
})
export class HotelList {
  private readonly api = inject(HotelApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(Notifier);

  protected readonly query = signal<SearchQuery>({ q: '', checkIn: null, checkOut: null, adults: DEFAULT_ADULTS, children: 0 });
  protected readonly results = signal<HotelSearchResult[] | null>(null);
  protected readonly destinations = signal<Destination[]>([]);
  protected readonly allHotels = signal<Hotel[]>([]);

  protected readonly guests = computed(() => this.query().adults + this.query().children);
  protected readonly isFiltered = computed(() => {
    const q = this.query();
    return !!q.q || !!q.checkIn || q.adults !== DEFAULT_ADULTS || q.children > 0;
  });
  protected readonly heading = computed(() => {
    const q = this.query().q;
    if (!q) return 'All stays';
    return this.isCity(q) ? `Stays in ${this.destinations().find((d) => d.city.toLowerCase() === q.toLowerCase())?.city}` : `Results for “${q}”`;
  });
  /** Carry dates and travelers into the hotel page so its availability shows straight away. */
  protected readonly detailParams = computed(() => {
    const q = this.query();
    return q.checkIn && q.checkOut ? { checkIn: q.checkIn, checkOut: q.checkOut, guests: this.guests() } : {};
  });

  constructor() {
    this.api.destinations().subscribe({ next: (d) => this.destinations.set(d), error: () => undefined });
    this.api.list().subscribe({ next: (h) => this.allHotels.set(h), error: () => undefined });
    this.route.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.query.set(readQuery(params));
      this.load();
    });
  }

  protected tone(i: number): string {
    return toneStyle(i);
  }

  protected isCity(text: string): boolean {
    const t = text.trim().toLowerCase();
    return !!t && this.destinations().some((d) => d.city.toLowerCase() === t) && this.query().q.trim().toLowerCase() === t;
  }

  protected pickCity(city: string): void {
    this.go({ ...this.query(), q: city });
  }

  protected clear(): void {
    this.go({ q: '', checkIn: null, checkOut: null, adults: DEFAULT_ADULTS, children: 0 });
  }

  /** The URL is the source of truth: a search just navigates, and the queryParamMap subscription loads. */
  protected go(q: SearchQuery): void {
    void this.router.navigate([], {
      queryParams: {
        q: q.q || null,
        checkIn: q.checkIn,
        checkOut: q.checkOut,
        adults: q.adults !== DEFAULT_ADULTS ? q.adults : null,
        children: q.children || null,
      },
    });
  }

  private load(): void {
    const q = this.query();
    this.results.set(null);
    this.api.search(q.q, q.checkIn, q.checkOut, this.guests()).subscribe({
      next: (list) => this.results.set(list),
      error: (e) => {
        this.notify.error(e);
        this.results.set([]);
      },
    });
  }
}

function readQuery(p: ParamMap): SearchQuery {
  const date = (k: string) => {
    const v = p.get(k);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  };
  const int = (k: string, fallback: number, min: number) => {
    const n = Number(p.get(k));
    return p.has(k) && Number.isInteger(n) && n >= min ? n : fallback;
  };
  const checkIn = date('checkIn');
  const checkOut = date('checkOut');
  return {
    q: p.get('q') ?? p.get('city') ?? '',
    checkIn: checkIn && checkOut ? checkIn : null,
    checkOut: checkIn && checkOut ? checkOut : null,
    adults: int('adults', DEFAULT_ADULTS, 1),
    children: int('children', 0, 0),
  };
}
