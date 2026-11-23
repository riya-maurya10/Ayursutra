package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicSettingsResponse {

    private String id;

    private String clinicId;

    private String clinicName;

    private String tagline;

    private String contactEmail;

    private String contactPhone;

    private String address;

    private String website;

    private String logoUrl;

    private String currency;

    private Double taxRate;

    private String invoicePrefix;

    private String invoiceNumberFormat;

    private List<String> paymentMethods;

    private Integer lowStockThreshold;

    private List<String> defaultStockUnits;

    private Boolean alertOnLowStock;

    private Integer appointmentSlotDurationMinutes;

    private Boolean autoConfirmAppointments;

    private Boolean sendSmsNotifications;

    private Boolean sendEmailNotifications;
}
