package com.booking.backend.service;

import com.booking.backend.dto.HotelDetailResponse;
import com.booking.backend.dto.HotelRequest;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.RoomTypeResponse;
import com.booking.backend.entity.Hotel;
import com.booking.backend.entity.HotelStatus;
import com.booking.backend.exception.BadRequestException;
import com.booking.backend.exception.NotFoundException;
import com.booking.backend.repository.HotelRepository;
import com.booking.backend.repository.RoomTypeRepository;
import com.booking.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final CurrentUser currentUser;
    private final S3Client s3;

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Value("${app.s3.public-url}")
    private String publicUrl;

    // The extension comes from this map, never from the client's filename, so files are always served as images.
    private static final Map<String, String> IMAGE_TYPES =
            Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    /** The one check behind every manager endpoint: the hotel exists and the caller manages it (admins always do). */
    public Hotel requireOwned(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));
        if (!currentUser.isAdmin() && !hotel.getManager().getId().equals(currentUser.id())) {
            throw new AccessDeniedException("Not your hotel");
        }
        return hotel;
    }

    public List<HotelResponse> listActive(String city) {
        List<Hotel> hotels = (city == null || city.isBlank())
                ? hotelRepository.findByStatus(HotelStatus.ACTIVE)
                : hotelRepository.findByStatusAndCityIgnoreCase(HotelStatus.ACTIVE, city.trim());
        return hotels.stream().map(HotelResponse::from).toList();
    }

    public Hotel requireActive(Long hotelId) {
        return hotelRepository.findById(hotelId)
                .filter(h -> h.getStatus() == HotelStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));
    }

    public HotelDetailResponse detail(Long hotelId) {
        Hotel hotel = requireActive(hotelId);
        List<RoomTypeResponse> types = roomTypeRepository.findByHotelId(hotelId).stream()
                .map(RoomTypeResponse::from).toList();
        return new HotelDetailResponse(HotelResponse.from(hotel), types);
    }

    public List<HotelResponse> mine() {
        List<Hotel> hotels = currentUser.isAdmin()
                ? hotelRepository.findAll()
                : hotelRepository.findByManagerId(currentUser.id());
        return hotels.stream().map(HotelResponse::from).toList();
    }

    @Transactional
    public HotelResponse update(Long hotelId, HotelRequest req) {
        Hotel hotel = requireOwned(hotelId);
        hotel.setName(req.name());
        hotel.setAddress(req.address());
        hotel.setCity(req.city());
        hotel.setPhone(req.phone());
        hotel.setDescription(req.description());
        hotel.setImageUrl(req.imageUrl());
        if (req.status() != null) {
            hotel.setStatus(req.status());
        }
        return HotelResponse.from(hotel);
    }

    /** Stores the photo under hotels/ in S3 (or local uploads/ when no bucket is set) and points imageUrl at it. */
    @Transactional
    public HotelResponse uploadImage(Long hotelId, MultipartFile file) {
        Hotel hotel = requireOwned(hotelId);
        String ext = IMAGE_TYPES.get(file.getContentType());
        if (ext == null || file.isEmpty()) {
            throw new BadRequestException("Upload a JPEG, PNG or WebP image");
        }
        String name = hotelId + "-" + UUID.randomUUID() + "." + ext;
        // shortcut: the old photo stays in storage, add cleanup if storage grows.
        if (!bucket.isBlank()) {
            try {
                s3.putObject(b -> b.bucket(bucket).key("hotels/" + name).contentType(file.getContentType()),
                        RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            hotel.setImageUrl(publicUrl + "/hotels/" + name);
            return HotelResponse.from(hotel);
        }
        try {
            Path dir = Files.createDirectories(Path.of(uploadDir, "hotels"));
            file.transferTo(dir.resolve(name).toAbsolutePath());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        // Relative so it resolves against the ALB host, which routes /uploads/* to the backend.
        hotel.setImageUrl("/uploads/hotels/" + name);
        return HotelResponse.from(hotel);
    }
}
