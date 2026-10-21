import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier } from '../../core/errors';
import { Hotel } from '../../core/models/models';
import { EmptyState } from '../../shared/empty-state';
import { HotelArt } from '../../shared/hotel-art';
import { Loading } from '../../shared/loading';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-manager-hotels',
  imports: [RouterLink, Loading, EmptyState, StatusBadge, HotelArt],
  styles: `
    .hotel-name { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 14px; font-weight: 500; }
  `,
  template: `
    <div class="page-head">
      <div>
        <p class="eyebrow">Manager</p>
        <h1 class="title">My hotels</h1>
      </div>
    </div>
    @if (hotels(); as list) {
      @if (list.length === 0) {
        <app-empty-state message="You do not manage any hotels yet. Ask an admin to assign one." />
      } @else {
        <div class="grid">
          @for (h of list; track h.id) {
            <a class="card" [routerLink]="['/manager/hotels', h.id]">
              <app-hotel-art [hotel]="h" />
              <div class="card-body">
                <h3 class="hotel-name">{{ h.name }}</h3>
                <p class="muted small">{{ h.address }}, {{ h.city }}</p>
                <div class="foot"><app-status [value]="h.status" /><span>Manage →</span></div>
              </div>
            </a>
          }
        </div>
      }
    } @else {
      <app-loading />
    }
  `,
})
export class ManagerHotels {
  private readonly api = inject(ManagerApi);
  private readonly notify = inject(Notifier);
  protected readonly hotels = signal<Hotel[] | null>(null);

  constructor() {
    this.api.hotels().subscribe({
      next: (list) => this.hotels.set(list),
      error: (e) => {
        this.notify.error(e);
        this.hotels.set([]);
      },
    });
  }
}
