package com.booking.backend.controller;

import com.booking.backend.dto.HotelCreateRequest;
import com.booking.backend.dto.HotelResponse;
import com.booking.backend.dto.ManagerRequest;
import com.booking.backend.dto.RoleRequest;
import com.booking.backend.dto.UserResponse;
import com.booking.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.users();
    }

    @PatchMapping("/users/{id}/role")
    public UserResponse changeRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req) {
        return adminService.changeRole(id, req.role());
    }

    @GetMapping("/hotels")
    public List<HotelResponse> hotels() {
        return adminService.hotels();
    }

    @PostMapping("/hotels")
    @ResponseStatus(HttpStatus.CREATED)
    public HotelResponse createHotel(@Valid @RequestBody HotelCreateRequest req) {
        return adminService.createHotel(req);
    }

    @PatchMapping("/hotels/{id}/manager")
    public HotelResponse assignManager(@PathVariable Long id, @Valid @RequestBody ManagerRequest req) {
        return adminService.assignManager(id, req.managerId());
    }
}
