package com.retailflow.backend.tenant;

import com.retailflow.backend.tenant.dto.CreateTenantRequest;
import com.retailflow.backend.tenant.dto.TenantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantResponse createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug already exists");
        }
        if (tenantRepository.existsByName(request.getName())) {
            throw new RuntimeException("Tenant name already exists");
        }

        Tenant tenant = Tenant.builder()
                .name(request.getName())
                .slug(request.getSlug().toLowerCase())
                .status(TenantStatus.ACTIVE)
                .build();

        Tenant savedTenant = tenantRepository.save(tenant);

        return TenantResponse.builder()
                .id(savedTenant.getId())
                .name(savedTenant.getName())
                .slug(savedTenant.getSlug())
                .status(savedTenant.getStatus())
                .createdAt(savedTenant.getCreatedAt())
                .build();
    }
}
