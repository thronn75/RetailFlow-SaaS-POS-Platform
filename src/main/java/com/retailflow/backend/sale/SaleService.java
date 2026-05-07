package com.retailflow.backend.sale;

import com.retailflow.backend.inventory.InventoryMovement;
import com.retailflow.backend.inventory.InventoryMovementRepository;
import com.retailflow.backend.inventory.InventoryMovementType;
import com.retailflow.backend.product.Product;
import com.retailflow.backend.product.ProductRepository;
import com.retailflow.backend.product.ProductStatus;
import com.retailflow.backend.sale.dto.CheckoutItemRequest;
import com.retailflow.backend.sale.dto.CheckoutRequest;
import com.retailflow.backend.sale.dto.SaleItemResponse;
import com.retailflow.backend.sale.dto.SaleResponse;
import com.retailflow.backend.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Transactional
    public SaleResponse checkout(AppUser user, CheckoutRequest request) {
        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        Sale sale = Sale.builder()
                .tenant(user.getTenant())
                .createdBy(user)
                .saleNumber(generateSaleNumber())
                .status(SaleStatus.COMPLETED)
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(BigDecimal.ZERO)
                .build();
        Sale savedSale = saleRepository.save(sale);

        for (CheckoutItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findByIdAndTenant(itemRequest.getProductId(), user.getTenant())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            if (product.getStatus() == ProductStatus.DELETED) {
                throw new RuntimeException("Product not found");
            }
            if (product.getStockQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            int newStock = product.getStockQuantity() - itemRequest.getQuantity();
            product.setStockQuantity(newStock);
            productRepository.save(product);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            total = total.add(lineTotal);

            SaleItem saleItem = SaleItem.builder()
                    .sale(savedSale)
                    .product(product)
                    .productNameSnapshot(product.getName())
                    .skuSnapshot(product.getSku())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(product.getPrice())
                    .lineTotal(lineTotal)
                    .build();
            SaleItem savedItem = saleItemRepository.save(saleItem);
            saleItems.add(savedItem);

            inventoryMovementRepository.save(
                    InventoryMovement.builder()
                            .tenant(user.getTenant())
                            .product(product)
                            .createdBy(user)
                            .type(InventoryMovementType.SALE)
                            .quantityChange(-itemRequest.getQuantity())
                            .stockAfter(newStock)
                            .note("Sale " + savedSale.getSaleNumber())
                            .build()
            );
        }

        savedSale.setTotalAmount(total);
        Sale finalSale = saleRepository.save(savedSale);
        return toResponse(finalSale, saleItems);
    }

    public List<SaleResponse> listSales(AppUser user) {
        return saleRepository.findByTenantOrderByCreatedAtDesc(user.getTenant())
                .stream()
                .map(sale -> toResponse(sale, saleItemRepository.findBySale(sale)))
                .toList();
    }

    public SaleResponse getSale(AppUser user, UUID saleId) {
        Sale sale = saleRepository.findByIdAndTenant(saleId, user.getTenant())
                .orElseThrow(() -> new RuntimeException("Sale not found"));
        return toResponse(sale, saleItemRepository.findBySale(sale));
    }

    private SaleResponse toResponse(Sale sale, List<SaleItem> items) {
        return SaleResponse.builder()
                .id(sale.getId())
                .saleNumber(sale.getSaleNumber())
                .status(sale.getStatus())
                .paymentMethod(sale.getPaymentMethod())
                .totalAmount(sale.getTotalAmount())
                .createdAt(sale.getCreatedAt())
                .items(items.stream().map(this::toItemResponse).toList())
                .build();
    }

    private SaleItemResponse toItemResponse(SaleItem item) {
        return SaleItemResponse.builder()
                .productId(item.getProduct().getId())
                .productName(item.getProductNameSnapshot())
                .sku(item.getSkuSnapshot())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .build();
    }

    private String generateSaleNumber() {
        return "SALE-" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
