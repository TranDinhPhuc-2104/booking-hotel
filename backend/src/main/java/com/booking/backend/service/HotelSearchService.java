package com.booking.backend.service;

import com.booking.backend.dto.DestinationResponse;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.HotelSearchResult;
import com.booking.backend.entity.Hotel;
import com.booking.backend.exception.BadRequestException;
import com.booking.backend.repository.HotelRepository;
import com.booking.backend.repository.RoomRepository;
import com.booking.backend.repository.RoomRepository.AvailabilitySummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HotelSearchService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;

    /**
     * Hotels matching the text (name, address or city) that can host the travelers.
     * With dates: only hotels with at least one free room for the whole stay.
     */
    public List<HotelSearchResult> search(String q, LocalDate checkIn, LocalDate checkOut, int guests) {
        if ((checkIn == null) != (checkOut == null)) {
            throw new BadRequestException("Give both checkIn and checkOut, or neither");
        }
        if (checkIn != null) {
            BookingService.validateDates(checkIn, checkOut);
        }
        if (guests < 1) {
            throw new BadRequestException("guests must be at least 1");
        }

        List<Hotel> hotels = hotelRepository.searchActive(likePattern(q));
        if (hotels.isEmpty()) {
            return List.of();
        }
        List<Long> ids = hotels.stream().map(Hotel::getId).toList();
        Map<Long, AvailabilitySummary> byHotel = (checkIn != null
                ? roomRepository.availabilityByHotel(ids, checkIn, checkOut, guests)
                : roomRepository.fittingRoomsByHotel(ids, guests))
                .stream().collect(Collectors.toMap(AvailabilitySummary::getHotelId, Function.identity()));

        // A hotel with no fitting (and, with dates, free) room is not a result.
        return hotels.stream()
                .filter(h -> byHotel.containsKey(h.getId()))
                .map(h -> {
                    AvailabilitySummary s = byHotel.get(h.getId());
                    return new HotelSearchResult(HotelResponse.from(h),
                            checkIn != null ? s.getRooms() : null, s.getFromPrice());
                })
                .toList();
    }

    public List<DestinationResponse> destinations() {
        return hotelRepository.activeCities().stream()
                .map(c -> new DestinationResponse(c.getCity(), c.getHotels()))
                .toList();
    }

    /** "%text%" lower-cased, with LIKE wildcards in the user's text escaped by "!". Blank matches everything. */
    static String likePattern(String q) {
        if (q == null || q.isBlank()) {
            return "%";
        }
        String escaped = q.trim().toLowerCase()
                .replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return "%" + escaped + "%";
    }
}
