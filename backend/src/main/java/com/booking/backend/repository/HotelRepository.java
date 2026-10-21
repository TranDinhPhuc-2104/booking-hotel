package com.booking.backend.repository;

import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.HotelStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    List<Hotel> findByManagerId(Long managerId);

    boolean existsByManagerId(Long managerId);

    List<Hotel> findByStatus(HotelStatus status);

    List<Hotel> findByStatusAndCityIgnoreCase(HotelStatus status, String city);

    /** ACTIVE hotels whose name, address or city contains the (already lower-cased, LIKE-escaped) pattern. */
    @Query("""
            SELECT h FROM Hotel h
            WHERE h.status = com.booking.backend.entity.HotelStatus.ACTIVE
              AND (LOWER(h.name) LIKE :pattern ESCAPE '!'
                OR LOWER(h.address) LIKE :pattern ESCAPE '!'
                OR LOWER(h.city) LIKE :pattern ESCAPE '!')
            ORDER BY h.city, h.name
            """)
    List<Hotel> searchActive(@Param("pattern") String pattern);

    interface CityCount {
        String getCity();

        long getHotels();
    }

    @Query("""
            SELECT h.city AS city, COUNT(h) AS hotels FROM Hotel h
            WHERE h.status = com.booking.backend.entity.HotelStatus.ACTIVE
            GROUP BY h.city
            ORDER BY COUNT(h) DESC, h.city
            """)
    List<CityCount> activeCities();
}
