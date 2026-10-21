package com.booking.backend.dto;

import com.booking.backend.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** `status` is optional: null means AVAILABLE on create and "unchanged" on update. */
public record RoomRequest(
        @NotBlank @Size(max = 10) String roomNumber,
        @NotNull Long roomTypeId,
        Integer floor,
        RoomStatus status,
        @Size(max = 255) String imageUrl) {
}
