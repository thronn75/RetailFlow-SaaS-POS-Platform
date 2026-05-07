package com.retailflow.backend.sale.dto;

import com.retailflow.backend.sale.PaymentMethod;
import com.retailflow.backend.sale.SaleStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SaleResponse {

    private UUID id;
    private String saleNumber;
    private SaleStatus status;
    private PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private List<SaleItemResponse> items;
}
