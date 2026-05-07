package com.retailflow.backend.inventory;

import com.retailflow.backend.inventory.dto.InventoryMovementResponse;
import com.retailflow.backend.inventory.dto.StockAdjustmentRequest;
import com.retailflow.backend.product.Product;
import com.retailflow.backend.product.ProductRepository;
import com.retailflow.backend.product.ProductStatus;
import com.retailflow.backend.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public InventoryMovementResponse adjustStock(
            AppUser user,
            UUID productId,
            StockAdjustmentRequest request
    ) {
        Product product = productRepository.findByIdAndTenant(productId, user.getTenant())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (product.getStatus() == ProductStatus.DELETED) {
            throw new RuntimeException("Product not found");
        }

        int newStock = product.getStockQuantity() + request.getQuantityChange();
        if (newStock < 0) {
            throw new RuntimeException("Stock cannot be negative");
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryMovement movement = inventoryMovementRepository.save(
                InventoryMovement.builder()
                        .tenant(user.getTenant())
                        .product(product)
                        .createdBy(user)
                        .type(InventoryMovementType.ADJUSTMENT)
                        .quantityChange(request.getQuantityChange())
                        .stockAfter(newStock)
                        .note(request.getNote())
                        .build()
        );
        return toResponse(movement);
    }

    public List<InventoryMovementResponse> getProductMovements(AppUser user, UUID productId) {
        Product product = productRepository.findByIdAndTenant(productId, user.getTenant())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (product.getStatus() == ProductStatus.DELETED) {
            throw new RuntimeException("Product not found");
        }
        return inventoryMovementRepository
                .findByTenantAndProductOrderByCreatedAtDesc(user.getTenant(), product)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return InventoryMovementResponse.builder()
                .id(movement.getId())
                .productId(movement.getProduct().getId())
                .type(movement.getType())
                .quantityChange(movement.getQuantityChange())
                .stockAfter(movement.getStockAfter())
                .note(movement.getNote())
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
