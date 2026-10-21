import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { ManagerApi } from '../../core/api/manager-api';
import { Notifier } from '../../core/errors';
import { Hotel } from '../../core/models/models';
import { Loading } from '../../shared/loading';
import { StatusBadge } from '../../shared/status-badge';
import { BookingsTab } from './bookings-tab';
import { HotelDetailsTab } from './hotel-details-tab';
import { RoomTypesTab } from './room-types-tab';
import { RoomsTab } from './rooms-tab';

@Component({
  selector: 'app-manager-hotel',
  imports: [RouterLink, MatTabsModule, Loading, StatusBadge, HotelDetailsTab, RoomTypesTab, RoomsTab, BookingsTab],
  template: `
    <a class="back" routerLink="/manager">← My hotels</a>
    @if (loading()) {
      <app-loading />
    } @else if (hotel(); as h) {
      <div class="page-head" style="margin-bottom: 8px">
        <div>
          <h1 class="title">{{ h.name }}</h1>
          <p class="sub">{{ h.address }}, {{ h.city }} · <app-status [value]="h.status" /></p>
        </div>
      </div>
      <mat-tab-group [mat-stretch-tabs]="false" animationDuration="0ms">
        <mat-tab label="Details">
          <ng-template matTabContent>
            <app-hotel-details-tab [hotel]="h" (saved)="hotel.set($event)" />
          </ng-template>
        </mat-tab>
        <mat-tab label="Room types">
          <ng-template matTabContent><app-room-types-tab [hotelId]="h.id" /></ng-template>
        </mat-tab>
        <mat-tab label="Rooms">
          <ng-template matTabContent><app-rooms-tab [hotelId]="h.id" /></ng-template>
        </mat-tab>
        <mat-tab label="Bookings">
          <ng-template matTabContent><app-bookings-tab [hotelId]="h.id" /></ng-template>
        </mat-tab>
      </mat-tab-group>
    } @else {
      <h1 class="title">Hotel not found</h1>
      <p class="sub">It does not exist, or you do not manage it.</p>
    }
  `,
})
export class ManagerHotel {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ManagerApi);
  private readonly notify = inject(Notifier);

  protected readonly loading = signal(true);
  protected readonly hotel = signal<Hotel | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.hotels().subscribe({
      next: (list) => {
        this.hotel.set(list.find((h) => h.id === id) ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.notify.error(e);
        this.loading.set(false);
      },
    });
  }
}
