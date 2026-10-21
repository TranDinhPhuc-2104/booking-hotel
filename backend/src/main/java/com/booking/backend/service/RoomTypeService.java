package com.booking.backend.service;

import com.booking.backend.dto.RoomTypeRequest;
import com.booking.backend.dto.RoomTypeResponse;
import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.RoomType;
import com.booking.backend.exception.ConflictException;
import com.booking.backend.exception.NotFoundException;
import com.booking.backend.repository.RoomRepository;
import com.booking.backend.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomTypeService {

    private final HotelService hotelService;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<RoomTypeResponse> list(Long hotelId) {
        hotelService.requireOwned(hotelId);
        return roomTypeRepository.findByHotelId(hotelId).stream().map(RoomTypeResponse::from).toList();
    }

    public RoomTypeResponse create(Long hotelId, RoomTypeRequest req) {
        Hotel hotel = hotelService.requireOwned(hotelId);
        RoomType type = new RoomType();
        type.setHotel(hotel);
        apply(type, req);
        return RoomTypeResponse.from(roomTypeRepository.saveAndFlush(type));
    }

    public RoomTypeResponse update(Long hotelId, Long typeId, RoomTypeRequest req) {
        hotelService.requireOwned(hotelId);
        RoomType type = find(hotelId, typeId);
        apply(type, req);
        return RoomTypeResponse.from(roomTypeRepository.saveAndFlush(type));
    }

    public void delete(Long hotelId, Long typeId) {
        hotelService.requireOwned(hotelId);
        RoomType type = find(hotelId, typeId);
        if (roomRepository.existsByRoomTypeId(typeId)) {
            throw new ConflictException("Room type is still used by rooms");
        }
        roomTypeRepository.delete(type);
    }

    private RoomType find(Long hotelId, Long typeId) {
        return roomTypeRepository.findById(typeId)
                .filter(t -> t.getHotel().getId().equals(hotelId))
                .orElseThrow(() -> new NotFoundException("Room type not found"));
    }

    private void apply(RoomType type, RoomTypeRequest req) {
        type.setName(req.name());
        type.setDescription(req.description());
        type.setPricePerNight(req.pricePerNight());
        type.setCapacity(req.capacity());
    }
}
