package com.retailflow.backend.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReportSummaryResponse {

    private long totalSales;
    private BigDecimal totalRevenue;
    private long activeProducts;
    private long lowStockProducts;
}
