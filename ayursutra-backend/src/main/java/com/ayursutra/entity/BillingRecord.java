package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "billing_records")
public class BillingRecord extends BaseEntity {

    private String invoiceNumber;

    private String patientId;

    private String patientName;

    private String patientPhone;

    private String packageName; // e.g. "7-Day Rejuvenation Panchakarma", "14-Day Chronic Care Detox", "Individual Therapy"

    private String planId;

    private Double totalAmount;

    private Double discountAmount;

    private Double taxAmount;

    private Double finalAmount;

    private Double paidAmount;

    private Double balanceAmount;

    private String paymentStatus; // "PAID", "PARTIALLY_PAID", "PENDING"

    private String paymentMethod; // "UPI", "CARD", "CASH", "NET_BANKING"

    private String transactionRef;

    private LocalDate invoiceDate;

    private String notes;

}
