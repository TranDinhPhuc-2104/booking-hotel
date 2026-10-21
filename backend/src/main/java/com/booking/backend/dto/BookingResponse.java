package com.booking.backend.dto;

import com.booking.backend.entity.Booking;
import com.booking.backend.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BookingResponse(Long id, Long userId, Long roomId, String roomNumber, Long hotelId, String hotelName,
                              LocalDate checkIn, LocalDate checkOut, Integer guests, BigDecimal totalPrice,
                              BookingStatus status, String note, LocalDateTime createdAt) {

    public static BookingResponse from(Booking b) {
        return new BookingResponse(b.getId(), b.getUser().getId(), b.getRoom().getId(), b.getRoom().getRoomNumber(),
                b.getRoom().getHotel().getId(), b.getRoom().getHotel().getName(), b.getCheckIn(), b.getCheckOut(),
                b.getGuests(), b.getTotalPrice(), b.getStatus(), b.getNote(), b.getCreatedAt());
    }
}
