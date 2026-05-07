package com.retailflow.backend.common;

import com.retailflow.backend.inventory.InventoryMovement;
import com.retailflow.backend.inventory.InventoryMovementRepository;
import com.retailflow.backend.inventory.InventoryMovementType;
import com.retailflow.backend.product.Product;
import com.retailflow.backend.product.ProductRepository;
import com.retailflow.backend.product.ProductStatus;
import com.retailflow.backend.sale.PaymentMethod;
import com.retailflow.backend.sale.Sale;
import com.retailflow.backend.sale.SaleItem;
import com.retailflow.backend.sale.SaleItemRepository;
import com.retailflow.backend.sale.SaleRepository;
import com.retailflow.backend.sale.SaleStatus;
import com.retailflow.backend.tenant.Tenant;
import com.retailflow.backend.tenant.TenantRepository;
import com.retailflow.backend.tenant.TenantStatus;
import com.retailflow.backend.user.AppUser;
import com.retailflow.backend.user.UserRepository;
import com.retailflow.backend.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String TENANT_SLUG = "demo-store";
    private static final String OWNER_EMAIL = "owner@demo-store.com";
    private static final String CASHIER_EMAIL = "cashier@demo-store.com";
    private static final String DEFAULT_PASSWORD = "Password123!";
    private static final String PRODUCT_SKU = "IPH-15-PRO";
    private static final String DEMO_SALE_NUMBER = "DEMO-SALE-0001";

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Tenant tenant = seedTenant();
        AppUser owner = seedOwner(tenant);
        AppUser cashier = seedCashier(tenant);
        Product product = seedProduct(tenant);

        seedInitialStockMovementIfMissing(tenant, product, owner);
        seedDemoSaleIfMissing(tenant, product, cashier);

        log.info("Dev seed complete: tenant={}, owner={}, cashier={}, productSku={}",
                tenant.getSlug(), owner.getEmail(), cashier.getEmail(), product.getSku());
    }

    private Tenant seedTenant() {
        return tenantRepository.findBySlug(TENANT_SLUG)
                .orElseGet(() -> tenantRepository.save(Tenant.builder()
                        .name("Demo Store")
                        .slug(TENANT_SLUG)
                        .status(TenantStatus.ACTIVE)
                        .build()));
    }

    private AppUser seedOwner(Tenant tenant) {
        return userRepository.findByEmail(OWNER_EMAIL)
                .orElseGet(() -> userRepository.save(AppUser.builder()
                        .tenant(tenant)
                        .fullName("Demo Owner")
                        .email(OWNER_EMAIL)
                        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                        .role(UserRole.OWNER)
                        .enabled(true)
                        .build()));
    }

    private AppUser seedCashier(Tenant tenant) {
        return userRepository.findByEmail(CASHIER_EMAIL)
                .orElseGet(() -> userRepository.save(AppUser.builder()
                        .tenant(tenant)
                        .fullName("Demo Cashier")
                        .email(CASHIER_EMAIL)
                        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                        .role(UserRole.CASHIER)
                        .enabled(true)
                        .build()));
    }

    private Product seedProduct(Tenant tenant) {
        return productRepository.findByTenantAndStatusNotOrderByCreatedAtDesc(tenant, ProductStatus.DELETED)
                .stream()
                .filter(existing -> PRODUCT_SKU.equals(existing.getSku()))
                .findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .tenant(tenant)
                        .name("iPhone 15 Pro")
                        .sku(PRODUCT_SKU)
                        .description("Demo flagship phone")
                        .price(new BigDecimal("1199.99"))
                        .stockQuantity(12)
                        .status(ProductStatus.ACTIVE)
                        .build()));
    }

    private void seedInitialStockMovementIfMissing(Tenant tenant, Product product, AppUser owner) {
        boolean initialStockExists = inventoryMovementRepository
                .existsByTenantAndProductAndType(tenant, product, InventoryMovementType.INITIAL_STOCK);
        if (initialStockExists) {
            return;
        }

        inventoryMovementRepository.save(InventoryMovement.builder()
                .tenant(tenant)
                .product(product)
                .createdBy(owner)
                .type(InventoryMovementType.INITIAL_STOCK)
                .quantityChange(product.getStockQuantity())
                .stockAfter(product.getStockQuantity())
                .note("Seed initial stock")
                .build());
    }

    private void seedDemoSaleIfMissing(Tenant tenant, Product product, AppUser cashier) {
        if (saleRepository.findBySaleNumber(DEMO_SALE_NUMBER).isPresent()) {
            return;
        }

        int saleQty = 2;
        int stockAfterSale = Math.max(product.getStockQuantity() - saleQty, 0);

        Sale sale = saleRepository.save(Sale.builder()
                .tenant(tenant)
                .createdBy(cashier)
                .saleNumber(DEMO_SALE_NUMBER)
                .status(SaleStatus.COMPLETED)
                .paymentMethod(PaymentMethod.CARD)
                .totalAmount(product.getPrice().multiply(BigDecimal.valueOf(saleQty)))
                .build());

        saleItemRepository.save(SaleItem.builder()
                .sale(sale)
                .product(product)
                .productNameSnapshot(product.getName())
                .skuSnapshot(product.getSku())
                .quantity(saleQty)
                .unitPrice(product.getPrice())
                .lineTotal(product.getPrice().multiply(BigDecimal.valueOf(saleQty)))
                .build());

        product.setStockQuantity(stockAfterSale);
        productRepository.save(product);

        inventoryMovementRepository.save(InventoryMovement.builder()
                .tenant(tenant)
                .product(product)
                .createdBy(cashier)
                .type(InventoryMovementType.SALE)
                .quantityChange(-saleQty)
                .stockAfter(stockAfterSale)
                .note("Seed demo sale")
                .build());
    }
}
