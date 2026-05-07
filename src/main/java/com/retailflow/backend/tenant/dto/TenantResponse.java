package com.retailflow.backend.tenant.dto;

import com.retailflow.backend.tenant.TenantStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TenantResponse {

    private UUID id;
    private String name;
    private String slug;
    private TenantStatus status;
    private Instant createdAt;
}
