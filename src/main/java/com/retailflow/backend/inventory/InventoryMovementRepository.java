package com.retailflow.backend.inventory;

import com.retailflow.backend.product.Product;
import com.retailflow.backend.tenant.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    List<InventoryMovement> findByTenantAndProductOrderByCreatedAtDesc(
            Tenant tenant,
            Product product
    );

    boolean existsByTenantAndProductAndType(Tenant tenant, Product product, InventoryMovementType type);
}
