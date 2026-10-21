package com.booking.backend.dto;

import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.HotelStatus;

public record HotelResponse(Long id, Long managerId, String name, String address, String city,
                            String phone, String description, String imageUrl, HotelStatus status) {

    public static HotelResponse from(Hotel h) {
        return new HotelResponse(h.getId(), h.getManager().getId(), h.getName(), h.getAddress(), h.getCity(),
                h.getPhone(), h.getDescription(), h.getImageUrl(), h.getStatus());
    }
}
