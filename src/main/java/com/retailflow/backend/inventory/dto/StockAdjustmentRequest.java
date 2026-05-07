package com.retailflow.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StockAdjustmentRequest {

    @NotNull
    private Integer quantityChange;

    @Size(max = 500)
    private String note;
}
