package com.booking.backend.dto;

import com.booking.backend.entity.Role;
import com.booking.backend.entity.User;

public record UserResponse(Long id, String fullName, String email, String phone, Role role) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole());
    }
}
