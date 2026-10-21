package com.booking.backend.service;

import com.booking.backend.dto.BookingRequest;
import com.booking.backend.dto.BookingResponse;
import com.booking.backend.entity.Booking;
import com.booking.backend.entity.BookingStatus;
import com.booking.backend.entity.HotelStatus;
import com.booking.backend.entity.Room;
import com.booking.backend.entity.RoomStatus;
import com.booking.backend.entity.User;
import com.booking.backend.exception.BadRequestException;
import com.booking.backend.exception.ConflictException;
import com.booking.backend.exception.NotFoundException;
import com.booking.backend.repository.BookingRepository;
import com.booking.backend.repository.RoomRepository;
import com.booking.backend.repository.UserRepository;
import com.booking.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private static final Map<BookingStatus, Set<BookingStatus>> MANAGER_TRANSITIONS = Map.of(
            BookingStatus.PENDING, Set.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
            BookingStatus.CONFIRMED, Set.of(BookingStatus.CANCELLED, BookingStatus.COMPLETED));

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final HotelService hotelService;
    private final CurrentUser currentUser;

    static void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn.isBefore(LocalDate.now())) {
            throw new BadRequestException("checkIn cannot be in the past");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new BadRequestException("checkOut must be after checkIn");
        }
    }

    public BookingResponse create(BookingRequest req) {
        validateDates(req.checkIn(), req.checkOut());

        // Lock the room row first: two concurrent requests for one room queue here, so the
        // overlap check below always sees the other request's committed booking.
        Room room = roomRepository.findByIdForUpdate(req.roomId())
                .orElseThrow(() -> new NotFoundException("Room not found"));
        if (room.getStatus() != RoomStatus.AVAILABLE || room.getHotel().getStatus() != HotelStatus.ACTIVE) {
            throw new BadRequestException("Room is not available for booking");
        }
        if (req.guests() > room.getRoomType().getCapacity()) {
            throw new BadRequestException("Too many guests for this room (max " + room.getRoomType().getCapacity() + ")");
        }
        if (bookingRepository.existsOverlap(room.getId(), req.checkIn(), req.checkOut())) {
            throw new ConflictException("Room is already booked for these dates");
        }

        User user = userRepository.getReferenceById(currentUser.id());
        long nights = ChronoUnit.DAYS.between(req.checkIn(), req.checkOut());
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setCheckIn(req.checkIn());
        booking.setCheckOut(req.checkOut());
        booking.setGuests(req.guests());
        booking.setTotalPrice(room.getRoomType().getPricePerNight().multiply(BigDecimal.valueOf(nights)));
        booking.setNote(req.note());
        return BookingResponse.from(bookingRepository.saveAndFlush(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> mine() {
        return bookingRepository.findByUserIdOrderByIdDesc(currentUser.id()).stream()
                .map(BookingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> forHotel(Long hotelId) {
        hotelService.requireOwned(hotelId);
        return bookingRepository.findByRoomHotelIdOrderByIdDesc(hotelId).stream()
                .map(BookingResponse::from).toList();
    }

    public BookingResponse cancelOwn(Long bookingId) {
        Booking booking = find(bookingId);
        if (!booking.getUser().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("Not your booking");
        }
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Booking cannot be cancelled in status " + booking.getStatus());
        }
        if (!LocalDate.now().isBefore(booking.getCheckIn())) {
            throw new BadRequestException("Booking can only be cancelled before check-in day");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return BookingResponse.from(booking);
    }

    public BookingResponse changeStatus(Long bookingId, BookingStatus next) {
        Booking booking = find(bookingId);
        hotelService.requireOwned(booking.getRoom().getHotel().getId());
        if (!MANAGER_TRANSITIONS.getOrDefault(booking.getStatus(), Set.of()).contains(next)) {
            throw new BadRequestException("Cannot change booking from " + booking.getStatus() + " to " + next);
        }
        booking.setStatus(next);
        return BookingResponse.from(booking);
    }

    private Booking find(Long bookingId) {
        return bookingRepository.findById(bookingId).orElseThrow(() -> new NotFoundException("Booking not found"));
    }
}
