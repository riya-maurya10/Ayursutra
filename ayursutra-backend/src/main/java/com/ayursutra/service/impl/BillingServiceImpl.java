package com.ayursutra.service.impl;

import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.entity.BillingRecord;
import com.ayursutra.repository.BillingRepository;
import com.ayursutra.service.BillingService;
import com.ayursutra.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillingRepository billingRepository;
    private final NotificationService notificationService;

    @Override
    public List<BillingRecord> getAllBills() {
        return billingRepository.findAll();
    }

    @Override
    public List<BillingRecord> getBillsByPatientId(String patientId) {
        return billingRepository.findByPatientId(patientId);
    }

    @Override
    public BillingRecord getBillById(String id) {
        return billingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing record not found with ID: " + id));
    }

    @Override
    public BillingRecord createBill(BillingRecord bill) {
        if (bill.getInvoiceNumber() == null || bill.getInvoiceNumber().isBlank()) {
            String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            int randomSuffix = 1000 + new Random().nextInt(9000);
            bill.setInvoiceNumber("AYUR-" + datePrefix + "-" + randomSuffix);
        }

        if (bill.getInvoiceDate() == null) {
            bill.setInvoiceDate(LocalDate.now());
        }

        double total = bill.getTotalAmount() != null ? bill.getTotalAmount() : 0.0;
        double discount = bill.getDiscountAmount() != null ? bill.getDiscountAmount() : 0.0;
        double tax = bill.getTaxAmount() != null ? bill.getTaxAmount() : 0.0;
        double finalAmt = Math.max(0.0, total - discount + tax);
        bill.setFinalAmount(finalAmt);

        double paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : 0.0;
        double balance = Math.max(0.0, finalAmt - paid);
        bill.setBalanceAmount(balance);

        if (balance <= 0.0) {
            bill.setPaymentStatus("PAID");
        } else if (paid > 0.0) {
            bill.setPaymentStatus("PARTIALLY_PAID");
        } else {
            bill.setPaymentStatus("PENDING");
        }

        BillingRecord saved = billingRepository.save(bill);

        notificationService.sendNotificationToRole(
                Role.RECEPTIONIST,
                "New Invoice Generated",
                "Invoice " + saved.getInvoiceNumber() + " generated for " + saved.getPatientName() + " (Amount: ₹" + saved.getFinalAmount() + ")",
                NotificationType.BILLING_UPDATE,
                "/receptionist/billing"
        );

        if (saved.getPatientId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "New Bill Issued: " + saved.getInvoiceNumber(),
                    "An invoice of ₹" + saved.getFinalAmount() + " has been generated for your treatment.",
                    NotificationType.BILLING_UPDATE,
                    "/patient/dashboard"
            );
        }

        return saved;
    }

    @Override
    public BillingRecord recordPayment(String id, Double paymentAmount, String paymentMethod, String transactionRef) {
        BillingRecord bill = getBillById(id);

        double currentPaid = bill.getPaidAmount() != null ? bill.getPaidAmount() : 0.0;
        double newPaid = currentPaid + (paymentAmount != null ? paymentAmount : 0.0);
        bill.setPaidAmount(newPaid);

        double finalAmt = bill.getFinalAmount() != null ? bill.getFinalAmount() : 0.0;
        double newBalance = Math.max(0.0, finalAmt - newPaid);
        bill.setBalanceAmount(newBalance);

        if (paymentMethod != null && !paymentMethod.isBlank()) {
            bill.setPaymentMethod(paymentMethod);
        }
        if (transactionRef != null && !transactionRef.isBlank()) {
            bill.setTransactionRef(transactionRef);
        }

        if (newBalance <= 0.0) {
            bill.setPaymentStatus("PAID");
        } else if (newPaid > 0.0) {
            bill.setPaymentStatus("PARTIALLY_PAID");
        } else {
            bill.setPaymentStatus("PENDING");
        }

        BillingRecord saved = billingRepository.save(bill);

        notificationService.sendNotificationToRole(
                Role.RECEPTIONIST,
                "Payment Recorded",
                "Payment of ₹" + paymentAmount + " recorded for invoice " + saved.getInvoiceNumber() + " (" + saved.getPaymentStatus() + ")",
                NotificationType.BILLING_UPDATE,
                "/receptionist/billing"
        );

        if (saved.getPatientId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "Payment Received: " + saved.getInvoiceNumber(),
                    "We received your payment of ₹" + paymentAmount + ". Status: " + saved.getPaymentStatus(),
                    NotificationType.BILLING_UPDATE,
                    "/patient/dashboard"
            );
        }

        return saved;
    }
}
