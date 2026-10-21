package com.booking.backend.repository;

import com.booking.backend.entity.Booking;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"room", "room.hotel"})
    List<Booking> findByUserIdOrderByIdDesc(Long userId);

    @EntityGraph(attributePaths = {"room", "room.hotel"})
    List<Booking> findByRoomHotelIdOrderByIdDesc(Long hotelId);

    boolean existsByRoomId(Long roomId);

    // True if the room already has a non-cancelled booking overlapping [checkIn, checkOut)
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.room.id = :roomId
              AND b.status <> com.booking.backend.entity.BookingStatus.CANCELLED
              AND b.checkIn < :checkOut
              AND b.checkOut > :checkIn
            """)
    boolean existsOverlap(@Param("roomId") Long roomId,
                          @Param("checkIn") LocalDate checkIn,
                          @Param("checkOut") LocalDate checkOut);
}
