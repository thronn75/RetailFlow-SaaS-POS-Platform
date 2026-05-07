package com.retailflow.backend.report;

import com.retailflow.backend.product.ProductRepository;
import com.retailflow.backend.product.ProductStatus;
import com.retailflow.backend.report.dto.ReportSummaryResponse;
import com.retailflow.backend.sale.SaleRepository;
import com.retailflow.backend.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    public ReportSummaryResponse getSummary(AppUser user) {
        long totalSales = saleRepository.countByTenant(user.getTenant());
        long activeProducts = productRepository.countByTenantAndStatus(user.getTenant(), ProductStatus.ACTIVE);
        long lowStockProducts = productRepository.countByTenantAndStatusAndStockQuantityLessThanEqual(
                user.getTenant(),
                ProductStatus.ACTIVE,
                LOW_STOCK_THRESHOLD
        );

        return ReportSummaryResponse.builder()
                .totalSales(totalSales)
                .totalRevenue(saleRepository.sumTotalAmountByTenant(user.getTenant()))
                .activeProducts(activeProducts)
                .lowStockProducts(lowStockProducts)
                .build();
    }
}
