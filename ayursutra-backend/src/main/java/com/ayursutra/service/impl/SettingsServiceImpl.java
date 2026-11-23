package com.ayursutra.service.impl;

import com.ayursutra.dto.request.ClinicSettingsRequest;
import com.ayursutra.dto.request.UserSettingsRequest;
import com.ayursutra.dto.response.ClinicSettingsResponse;
import com.ayursutra.dto.response.UserSettingsResponse;
import com.ayursutra.entity.ClinicSettings;
import com.ayursutra.entity.UserSettings;
import com.ayursutra.repository.ClinicSettingsRepository;
import com.ayursutra.repository.UserSettingsRepository;
import com.ayursutra.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private final ClinicSettingsRepository clinicSettingsRepository;
    private final UserSettingsRepository userSettingsRepository;

    private static final String DEFAULT_CLINIC_ID = "CLINIC-MAIN";

    @Override
    public ClinicSettingsResponse getClinicSettings(String clinicId) {
        String effectiveClinicId = (clinicId != null && !clinicId.isBlank()) ? clinicId : DEFAULT_CLINIC_ID;

        ClinicSettings settings = clinicSettingsRepository.findByClinicId(effectiveClinicId)
                .orElseGet(() -> createDefaultClinicSettings(effectiveClinicId));

        return toClinicResponse(settings);
    }

    @Override
    public ClinicSettingsResponse updateClinicSettings(String clinicId, ClinicSettingsRequest request) {
        String effectiveClinicId = (clinicId != null && !clinicId.isBlank()) ? clinicId : DEFAULT_CLINIC_ID;

        ClinicSettings settings = clinicSettingsRepository.findByClinicId(effectiveClinicId)
                .orElseGet(() -> createDefaultClinicSettings(effectiveClinicId));

        if (request.getClinicName() != null) settings.setClinicName(request.getClinicName());
        if (request.getTagline() != null) settings.setTagline(request.getTagline());
        if (request.getContactEmail() != null) settings.setContactEmail(request.getContactEmail());
        if (request.getContactPhone() != null) settings.setContactPhone(request.getContactPhone());
        if (request.getAddress() != null) settings.setAddress(request.getAddress());
        if (request.getWebsite() != null) settings.setWebsite(request.getWebsite());
        if (request.getLogoUrl() != null) settings.setLogoUrl(request.getLogoUrl());
        if (request.getCurrency() != null) settings.setCurrency(request.getCurrency());
        if (request.getTaxRate() != null) settings.setTaxRate(request.getTaxRate());
        if (request.getInvoicePrefix() != null) settings.setInvoicePrefix(request.getInvoicePrefix());
        if (request.getInvoiceNumberFormat() != null) settings.setInvoiceNumberFormat(request.getInvoiceNumberFormat());
        if (request.getPaymentMethods() != null) settings.setPaymentMethods(request.getPaymentMethods());
        if (request.getLowStockThreshold() != null) settings.setLowStockThreshold(request.getLowStockThreshold());
        if (request.getDefaultStockUnits() != null) settings.setDefaultStockUnits(request.getDefaultStockUnits());
        if (request.getAlertOnLowStock() != null) settings.setAlertOnLowStock(request.getAlertOnLowStock());
        if (request.getAppointmentSlotDurationMinutes() != null) settings.setAppointmentSlotDurationMinutes(request.getAppointmentSlotDurationMinutes());
        if (request.getAutoConfirmAppointments() != null) settings.setAutoConfirmAppointments(request.getAutoConfirmAppointments());
        if (request.getSendSmsNotifications() != null) settings.setSendSmsNotifications(request.getSendSmsNotifications());
        if (request.getSendEmailNotifications() != null) settings.setSendEmailNotifications(request.getSendEmailNotifications());

        ClinicSettings saved = clinicSettingsRepository.save(settings);
        return toClinicResponse(saved);
    }

    @Override
    public UserSettingsResponse getUserSettings(String userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultUserSettings(userId));

        return toUserResponse(settings);
    }

    @Override
    public UserSettingsResponse updateUserSettings(String userId, UserSettingsRequest request) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultUserSettings(userId));

        if (request.getTheme() != null) settings.setTheme(request.getTheme());
        if (request.getLanguage() != null) settings.setLanguage(request.getLanguage());
        if (request.getDateFormat() != null) settings.setDateFormat(request.getDateFormat());
        if (request.getTimeZone() != null) settings.setTimeZone(request.getTimeZone());
        if (request.getEmailNotifications() != null) settings.setEmailNotifications(request.getEmailNotifications());
        if (request.getAppointmentAlerts() != null) settings.setAppointmentAlerts(request.getAppointmentAlerts());
        if (request.getTherapyReminders() != null) settings.setTherapyReminders(request.getTherapyReminders());
        if (request.getBillingAlerts() != null) settings.setBillingAlerts(request.getBillingAlerts());
        if (request.getWorkingHoursStart() != null) settings.setWorkingHoursStart(request.getWorkingHoursStart());
        if (request.getWorkingHoursEnd() != null) settings.setWorkingHoursEnd(request.getWorkingHoursEnd());
        if (request.getWorkingDays() != null) settings.setWorkingDays(request.getWorkingDays());
        if (request.getTeleconsultationEnabled() != null) settings.setTeleconsultationEnabled(request.getTeleconsultationEnabled());
        if (request.getProfileVisibility() != null) settings.setProfileVisibility(request.getProfileVisibility());

        UserSettings saved = userSettingsRepository.save(settings);
        return toUserResponse(saved);
    }

    private ClinicSettings createDefaultClinicSettings(String clinicId) {
        ClinicSettings settings = ClinicSettings.builder()
                .clinicId(clinicId)
                .clinicName("AyurSutra Ayurvedic Clinic")
                .tagline("Holistic Healing & Traditional Panchakarma Care")
                .contactEmail("contact@ayursutra.clinic")
                .contactPhone("+91 98765 43210")
                .address("Sector 62, Noida, Uttar Pradesh, India")
                .website("https://ayursutra.clinic")
                .logoUrl("")
                .currency("INR")
                .taxRate(18.0)
                .invoicePrefix("INV-")
                .invoiceNumberFormat("INV-{YEAR}-{SEQ}")
                .paymentMethods(List.of("CASH", "UPI", "CARD", "NET_BANKING"))
                .lowStockThreshold(10)
                .defaultStockUnits(List.of("ml", "grams", "bottles", "tablets", "packs"))
                .alertOnLowStock(true)
                .appointmentSlotDurationMinutes(30)
                .autoConfirmAppointments(false)
                .sendSmsNotifications(false)
                .sendEmailNotifications(true)
                .build();
        return clinicSettingsRepository.save(settings);
    }

    private UserSettings createDefaultUserSettings(String userId) {
        UserSettings settings = UserSettings.builder()
                .userId(userId)
                .theme("light")
                .language("en")
                .dateFormat("DD/MM/YYYY")
                .timeZone("Asia/Kolkata")
                .emailNotifications(true)
                .appointmentAlerts(true)
                .therapyReminders(true)
                .billingAlerts(true)
                .workingHoursStart("09:00")
                .workingHoursEnd("18:00")
                .workingDays(List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"))
                .teleconsultationEnabled(true)
                .profileVisibility("CLINIC_WIDE")
                .build();
        return userSettingsRepository.save(settings);
    }

    private ClinicSettingsResponse toClinicResponse(ClinicSettings s) {
        return ClinicSettingsResponse.builder()
                .id(s.getId())
                .clinicId(s.getClinicId())
                .clinicName(s.getClinicName())
                .tagline(s.getTagline())
                .contactEmail(s.getContactEmail())
                .contactPhone(s.getContactPhone())
                .address(s.getAddress())
                .website(s.getWebsite())
                .logoUrl(s.getLogoUrl())
                .currency(s.getCurrency())
                .taxRate(s.getTaxRate())
                .invoicePrefix(s.getInvoicePrefix())
                .invoiceNumberFormat(s.getInvoiceNumberFormat())
                .paymentMethods(s.getPaymentMethods())
                .lowStockThreshold(s.getLowStockThreshold())
                .defaultStockUnits(s.getDefaultStockUnits())
                .alertOnLowStock(s.getAlertOnLowStock())
                .appointmentSlotDurationMinutes(s.getAppointmentSlotDurationMinutes())
                .autoConfirmAppointments(s.getAutoConfirmAppointments())
                .sendSmsNotifications(s.getSendSmsNotifications())
                .sendEmailNotifications(s.getSendEmailNotifications())
                .build();
    }

    private UserSettingsResponse toUserResponse(UserSettings s) {
        return UserSettingsResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .theme(s.getTheme())
                .language(s.getLanguage())
                .dateFormat(s.getDateFormat())
                .timeZone(s.getTimeZone())
                .emailNotifications(s.getEmailNotifications())
                .appointmentAlerts(s.getAppointmentAlerts())
                .therapyReminders(s.getTherapyReminders())
                .billingAlerts(s.getBillingAlerts())
                .workingHoursStart(s.getWorkingHoursStart())
                .workingHoursEnd(s.getWorkingHoursEnd())
                .workingDays(s.getWorkingDays())
                .teleconsultationEnabled(s.getTeleconsultationEnabled())
                .profileVisibility(s.getProfileVisibility())
                .build();
    }
}
