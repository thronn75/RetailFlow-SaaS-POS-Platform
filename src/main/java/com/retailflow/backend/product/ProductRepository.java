package com.retailflow.backend.product;

import com.retailflow.backend.tenant.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByTenantAndStatusNotOrderByCreatedAtDesc(
            Tenant tenant,
            ProductStatus status
    );

    Optional<Product> findByIdAndTenant(UUID id, Tenant tenant);

    boolean existsByTenantAndSku(Tenant tenant, String sku);

    long countByTenantAndStatus(Tenant tenant, ProductStatus status);

    long countByTenantAndStatusAndStockQuantityLessThanEqual(Tenant tenant, ProductStatus status, Integer stockQuantity);
}
