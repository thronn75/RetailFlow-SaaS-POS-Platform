package com.retailflow.backend.product;

import com.retailflow.backend.inventory.InventoryMovement;
import com.retailflow.backend.inventory.InventoryMovementRepository;
import com.retailflow.backend.inventory.InventoryMovementType;
import com.retailflow.backend.product.dto.CreateProductRequest;
import com.retailflow.backend.product.dto.ProductResponse;
import com.retailflow.backend.product.dto.UpdateProductRequest;
import com.retailflow.backend.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public ProductResponse createProduct(AppUser user, CreateProductRequest request) {
        String sku = request.getSku().toUpperCase();
        if (productRepository.existsByTenantAndSku(user.getTenant(), sku)) {
            throw new RuntimeException("Product SKU already exists for this tenant");
        }

        Product product = Product.builder()
                .tenant(user.getTenant())
                .name(request.getName())
                .sku(sku)
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .status(ProductStatus.ACTIVE)
                .build();

        Product savedProduct = productRepository.save(product);
        inventoryMovementRepository.save(
                InventoryMovement.builder()
                        .tenant(user.getTenant())
                        .product(savedProduct)
                        .createdBy(user)
                        .type(InventoryMovementType.INITIAL_STOCK)
                        .quantityChange(savedProduct.getStockQuantity())
                        .stockAfter(savedProduct.getStockQuantity())
                        .note("Initial stock on product creation")
                        .build()
        );
        return toResponse(savedProduct);
    }

    public List<ProductResponse> listProducts(AppUser user) {
        return productRepository
                .findByTenantAndStatusNotOrderByCreatedAtDesc(user.getTenant(), ProductStatus.DELETED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse updateProduct(AppUser user, UUID productId, UpdateProductRequest request) {
        Product product = productRepository.findByIdAndTenant(productId, user.getTenant())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (product.getStatus() == ProductStatus.DELETED) {
            throw new RuntimeException("Product not found");
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        return toResponse(productRepository.save(product));
    }

    public void deleteProduct(AppUser user, UUID productId) {
        Product product = productRepository.findByIdAndTenant(productId, user.getTenant())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (product.getStatus() == ProductStatus.DELETED) {
            return;
        }

        product.setStatus(ProductStatus.DELETED);
        productRepository.save(product);
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
