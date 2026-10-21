package com.booking.backend.service;

import com.booking.backend.dto.HotelCreateRequest;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.UserResponse;
import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.HotelStatus;
import com.booking.backend.entity.Role;
import com.booking.backend.entity.User;
import com.booking.backend.exception.BadRequestException;
import com.booking.backend.exception.ConflictException;
import com.booking.backend.exception.NotFoundException;
import com.booking.backend.repository.HotelRepository;
import com.booking.backend.repository.UserRepository;
import com.booking.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<UserResponse> users() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> hotels() {
        return hotelRepository.findAll().stream().map(HotelResponse::from).toList();
    }

    public UserResponse changeRole(Long userId, Role role) {
        if (userId.equals(currentUser.id())) {
            throw new BadRequestException("You cannot change your own role");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (role == Role.CUSTOMER && hotelRepository.existsByManagerId(userId)) {
            throw new ConflictException("User still manages hotels; reassign them first");
        }
        user.setRole(role);
        return UserResponse.from(user);
    }

    public HotelResponse createHotel(HotelCreateRequest req) {
        Hotel hotel = new Hotel();
        hotel.setManager(requireManager(req.managerId()));
        hotel.setName(req.name());
        hotel.setAddress(req.address());
        hotel.setCity(req.city());
        hotel.setPhone(req.phone());
        hotel.setDescription(req.description());
        hotel.setImageUrl(req.imageUrl());
        hotel.setStatus(req.status() != null ? req.status() : HotelStatus.ACTIVE);
        return HotelResponse.from(hotelRepository.save(hotel));
    }

    public HotelResponse assignManager(Long hotelId, Long managerId) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() -> new NotFoundException("Hotel not found"));
        hotel.setManager(requireManager(managerId));
        return HotelResponse.from(hotel);
    }

    private User requireManager(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Manager not found"));
        if (user.getRole() != Role.MANAGER) {
            throw new BadRequestException("User is not a MANAGER");
        }
        return user;
    }
}
