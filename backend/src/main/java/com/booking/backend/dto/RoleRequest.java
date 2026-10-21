package com.booking.backend.dto;

import com.booking.backend.entity.Role;
import jakarta.validation.constraints.NotNull;

public record RoleRequest(@NotNull Role role) {
}
