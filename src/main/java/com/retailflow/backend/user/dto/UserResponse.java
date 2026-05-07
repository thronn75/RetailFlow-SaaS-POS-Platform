package com.retailflow.backend.user.dto;

import com.retailflow.backend.user.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private UUID tenantId;
    private String fullName;
    private String email;
    private UserRole role;
    private Boolean enabled;
}
