package com.ayursutra.controller;

import com.ayursutra.entity.BillingRecord;
import com.ayursutra.service.BillingService;
import com.ayursutra.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ApiResponse<List<BillingRecord>> getAllBills() {
        return ApiResponse.success("Billing records retrieved", billingService.getAllBills());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ApiResponse<BillingRecord> getBillById(@PathVariable String id) {
        return ApiResponse.success("Billing record retrieved", billingService.getBillById(id));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ApiResponse<List<BillingRecord>> getBillsByPatientId(@PathVariable String patientId) {
        return ApiResponse.success("Patient billing records retrieved", billingService.getBillsByPatientId(patientId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<BillingRecord> createBill(@RequestBody BillingRecord bill) {
        return ApiResponse.success("Bill created successfully", billingService.createBill(bill));
    }

    @PatchMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<BillingRecord> recordPayment(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {
        Double paymentAmount = Double.valueOf(payload.getOrDefault("paymentAmount", 0).toString());
        String paymentMethod = payload.getOrDefault("paymentMethod", "UPI").toString();
        String transactionRef = payload.getOrDefault("transactionRef", "").toString();
        return ApiResponse.success("Payment recorded successfully",
                billingService.recordPayment(id, paymentAmount, paymentMethod, transactionRef));
    }
}
