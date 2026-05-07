package com.retailflow.backend.sale;

import com.retailflow.backend.sale.dto.CheckoutRequest;
import com.retailflow.backend.sale.dto.SaleResponse;
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
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'CASHIER')")
    public SaleResponse checkout(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody CheckoutRequest request
    ) {
        return saleService.checkout(user, request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public List<SaleResponse> listSales(@AuthenticationPrincipal AppUser user) {
        return saleService.listSales(user);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public SaleResponse getSale(
            @AuthenticationPrincipal AppUser user,
            @PathVariable UUID id
    ) {
        return saleService.getSale(user, id);
    }
}
