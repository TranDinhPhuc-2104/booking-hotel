package com.booking.backend.exception;

import java.util.Map;

public record ErrorResponse(int status, String message, Map<String, String> fieldErrors) {
}
