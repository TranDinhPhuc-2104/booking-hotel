package com.booking.backend.dto;

import com.booking.backend.entity.HotelStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Fields a manager may edit. `status` is optional: null keeps the current value. */
public record HotelRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Size(max = 100) String city,
        @Size(max = 20) String phone,
        String description,
        @Size(max = 255) String imageUrl,
        HotelStatus status) {
}
