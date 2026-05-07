package com.retailflow.backend.sale;

import com.retailflow.backend.tenant.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    List<Sale> findByTenantOrderByCreatedAtDesc(Tenant tenant);

    Optional<Sale> findByIdAndTenant(UUID id, Tenant tenant);

    Optional<Sale> findBySaleNumber(String saleNumber);

    long countByTenant(Tenant tenant);

    @Query("select coalesce(sum(s.totalAmount), 0) from Sale s where s.tenant = :tenant")
    BigDecimal sumTotalAmountByTenant(Tenant tenant);
}
