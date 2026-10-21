package com.booking.backend.controller;

import com.booking.backend.dto.RoomRequest;
import com.booking.backend.dto.RoomResponse;
import com.booking.backend.dto.RoomTypeRequest;
import com.booking.backend.dto.RoomTypeResponse;
import com.booking.backend.service.RoomService;
import com.booking.backend.service.RoomTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/hotels/{hotelId}")
@RequiredArgsConstructor
public class ManagerCatalogController {

    private final RoomTypeService roomTypeService;
    private final RoomService roomService;

    @GetMapping("/room-types")
    public List<RoomTypeResponse> roomTypes(@PathVariable Long hotelId) {
        return roomTypeService.list(hotelId);
    }

    @PostMapping("/room-types")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomTypeResponse createRoomType(@PathVariable Long hotelId, @Valid @RequestBody RoomTypeRequest req) {
        return roomTypeService.create(hotelId, req);
    }

    @PutMapping("/room-types/{typeId}")
    public RoomTypeResponse updateRoomType(@PathVariable Long hotelId, @PathVariable Long typeId,
                                           @Valid @RequestBody RoomTypeRequest req) {
        return roomTypeService.update(hotelId, typeId, req);
    }

    @DeleteMapping("/room-types/{typeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoomType(@PathVariable Long hotelId, @PathVariable Long typeId) {
        roomTypeService.delete(hotelId, typeId);
    }

    @GetMapping("/rooms")
    public List<RoomResponse> rooms(@PathVariable Long hotelId) {
        return roomService.list(hotelId);
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse createRoom(@PathVariable Long hotelId, @Valid @RequestBody RoomRequest req) {
        return roomService.create(hotelId, req);
    }

    @PutMapping("/rooms/{roomId}")
    public RoomResponse updateRoom(@PathVariable Long hotelId, @PathVariable Long roomId,
                                   @Valid @RequestBody RoomRequest req) {
        return roomService.update(hotelId, roomId, req);
    }

    @DeleteMapping("/rooms/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Long hotelId, @PathVariable Long roomId) {
        roomService.delete(hotelId, roomId);
    }
}
