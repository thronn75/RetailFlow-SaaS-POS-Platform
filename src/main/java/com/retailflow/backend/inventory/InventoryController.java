package com.retailflow.backend.inventory;

import com.retailflow.backend.inventory.dto.InventoryMovementResponse;
import com.retailflow.backend.inventory.dto.StockAdjustmentRequest;
import com.retailflow.backend.user.AppUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products/{productId}/stock-adjustments")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public InventoryMovementResponse adjustStock(
            @AuthenticationPrincipal AppUser user,
            @PathVariable UUID productId,
            @Valid @RequestBody StockAdjustmentRequest request
    ) {
        return inventoryService.adjustStock(user, productId, request);
    }

    @GetMapping("/movements")
    public List<InventoryMovementResponse> getMovements(
            @AuthenticationPrincipal AppUser user,
            @PathVariable UUID productId
    ) {
        return inventoryService.getProductMovements(user, productId);
    }
}
