package com.retailflow.backend.inventory.dto;

import com.retailflow.backend.inventory.InventoryMovementType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InventoryMovementResponse {

    private UUID id;
    private UUID productId;
    private InventoryMovementType type;
    private Integer quantityChange;
    private Integer stockAfter;
    private String note;
    private Instant createdAt;
}
