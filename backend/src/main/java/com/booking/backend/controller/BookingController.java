package com.booking.backend.controller;

import com.booking.backend.dto.BookingRequest;
import com.booking.backend.dto.BookingResponse;
import com.booking.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@Valid @RequestBody BookingRequest req) {
        return bookingService.create(req);
    }

    @GetMapping("/me")
    public List<BookingResponse> mine() {
        return bookingService.mine();
    }

    @PatchMapping("/{id}/cancel")
    public BookingResponse cancel(@PathVariable Long id) {
        return bookingService.cancelOwn(id);
    }
}
