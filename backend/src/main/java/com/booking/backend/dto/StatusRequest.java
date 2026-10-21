package com.booking.backend.dto;

import com.booking.backend.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull BookingStatus status) {
}
