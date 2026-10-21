package com.booking.backend.repository;

import com.booking.backend.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHotelId(Long hotelId);

    boolean existsByRoomTypeId(Long roomTypeId);

    boolean existsByHotelIdAndRoomNumber(Long hotelId, String roomNumber);

    // Row lock: serialises concurrent bookings of the same room (see BookingService.create)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT r FROM Room r JOIN FETCH r.roomType t
            WHERE r.hotel.id = :hotelId
              AND r.status = com.booking.backend.entity.RoomStatus.AVAILABLE
              AND t.capacity >= :guests
              AND NOT EXISTS (
                SELECT 1 FROM Booking b
                WHERE b.room = r
                  AND b.status <> com.booking.backend.entity.BookingStatus.CANCELLED
                  AND b.checkIn < :checkOut
                  AND b.checkOut > :checkIn)
            ORDER BY r.roomNumber
            """)
    List<Room> findAvailable(@Param("hotelId") Long hotelId,
                             @Param("checkIn") LocalDate checkIn,
                             @Param("checkOut") LocalDate checkOut,
                             @Param("guests") int guests);

    interface AvailabilitySummary {
        Long getHotelId();

        Long getRooms();

        BigDecimal getFromPrice();
    }

    /** Per hotel: how many rooms are free for the dates and fit the guests, and the cheapest of them. */
    @Query("""
            SELECT r.hotel.id AS hotelId, COUNT(r) AS rooms, MIN(t.pricePerNight) AS fromPrice
            FROM Room r JOIN r.roomType t
            WHERE r.hotel.id IN :hotelIds
              AND r.status = com.booking.backend.entity.RoomStatus.AVAILABLE
              AND t.capacity >= :guests
              AND NOT EXISTS (
                SELECT 1 FROM Booking b
                WHERE b.room = r
                  AND b.status <> com.booking.backend.entity.BookingStatus.CANCELLED
                  AND b.checkIn < :checkOut
                  AND b.checkOut > :checkIn)
            GROUP BY r.hotel.id
            """)
    List<AvailabilitySummary> availabilityByHotel(@Param("hotelIds") Collection<Long> hotelIds,
                                                  @Param("checkIn") LocalDate checkIn,
                                                  @Param("checkOut") LocalDate checkOut,
                                                  @Param("guests") int guests);

    /** Per hotel: the cheapest bookable room that fits the guests, ignoring dates. */
    @Query("""
            SELECT r.hotel.id AS hotelId, COUNT(r) AS rooms, MIN(t.pricePerNight) AS fromPrice
            FROM Room r JOIN r.roomType t
            WHERE r.hotel.id IN :hotelIds
              AND r.status = com.booking.backend.entity.RoomStatus.AVAILABLE
              AND t.capacity >= :guests
            GROUP BY r.hotel.id
            """)
    List<AvailabilitySummary> fittingRoomsByHotel(@Param("hotelIds") Collection<Long> hotelIds,
                                                  @Param("guests") int guests);
}
