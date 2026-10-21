package com.booking.backend.security;

import com.booking.backend.entity.Role;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** The caller, read from the verified JWT of the current request. */
@Component
public class CurrentUser {

    public Long id() {
        return Long.valueOf(jwt().getSubject());
    }

    public Role role() {
        return Role.valueOf(jwt().getClaimAsString("role"));
    }

    public boolean isAdmin() {
        return role() == Role.ADMIN;
    }

    private Jwt jwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new AccessDeniedException("Not authenticated");
        }
        return jwt;
    }
}
