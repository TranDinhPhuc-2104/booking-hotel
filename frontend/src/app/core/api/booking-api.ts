import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Booking, BookingRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings`;

  create(req: BookingRequest) {
    return this.http.post<Booking>(this.base, req);
  }

  mine() {
    return this.http.get<Booking[]>(`${this.base}/me`);
  }

  cancel(id: number) {
    return this.http.patch<Booking>(`${this.base}/${id}/cancel`, null);
  }
}
