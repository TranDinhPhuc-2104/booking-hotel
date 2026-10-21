package com.booking.backend.dto;

import java.math.BigDecimal;

/**
 * One hotel in search results.
 * availableRooms: free rooms for the searched dates and travelers, or null when no dates were given.
 * fromPrice: cheapest nightly price among room types that fit the travelers (and are free, when dates were given).
 */
public record HotelSearchResult(HotelResponse hotel, Long availableRooms, BigDecimal fromPrice) {
}
