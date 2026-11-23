package com.ayursutra.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ClinicSettingsRequest {

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
