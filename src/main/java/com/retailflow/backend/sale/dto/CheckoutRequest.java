package com.retailflow.backend.sale.dto;

import com.retailflow.backend.sale.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {

    @NotNull
    private PaymentMethod paymentMethod;

    @Valid
    @NotEmpty
    private List<CheckoutItemRequest> items;
}
