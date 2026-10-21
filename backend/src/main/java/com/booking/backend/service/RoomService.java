package com.booking.backend.service;

import com.booking.backend.dto.RoomRequest;
import com.booking.backend.dto.RoomResponse;
import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.Room;
import com.booking.backend.entity.RoomStatus;
import com.booking.backend.entity.RoomType;
import com.booking.backend.exception.BadRequestException;
import com.booking.backend.exception.ConflictException;
import com.booking.backend.exception.NotFoundException;
import com.booking.backend.repository.BookingRepository;
import com.booking.backend.repository.RoomRepository;
import com.booking.backend.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final HotelService hotelService;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<RoomResponse> list(Long hotelId) {
        hotelService.requireOwned(hotelId);
        return roomRepository.findByHotelId(hotelId).stream().map(RoomResponse::from).toList();
    }

    public RoomResponse create(Long hotelId, RoomRequest req) {
        Hotel hotel = hotelService.requireOwned(hotelId);
        if (roomRepository.existsByHotelIdAndRoomNumber(hotelId, req.roomNumber())) {
            throw new ConflictException("Room number already exists in this hotel");
        }
        Room room = new Room();
        room.setHotel(hotel);
        room.setRoomType(typeOf(hotelId, req.roomTypeId()));
        room.setRoomNumber(req.roomNumber());
        room.setFloor(req.floor());
        room.setImageUrl(req.imageUrl());
        room.setStatus(req.status() != null ? req.status() : RoomStatus.AVAILABLE);
        return RoomResponse.from(roomRepository.saveAndFlush(room));
    }

    public RoomResponse update(Long hotelId, Long roomId, RoomRequest req) {
        hotelService.requireOwned(hotelId);
        Room room = find(hotelId, roomId);
        if (!room.getRoomNumber().equals(req.roomNumber())
                && roomRepository.existsByHotelIdAndRoomNumber(hotelId, req.roomNumber())) {
            throw new ConflictException("Room number already exists in this hotel");
        }
        room.setRoomType(typeOf(hotelId, req.roomTypeId()));
        room.setRoomNumber(req.roomNumber());
        room.setFloor(req.floor());
        room.setImageUrl(req.imageUrl());
        if (req.status() != null) {
            room.setStatus(req.status());
        }
        return RoomResponse.from(roomRepository.saveAndFlush(room));
    }

    public void delete(Long hotelId, Long roomId) {
        hotelService.requireOwned(hotelId);
        Room room = find(hotelId, roomId);
        if (bookingRepository.existsByRoomId(roomId)) {
            throw new ConflictException("Room has bookings; set it to MAINTENANCE instead");
        }
        roomRepository.delete(room);
    }

    /** Rooms of an active hotel that fit `guests` and have no overlapping booking. */
    @Transactional(readOnly = true)
    public List<RoomResponse> available(Long hotelId, LocalDate checkIn, LocalDate checkOut, int guests) {
        BookingService.validateDates(checkIn, checkOut);
        if (guests < 1) {
            throw new BadRequestException("guests must be at least 1");
        }
        hotelService.requireActive(hotelId);
        return roomRepository.findAvailable(hotelId, checkIn, checkOut, guests).stream()
                .map(RoomResponse::from).toList();
    }

    private Room find(Long hotelId, Long roomId) {
        return roomRepository.findById(roomId)
                .filter(r -> r.getHotel().getId().equals(hotelId))
                .orElseThrow(() -> new NotFoundException("Room not found"));
    }

    private RoomType typeOf(Long hotelId, Long typeId) {
        return roomTypeRepository.findById(typeId)
                .filter(t -> t.getHotel().getId().equals(hotelId))
                .orElseThrow(() -> new BadRequestException("Room type does not belong to this hotel"));
    }
}
