package com.booking.backend.controller;

import com.booking.backend.dto.BookingResponse;
import com.booking.backend.dto.HotelRequest;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.StatusRequest;
import com.booking.backend.service.BookingService;
import com.booking.backend.service.HotelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerHotelController {

    private final HotelService hotelService;
    private final BookingService bookingService;

    @GetMapping("/hotels")
    public List<HotelResponse> hotels() {
        return hotelService.mine();
    }

    @PutMapping("/hotels/{id}")
    public HotelResponse update(@PathVariable Long id, @Valid @RequestBody HotelRequest req) {
        return hotelService.update(id, req);
    }

    @PostMapping(value = "/hotels/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HotelResponse uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return hotelService.uploadImage(id, file);
    }

    @GetMapping("/hotels/{id}/bookings")
    public List<BookingResponse> bookings(@PathVariable Long id) {
        return bookingService.forHotel(id);
    }

    @PatchMapping("/bookings/{id}/status")
    public BookingResponse changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return bookingService.changeStatus(id, req.status());
    }
}
