package com.ayursutra.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class UserSettingsRequest {

    private String theme;

    private String language;

    private String dateFormat;

    private String timeZone;

    private Boolean emailNotifications;

    private Boolean appointmentAlerts;

    private Boolean therapyReminders;

    private Boolean billingAlerts;

    private String workingHoursStart;

    private String workingHoursEnd;

    private List<String> workingDays;

    private Boolean teleconsultationEnabled;

    private String profileVisibility;
}
