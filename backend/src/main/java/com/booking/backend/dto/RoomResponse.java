package com.booking.backend.dto;

import com.booking.backend.entity.Room;
import com.booking.backend.entity.RoomStatus;

import java.math.BigDecimal;

public record RoomResponse(Long id, Long hotelId, String roomNumber, Long roomTypeId, String roomTypeName,
                           BigDecimal pricePerNight, Integer capacity, Integer floor, RoomStatus status,
                           String imageUrl) {

    public static RoomResponse from(Room r) {
        return new RoomResponse(r.getId(), r.getHotel().getId(), r.getRoomNumber(), r.getRoomType().getId(),
                r.getRoomType().getName(), r.getRoomType().getPricePerNight(), r.getRoomType().getCapacity(),
                r.getFloor(), r.getStatus(), r.getImageUrl());
    }
}
