package com.retailflow.backend.auth.dto;

import com.retailflow.backend.user.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {

    private UUID userId;
    private UUID tenantId;
    private String fullName;
    private String email;
    private UserRole role;
    private String message;
    private String token;
}
