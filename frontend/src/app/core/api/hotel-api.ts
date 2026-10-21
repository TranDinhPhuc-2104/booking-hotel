import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Destination, Hotel, HotelDetail, HotelSearchResult, Room } from '../models/models';

@Injectable({ providedIn: 'root' })
export class HotelApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/hotels`;

  list(city?: string) {
    let params = new HttpParams();
    if (city?.trim()) params = params.set('city', city.trim());
    return this.http.get<Hotel[]>(this.base, { params });
  }

  search(q: string, checkIn: string | null, checkOut: string | null, guests: number) {
    let params = new HttpParams().set('guests', guests);
    if (q.trim()) params = params.set('q', q.trim());
    if (checkIn && checkOut) params = params.set('checkIn', checkIn).set('checkOut', checkOut);
    return this.http.get<HotelSearchResult[]>(`${this.base}/search`, { params });
  }

  destinations() {
    return this.http.get<Destination[]>(`${this.base}/destinations`);
  }

  detail(id: number) {
    return this.http.get<HotelDetail>(`${this.base}/${id}`);
  }

  available(id: number, checkIn: string, checkOut: string, guests: number) {
    const params = new HttpParams().set('checkIn', checkIn).set('checkOut', checkOut).set('guests', guests);
    return this.http.get<Room[]>(`${this.base}/${id}/available-rooms`, { params });
  }
}
