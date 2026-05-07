package com.retailflow.backend.user;

import com.retailflow.backend.auth.dto.AuthResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    @GetMapping
    public AuthResponse me(@AuthenticationPrincipal AppUser user) {
        return AuthResponse.builder()
                .userId(user.getId())
                .tenantId(user.getTenant().getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Authenticated user")
                .build();
    }
}
