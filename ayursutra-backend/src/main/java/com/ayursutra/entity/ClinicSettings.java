package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "clinic_settings")
public class ClinicSettings extends BaseEntity {

    @Indexed(unique = true)
    private String clinicId;

    private String clinicName;

    private String tagline;

    private String contactEmail;

    private String contactPhone;

    private String address;

    private String website;

    private String logoUrl;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private Double taxRate = 18.0;

    @Builder.Default
    private String invoicePrefix = "INV-";

    @Builder.Default
    private String invoiceNumberFormat = "INV-{YEAR}-{SEQ}";

    private List<String> paymentMethods;

    @Builder.Default
    private Integer lowStockThreshold = 10;

    private List<String> defaultStockUnits;

    @Builder.Default
    private Boolean alertOnLowStock = true;

    @Builder.Default
    private Integer appointmentSlotDurationMinutes = 30;

    @Builder.Default
    private Boolean autoConfirmAppointments = false;

    @Builder.Default
    private Boolean sendSmsNotifications = false;

    @Builder.Default
    private Boolean sendEmailNotifications = true;
}
