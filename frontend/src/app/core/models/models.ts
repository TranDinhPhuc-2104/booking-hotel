// Mirrors the backend DTOs field for field (see backend/src/main/java/com/booking/backend/dto).

export type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN';
export type HotelStatus = 'ACTIVE' | 'INACTIVE';
export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface ApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Hotel {
  id: number;
  managerId: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  description: string | null;
  imageUrl: string | null;
  status: HotelStatus;
}

export interface HotelRequest {
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status?: HotelStatus | null;
}

export interface HotelCreateRequest extends HotelRequest {
  managerId: number;
}

export interface RoomType {
  id: number;
  hotelId: number;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
}

export interface RoomTypeRequest {
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
}

export interface HotelSearchResult {
  hotel: Hotel;
  availableRooms: number | null; // null when the search had no dates
  fromPrice: number | null;
}

export interface Destination {
  city: string;
  hotels: number;
}

export interface HotelDetail {
  hotel: Hotel;
  roomTypes: RoomType[];
}

export interface Room {
  id: number;
  hotelId: number;
  roomNumber: string;
  roomTypeId: number;
  roomTypeName: string;
  pricePerNight: number;
  capacity: number;
  floor: number | null;
  status: RoomStatus;
  imageUrl: string | null;
}

export interface RoomRequest {
  roomNumber: string;
  roomTypeId: number;
  floor?: number | null;
  status?: RoomStatus | null;
  imageUrl?: string | null;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  roomNumber: string;
  hotelId: number;
  hotelName: string;
  checkIn: string; // yyyy-MM-dd
  checkOut: string; // yyyy-MM-dd
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  note: string | null;
  createdAt: string;
}

export interface BookingRequest {
  roomId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  note?: string | null;
}
