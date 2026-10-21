package com.booking.backend.dto;

import java.util.List;

public record HotelDetailResponse(HotelResponse hotel, List<RoomTypeResponse> roomTypes) {
}
