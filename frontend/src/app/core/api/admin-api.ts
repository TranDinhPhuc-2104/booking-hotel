import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Hotel, HotelCreateRequest, Role, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  users() {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  changeRole(userId: number, role: Role) {
    return this.http.patch<User>(`${this.base}/users/${userId}/role`, { role });
  }

  hotels() {
    return this.http.get<Hotel[]>(`${this.base}/hotels`);
  }

  createHotel(req: HotelCreateRequest) {
    return this.http.post<Hotel>(`${this.base}/hotels`, req);
  }

  assignManager(hotelId: number, managerId: number) {
    return this.http.patch<Hotel>(`${this.base}/hotels/${hotelId}/manager`, { managerId });
  }
}
