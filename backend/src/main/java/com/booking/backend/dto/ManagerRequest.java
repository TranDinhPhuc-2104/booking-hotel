package com.booking.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ManagerRequest(@NotNull Long managerId) {
}
