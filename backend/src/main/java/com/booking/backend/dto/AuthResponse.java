package com.booking.backend.dto;

public record AuthResponse(String token, UserResponse user) {
}
