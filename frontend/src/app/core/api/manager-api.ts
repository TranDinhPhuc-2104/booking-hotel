import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Booking, BookingStatus, Hotel, HotelRequest, Room, RoomRequest, RoomType, RoomTypeRequest,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ManagerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/manager`;

  hotels() {
    return this.http.get<Hotel[]>(`${this.base}/hotels`);
  }

  updateHotel(id: number, req: HotelRequest) {
    return this.http.put<Hotel>(`${this.base}/hotels/${id}`, req);
  }

  uploadHotelImage(id: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Hotel>(`${this.base}/hotels/${id}/image`, body);
  }

  bookings(hotelId: number) {
    return this.http.get<Booking[]>(`${this.base}/hotels/${hotelId}/bookings`);
  }

  setBookingStatus(bookingId: number, status: BookingStatus) {
    return this.http.patch<Booking>(`${this.base}/bookings/${bookingId}/status`, { status });
  }

  roomTypes(hotelId: number) {
    return this.http.get<RoomType[]>(`${this.base}/hotels/${hotelId}/room-types`);
  }

  createRoomType(hotelId: number, req: RoomTypeRequest) {
    return this.http.post<RoomType>(`${this.base}/hotels/${hotelId}/room-types`, req);
  }

  updateRoomType(hotelId: number, typeId: number, req: RoomTypeRequest) {
    return this.http.put<RoomType>(`${this.base}/hotels/${hotelId}/room-types/${typeId}`, req);
  }

  deleteRoomType(hotelId: number, typeId: number) {
    return this.http.delete<void>(`${this.base}/hotels/${hotelId}/room-types/${typeId}`);
  }

  rooms(hotelId: number) {
    return this.http.get<Room[]>(`${this.base}/hotels/${hotelId}/rooms`);
  }

  createRoom(hotelId: number, req: RoomRequest) {
    return this.http.post<Room>(`${this.base}/hotels/${hotelId}/rooms`, req);
  }

  updateRoom(hotelId: number, roomId: number, req: RoomRequest) {
    return this.http.put<Room>(`${this.base}/hotels/${hotelId}/rooms/${roomId}`, req);
  }

  deleteRoom(hotelId: number, roomId: number) {
    return this.http.delete<void>(`${this.base}/hotels/${hotelId}/rooms/${roomId}`);
  }
}
