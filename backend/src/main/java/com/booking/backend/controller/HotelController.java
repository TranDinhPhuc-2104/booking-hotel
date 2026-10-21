package com.booking.backend.controller;

import com.booking.backend.dto.DestinationResponse;
import com.booking.backend.dto.HotelDetailResponse;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.HotelSearchResult;
import com.booking.backend.dto.RoomResponse;
import com.booking.backend.service.HotelSearchService;
import com.booking.backend.service.HotelService;
import com.booking.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;
    private final RoomService roomService;
    private final HotelSearchService searchService;

    @GetMapping
    public List<HotelResponse> list(@RequestParam(required = false) String city) {
        return hotelService.listActive(city);
    }

    /** Free-text search over name, address and city; with dates, only hotels that have a free room. */
    @GetMapping("/search")
    public List<HotelSearchResult> search(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
                                          @RequestParam(defaultValue = "1") int guests) {
        return searchService.search(q, checkIn, checkOut, guests);
    }

    @GetMapping("/destinations")
    public List<DestinationResponse> destinations() {
        return searchService.destinations();
    }

    @GetMapping("/{id}")
    public HotelDetailResponse detail(@PathVariable Long id) {
        return hotelService.detail(id);
    }

    @GetMapping("/{id}/available-rooms")
    public List<RoomResponse> availableRooms(@PathVariable Long id,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
                                             @RequestParam(defaultValue = "1") int guests) {
        return roomService.available(id, checkIn, checkOut, guests);
    }
}
