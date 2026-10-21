package com.booking.backend.dto;

import com.booking.backend.entity.RoomType;

import java.math.BigDecimal;

public record RoomTypeResponse(Long id, Long hotelId, String name, String description,
                               BigDecimal pricePerNight, Integer capacity) {

    public static RoomTypeResponse from(RoomType t) {
        return new RoomTypeResponse(t.getId(), t.getHotel().getId(), t.getName(), t.getDescription(),
                t.getPricePerNight(), t.getCapacity());
    }
}
